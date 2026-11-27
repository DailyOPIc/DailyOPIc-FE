import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Mascot } from "../assets/Mascot";
import { api, type ApiError, type Evaluation, type LevelProgress, type PathState, type Profile, type Usage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { loadGame, recordActivity, type GameState, type Recorded } from "../lib/game";
import { diffProfiles, importLegacyOnce, toGameState, type Gain } from "../lib/progress";
import { REFRESH_EVENT } from "../lib/native";
import { announce, claimActivityToken } from "../lib/tokens";
import { loadPrefs, savePrefs, type StudyPrefs } from "../lib/prefs";
import { play, warmUp } from "../lib/sfx";
import { AppShell } from "./AppShell";
import { Activity } from "./Activity";
import { Lesson } from "./Lesson";
import { MockExam } from "./MockExam";
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
  const view = (["speak", "words", "mock", "activity"] as const).find((v) => pathname.startsWith(`/study/${v}`)) ?? "path";
  const [prefs, setPrefs] = useState<StudyPrefs | null>(() => loadPrefs(uid));
  const [editing, setEditing] = useState(false);
  const [path, setPath] = useState<PathState | null>(null);
  const [fresh, setFresh] = useState(false);
  const [results, setResults] = useState<Record<number, Evaluation>>({});
  const [usage, setUsage] = useState<Usage | null>(null);
  const [plan, setPlan] = useState("free");
  // 레벨 · XP · 스트릭은 서버가 기준. 처음 받기 전에는 이 브라우저의 예전 값으로 그린다.
  const [game, setGame] = useState<GameState>(() => loadGame(uid));
  const profile = useRef<Profile | null>(null);
  const [level, setLevel] = useState<LevelProgress | null>(null);
  const [lesson, setLesson] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [, setLimitTick] = useState(0);
  const onLimitUse = useCallback(() => setLimitTick((t) => t + 1), []);
  const [error, setError] = useState<string | null>(null);

  const tokens = usage ? usage.freeRemaining + usage.bonusRemaining + (usage.purchasedTokens ?? 0) : null;
  const refreshUsage = useCallback(() => api.usage().then(setUsage).catch(() => {}), []);
  /** 서버 프로필을 다시 읽고, 이전 값과 비교한 보상(+XP · 연속 · 목표 · 레벨업)을 돌려준다. */
  const syncProgress = useCallback(async (): Promise<Gain | null> => {
    try {
      const after = await api.profile();
      const gain = diffProfiles(profile.current, after);
      profile.current = after;
      setGame(toGameState(after));
      setLevel(after.progress);
      if (gain.goalJustReached) void claimActivityToken("goal", "오늘의 목표 달성");
      return gain;
    } catch {
      return null;
    }
  }, []);
  // 아직 서버로 옮기지 않은 활동(오픽게임)은 예전처럼 기기에 기록한다.
  // ponytail: 오픽게임이 /v1/games/plays/finish 로 옮겨 가면 지운다(단계 7).
  const reward = useCallback(
    (xp: number): Recorded => {
      const r = recordActivity(uid, xp);
      setGame(r.state);
      return r;
    },
    [uid],
  );

  useEffect(() => {
    void importLegacyOnce(uid).finally(() => void syncProgress());
  }, [uid, syncProgress]);

  // 플랜은 단계 · 설문과 상관없이 늘 필요하다(무료 한도 판단). 앱에서 결제 화면을 닫으면 다시 읽는다.
  useEffect(() => {
    const load = () => {
      api.capabilities().then((c) => setPlan(c.plan)).catch(() => {});
      void refreshUsage();
    };
    load();
    window.addEventListener(REFRESH_EVENT, load);
    return () => window.removeEventListener(REFRESH_EVENT, load);
  }, [refreshUsage]);

  useEffect(() => {
    // 첫 입력 때 효과음을 미리 풀어 둔다(브라우저 자동 재생 정책)
    const once = () => warmUp();
    window.addEventListener("pointerdown", once, { once: true });
    return () => window.removeEventListener("pointerdown", once);
  }, []);

  const applyPath = (p: PathState) => {
    setPath(p);
    setResults(loadJSON(K.results(p.set.setId), {}));
  };

  useEffect(() => {
    if (!prefs) return;
    let cancelled = false;
    setBusy(true);
    setError(null);
    Promise.all([
      api.path({ initialLevel: prefs.initialLevel, survey: prefs.survey }),
      api.usage(),
      api.capabilities().catch(() => ({ plan: "free" })),
    ])
      .then(([p, u, c]) => {
        if (cancelled) return;
        applyPath(p);
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
  // 오픽게임 · 활동은 설문 없이도 열린다
  if ((!prefs && view !== "words" && view !== "activity") || editing)
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

  // 학습 단계 화면(전체 화면)
  if (view === "path" && path && lesson !== null) {
    const closeLesson = () => {
      setLesson(null);
      void refreshUsage();
    };
    return (
      <Lesson
        set={path.set}
        index={lesson}
        stepNumber={(path.chapter - 1) * path.steps + lesson + 1}
        done={path.done}
        steps={path.steps}
        results={results}
        plan={plan}
        tokens={tokens}
        onClose={closeLesson}
        onNext={() => {
          // 다음 단계는 방금 끝낸 단계 바로 뒤만 열린다. 묶음 끝이면 경로로 돌아가 다음 묶음을 연다.
          if (lesson + 1 < path.steps && lesson + 1 <= path.done) setLesson(lesson + 1);
          else closeLesson();
        }}
        onEvaluated={async (number, evaluation) => {
          const next = { ...results, [number]: evaluation };
          setResults(next);
          saveJSON(K.results(path.set.setId), next);
          void refreshUsage();
          // 서버가 단계를 올렸다(분석 성공 = 단계 완료). 경로 · XP를 다시 읽는다.
          if (prefs) setPath(await api.path({ initialLevel: prefs.initialLevel, survey: prefs.survey }).catch(() => path));
          return syncProgress();
        }}
      />
    );
  }

  const nextChapter = async () => {
    if (!prefs) return;
    setBusy(true);
    try {
      applyPath(await api.nextChapter({ initialLevel: prefs.initialLevel, survey: prefs.survey }));
      setFresh(true);
      play("fanfare");
      window.setTimeout(() => setFresh(false), 2600);
    } catch (e) {
      const err = e as ApiError;
      play("wrong", { volume: 0.5 });
      // 무료 하루 한도 등: 경로를 다시 읽으면 잠금 안내가 그려진다
      window.alert(err.message);
      setPath(await api.path({ initialLevel: prefs.initialLevel, survey: prefs.survey }).catch(() => path));
    } finally {
      setBusy(false);
    }
  };

  const openChest = async (slot: number) => {
    setBusy(true);
    try {
      const r = await api.openChest(slot);
      play("fanfare");
      if (path) setPath({ ...path, claimedChests: [...path.claimedChests, slot] });
      if (r.tokenGranted) announce("보물상자");
      void refreshUsage();
      void syncProgress();
    } catch (e) {
      window.alert((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  };

  let content: ReactNode;
  let loading = false;
  if (view === "speak" && prefs) content = <RandomSpeak uid={uid} plan={plan} prefs={prefs} onReward={reward} onLimitUse={onLimitUse} />;
  else if (view === "mock" && prefs) content = <MockExam prefs={prefs} usage={usage} onChanged={() => void refreshUsage()} onReward={() => void syncProgress()} />;
  else if (view === "activity") content = <Activity uid={uid} game={game} />;
  else if (view === "words") content = <WordGames uid={uid} plan={plan} onReward={reward} onLimitUse={onLimitUse} />;
  else if (path)
    content = (
      <PathHome
        path={path}
        results={results}
        fresh={fresh}
        busy={busy}
        plan={plan}
        onOpen={setLesson}
        onChest={(slot) => void openChest(slot)}
        onNextChapter={() => void nextChapter()}
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
  else {
    loading = true;
    content = <Splash text="오늘의 문제를 준비하고 있어요…" inline />;
  }

  // 단어 게임 · 랜덤 스피킹 진행 화면은 각자 전체 화면을 쓰므로 틀 안에서도 그대로 보인다.
  return (
    <AppShell
      uid={uid}
      game={game}
      tokens={tokens}
      level={level}
      ads={usage?.adRewardsMax ? { used: usage.adRewardsUsed ?? 0, max: usage.adRewardsMax } : null}
      plan={plan}
      coachReady={!loading}
      onEditPrefs={() => setEditing(true)}
    >
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
