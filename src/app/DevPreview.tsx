// 개발 전용(운영 빌드에서 제외): 로그인 없이 학습 화면을 샘플 데이터로 본다. /dev/study?view=path|lesson|result|onboarding
import { useState } from "react";
import type { Evaluation, QuestionSet } from "../lib/api";
import type { GameState, Recorded } from "../lib/game";
import { quickCheck } from "../lib/quickcheck";
import { AppShell } from "./AppShell";
import { Lesson } from "./Lesson";
import { Onboarding } from "./Onboarding";
import { PathHome } from "./PathHome";
import { RandomSpeak } from "./RandomSpeak";
import { WordGames } from "./WordGames";
import "./app.css";

const sections = ["survey", "survey", "survey", "unexpected", "unexpected", "survey", "survey", "roleplay", "roleplay", "comparison", "comparison", "advanced", "advanced", "advanced"];
const SET: QuestionSet = {
  setId: "dev-set",
  expectedTargetLevel: "IH",
  initialLevel: 5,
  questions: sections.map((s, n) => ({
    number: n + 2,
    examSection: s,
    topic: "campus",
    prompt: "Describe a place on campus where you like to sit for a few minutes.",
    difficulty: "IM2",
  })),
};
const EVAL: Evaluation = {
  predictedLevel: "IM2",
  confidence: "medium",
  scores: { taskFulfillment: 82, grammar: 68, vocabulary: 74, discourse: 60, fluency: 78 },
  strengths: ["질문에 바로 답하며 장소를 분명히 말했어요.", "현재 시제를 안정적으로 썼어요."],
  improvements: ["이유를 2~3개 더해 답을 늘려 보세요.", "because, also 같은 연결어로 문장을 이어 보세요."],
  disclaimer: "AI 예상 등급이라 실제 시험 결과와 다를 수 있어요.",
  rubrics: [],
  warnings: [],
  answerQuality: "gradable",
};
const GAME: GameState = { xp: 120, streak: 4, bestStreak: 6, lastDay: null, today: "", todayCount: 2 };
const REWARD: Recorded = { state: { ...GAME, streak: 5, todayCount: 3 }, gained: 10, streakUp: true, goalJustReached: true };
const QC = quickCheck(
  "To be honest, I go to a cafe near my house because it is quiet. On top of that, the coffee is really good. So I usually study there, and also I meet my friends there on weekends. That's why I love it.",
  42,
);

export function DevPreview() {
  const view = new URLSearchParams(window.location.search).get("view") ?? "path";
  const [results, setResults] = useState<Record<number, Evaluation>>({ 2: EVAL, 3: { ...EVAL, predictedLevel: "IH" } });

  if (view === "onboarding") return <Onboarding onDone={() => {}} />;
  if (view === "lesson" || view === "result")
    return (
      <Lesson
        set={SET}
        index={view === "result" ? 0 : 3}
        results={results}
        practiced={{ 4: QC }}
        plan="free"
        tokens={1}
        onClose={() => {}}
        onGo={() => {}}
        onPracticed={() => REWARD}
        onEvaluated={(n, e) => {
          setResults({ ...results, [n]: e });
          return REWARD;
        }}
      />
    );
  return (
    <AppShell uid="dev" game={GAME} tokens={1} plan={new URLSearchParams(window.location.search).get("plan") ?? "free"} onEditPrefs={() => {}}>
      {view === "words" ? (
        <WordGames uid="dev" plan={new URLSearchParams(window.location.search).get("plan") ?? "free"} onReward={() => REWARD} onLimitUse={() => {}} />
      ) : view === "speak" ? (
        <RandomSpeak uid="dev" plan={new URLSearchParams(window.location.search).get("plan") ?? "free"} prefs={{ initialLevel: 5, survey: { status: "student", residence: "family", leisure: ["movies", "cafes"], hobbies: [], sports: ["jogging"], travel: [] } }} onReward={() => REWARD} onLimitUse={() => {}} />
      ) : (
        <PathHome set={SET} results={results} practiced={{ 4: QC, 5: { ...QC, stars: 1 } }} openedChests={[]} busy={false} onOpen={() => {}} onChest={() => {}} onNewSet={() => {}} />
      )}
    </AppShell>
  );
}
