import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { api, type ApiError, type Evaluation, type QuestionSet, type Usage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { loadGame, recordAnswer, type GameState } from "../lib/game";
import { loadPrefs, savePrefs, type StudyPrefs } from "../lib/prefs";
import { AppShell } from "./AppShell";
import { Lesson, type Celebration } from "./Lesson";
import { Onboarding } from "./Onboarding";
import { PathHome } from "./PathHome";
import "./app.css";

const resultsKey = (setId: string) => `dailyopic:results:${setId}`;

function loadResults(setId: string): Record<number, Evaluation> {
  try {
    return JSON.parse(localStorage.getItem(resultsKey(setId)) ?? "{}");
  } catch {
    return {};
  }
}

export function StudyApp() {
  const { user, ready } = useAuth();
  if (!ready) return <Splash text="불러오는 중…" />;
  if (!user) return <Navigate to="/login?next=/study" replace />;
  return <Study uid={user.uid} />;
}

function Study({ uid }: { uid: string }) {
  const [prefs, setPrefs] = useState<StudyPrefs | null>(() => loadPrefs(uid));
  const [editing, setEditing] = useState(false);
  const [set, setSet] = useState<QuestionSet | null>(null);
  const [results, setResults] = useState<Record<number, Evaluation>>({});
  const [usage, setUsage] = useState<Usage | null>(null);
  const [plan, setPlan] = useState("free");
  const [game, setGame] = useState<GameState>(() => loadGame(uid));
  const [lesson, setLesson] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tokens = usage ? usage.freeRemaining + usage.bonusRemaining : null;
  const refreshUsage = useCallback(() => api.usage().then(setUsage).catch(() => {}), []);

  const applySet = (s: QuestionSet) => {
    setSet(s);
    setResults(loadResults(s.setId));
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

  if (!prefs || editing)
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

  if (!set) {
    if (error)
      return (
        <Splash text={error}>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            다시 시도
          </button>
        </Splash>
      );
    return <Splash text="오늘의 문제를 준비하고 있어요…" />;
  }

  const onEvaluated = (number: number, evaluation: Evaluation): Celebration => {
    const next = { ...results, [number]: evaluation };
    setResults(next);
    try {
      localStorage.setItem(resultsKey(set.setId), JSON.stringify(next));
    } catch {
      /* 화면 결과는 유지 */
    }
    const r = recordAnswer(uid);
    setGame(r.state);
    void refreshUsage();
    return { gained: r.gained, streakUp: r.streakUp, streak: r.state.streak, goalJustReached: r.goalJustReached };
  };

  if (lesson !== null)
    return (
      <Lesson
        set={set}
        index={lesson}
        results={results}
        plan={plan}
        onClose={() => {
          setLesson(null);
          void refreshUsage();
        }}
        onGo={setLesson}
        onEvaluated={onEvaluated}
      />
    );

  const newSet = async () => {
    if (!window.confirm("데일리 토큰 1개를 써서 새 문제 세트를 받을까요?")) return;
    setBusy(true);
    try {
      applySet(await api.refreshSet({ initialLevel: prefs.initialLevel, survey: prefs.survey }, crypto.randomUUID()));
    } catch (e) {
      const err = e as ApiError;
      window.alert(err.isQuotaExhausted ? "오늘의 데일리 토큰을 모두 썼어요. 자정에 다시 채워져요." : err.message);
    } finally {
      setBusy(false);
      void refreshUsage();
    }
  };

  return (
    <AppShell game={game} tokens={tokens} plan={plan} onEditPrefs={() => setEditing(true)}>
      <PathHome set={set} results={results} busy={busy} onOpen={setLesson} onNewSet={newSet} />
    </AppShell>
  );
}

function Splash({ text, children }: { text: string; children?: ReactNode }) {
  return (
    <div className="splash">
      <img src="/images/logo-mark.png" alt="" width={72} height={72} className="buddy bounce" />
      <p>{text}</p>
      {children}
    </div>
  );
}
