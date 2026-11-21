import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Mascot } from "../assets/Mascot";
import { api, type ApiError, type Evaluation, type QuestionSet, type Usage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { loadGame, recordActivity, XP, type GameState, type Recorded } from "../lib/game";
import { loadPrefs, savePrefs, type StudyPrefs } from "../lib/prefs";
import type { QuickCheck } from "../lib/quickcheck";
import { play, warmUp } from "../lib/sfx";
import { AppShell } from "./AppShell";
import { Lesson } from "./Lesson";
import { Onboarding } from "./Onboarding";
import { PathHome } from "./PathHome";
import { RandomSpeak } from "./RandomSpeak";
import { WordGames } from "./WordGames";
import "./app.css";

// 기기에 남기는 세트별 기록(서버에는 아직 없다)
function loadJSON<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "") as T;
  } catch {
    return fallback;
  }
}
function saveJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 저장이 막혀도 화면은 유지 */
  }
}
const K = {
  results: (id: string) => `dailyopic:results:${id}`,
  practiced: (id: string) => `dailyopic:practiced:${id}`,
  chests: (id: string) => `dailyopic:chests:${id}`,
};

export function StudyApp() {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <Splash text="불러오는 중…" />;
  // 도전장 링크(?vs=)로 들어와도 로그인 후 같은 링크로 돌아온다
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return <Study uid={user.uid} />;
}

function Study({ uid }: { uid: string }) {
  const { pathname } = useLocation();
  const view = pathname.startsWith("/study/speak") ? "speak" : pathname.startsWith("/study/words") ? "words" : "path";
  const [prefs, setPrefs] = useState<StudyPrefs | null>(() => loadPrefs(uid));
  const [editing, setEditing] = useState(false);
  const [set, setSet] = useState<QuestionSet | null>(null);
  const [results, setResults] = useState<Record<number, Evaluation>>({});
  const [practiced, setPracticed] = useState<Record<number, QuickCheck>>({});
  const [chests, setChests] = useState<number[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [plan, setPlan] = useState("free");
  const [game, setGame] = useState<GameState>(() => loadGame(uid));
  const [lesson, setLesson] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [, setLimitTick] = useState(0);
  const onLimitUse = useCallback(() => setLimitTick((t) => t + 1), []);
  const [error, setError] = useState<string | null>(null);

  const tokens = usage ? usage.freeRemaining + usage.bonusRemaining + (usage.purchasedTokens ?? 0) : null;
  const refreshUsage = useCallback(() => api.usage().then(setUsage).catch(() => {}), []);
  const reward = useCallback(
    (xp: number): Recorded => {
      const r = recordActivity(uid, xp);
      setGame(r.state);
      return r;
    },
    [uid],
  );

  // 플랜은 단계 · 설문과 상관없이 늘 필요하다(무료 한도 판단)
  useEffect(() => {
    api.capabilities().then((c) => setPlan(c.plan)).catch(() => {});
  }, []);

  useEffect(() => {
    // 첫 입력 때 효과음을 미리 풀어 둔다(브라우저 자동 재생 정책)
    const once = () => warmUp();
    window.addEventListener("pointerdown", once, { once: true });
    return () => window.removeEventListener("pointerdown", once);
  }, []);

  const applySet = (s: QuestionSet) => {
    setSet(s);
    setResults(loadJSON(K.results(s.setId), {}));
    setPracticed(loadJSON(K.practiced(s.setId), {}));
    setChests(loadJSON(K.chests(s.setId), []));
    setLesson(null);
  };

  useEffect(() => {
    if (!prefs) return;
    let cancelled = false;
    setBusy(true);
    setError(null);
    Promise.all([
      api.practiceSet({ initialLevel: prefs.initialLevel, survey: prefs.survey }, crypto.randomUUID()),
      api.usage(),
      api.capabilities().catch(() => ({ plan: "free" })),
    ])
      .then(([s, u, c]) => {
        if (cancelled) return;
        applySet(s);
        setUsage(u);
        setPlan(c.plan);
      })
      .catch((e: ApiError) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setBusy(false));
    return () => {
      cancelled = true;
    };
  }, [prefs]);

  // 단어 게임은 단계 · 설문이 필요 없다(도전장으로 처음 온 사람도 바로 대결)
  if ((!prefs && view !== "words") || editing)
    return (
      <Onboarding
        initial={prefs}
        onCancel={prefs ? () => setEditing(false) : undefined}
        onDone={(p) => {
          savePrefs(uid, p);
          setEditing(false);
          setPrefs(p);
        }}
      />
    );

  // 오늘의 세트 문항 화면(전체 화면)
  if (view === "path" && set && lesson !== null)
    return (
      <Lesson
        set={set}
        index={lesson}
        results={results}
        practiced={practiced}
        plan={plan}
        tokens={tokens}
        onClose={() => {
          setLesson(null);
          void refreshUsage();
        }}
        onGo={setLesson}
        onPracticed={(number, check) => {
          const first = !practiced[number];
          const prev = practiced[number];
          // 더 좋은 기록만 남긴다. 경험치는 문항당 처음 한 번.
          if (!prev || check.stars >= prev.stars) {
            const next = { ...practiced, [number]: check };
            setPracticed(next);
            saveJSON(K.practiced(set.setId), next);
          }
          return first ? reward(XP.practice) : null;
        }}
        onEvaluated={(number, evaluation) => {
          const next = { ...results, [number]: evaluation };
          setResults(next);
          saveJSON(K.results(set.setId), next);
          void refreshUsage();
          return reward(XP.aiAnswer);
        }}
      />
    );

  const newSet = async () => {
    if (!window.confirm("데일리 토큰 1개를 써서 새 문제 세트를 받을까요?")) return;
    setBusy(true);
    try {
      if (!prefs) return;
      applySet(await api.refreshSet({ initialLevel: prefs.initialLevel, survey: prefs.survey }, crypto.randomUUID()));
      play("start");
    } catch (e) {
      const err = e as ApiError;
      play("wrong", { volume: 0.5 });
      window.alert(err.isQuotaExhausted ? "오늘의 데일리 토큰을 모두 썼어요. 자정에 다시 채워져요." : err.message);
    } finally {
      setBusy(false);
      void refreshUsage();
    }
  };

  let content: ReactNode;
  if (view === "speak" && prefs) content = <RandomSpeak uid={uid} plan={plan} prefs={prefs} onReward={reward} onLimitUse={onLimitUse} />;
  else if (view === "words") content = <WordGames uid={uid} plan={plan} onReward={reward} onLimitUse={onLimitUse} />;
  else if (set)
    content = (
      <PathHome
        set={set}
        results={results}
        practiced={practiced}
        openedChests={chests}
        busy={busy}
        onOpen={setLesson}
        onNewSet={newSet}
        onChest={(n) => {
          const next = [...chests, n];
          setChests(next);
          saveJSON(K.chests(set.setId), next);
          reward(15);
          play("fanfare");
        }}
      />
    );
  else if (error)
    content = (
      <Splash text={error} inline>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          다시 시도
        </button>
      </Splash>
    );
  else content = <Splash text="오늘의 문제를 준비하고 있어요…" inline />;

  // 단어 게임 · 랜덤 스피킹 진행 화면은 각자 전체 화면을 쓰므로 틀 안에서도 그대로 보인다.
  return (
    <AppShell uid={uid} game={game} tokens={tokens} plan={plan} onEditPrefs={() => setEditing(true)}>
      {content}
    </AppShell>
  );
}

function Splash({ text, children, inline }: { text: string; children?: ReactNode; inline?: boolean }) {
  return (
    <div className={inline ? "splash inline" : "splash"}>
      <Mascot mood="think" size={110} />
      <p>{text}</p>
      {children}
    </div>
  );
}
