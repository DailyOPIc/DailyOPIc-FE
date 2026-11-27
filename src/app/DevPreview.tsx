// 개발 전용(운영 빌드에서 제외): 로그인 없이 학습 화면을 샘플 데이터로 본다. /dev/study?view=path|lesson|result|onboarding
import { useState } from "react";
import type { Evaluation, QuestionSet } from "../lib/api";
import type { GameState, Recorded } from "../lib/game";
import { quickCheck } from "../lib/quickcheck";
import { AppShell } from "./AppShell";
import { Activity } from "./Activity";
import { Lesson } from "./Lesson";
import { MockExam, type Phase } from "./MockExam";
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

const PREFS = { initialLevel: 5, survey: { status: "student", residence: "family", leisure: ["movies", "cafes"], hobbies: [], sports: ["jogging"], travel: [] } };
const MOCK_SESSION = {
  sessionId: "dev",
  sessionHash: "dev",
  stage: "answering_tail" as const,
  setId: "dev-set",
  questionSet: { ...SET, questions: [{ ...SET.questions[0], number: 1 }, ...SET.questions] },
};
const MOCK_RESULT = {
  ...EVAL,
  targetGap: "IH까지는 이유와 예시를 더 길게 이어 말하는 연습이 필요해요.",
  overallFeedback: "질문 의도에 맞게 답했고 문장도 안정적이에요. 답변 길이를 늘리면 한 단계 올라갈 수 있어요.",
  perQuestion: [], // 서버 모의고사 채점은 문항별 피드백을 만들지 않는다(실제와 같게)
};
function seedActivity() {
  const log: Record<string, number> = {};
  for (let i = 0; i < 110; i++) if (i % 3) log[new Date(Date.now() + 9 * 3600e3 - i * 86400e3).toISOString().slice(0, 10)] = (i * 7) % 6;
  localStorage.setItem("dailyopic:activity:dev", JSON.stringify(log));
}

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
    <AppShell uid="dev" game={GAME} tokens={1} coachReady plan={new URLSearchParams(window.location.search).get("plan") ?? "free"} onEditPrefs={() => {}}>
      {view === "mock" ? (
        <MockExam
          prefs={PREFS}
          usage={{ freeRemaining: 1, bonusRemaining: 0, mockAvailable: true, mockRemaining: 1 }}
          onChanged={() => {}}
          onReward={() => {}}
          dev={{ phase: (new URLSearchParams(window.location.search).get("phase") ?? "intro") as Phase, session: MOCK_SESSION, result: MOCK_RESULT }}
        />
      ) : view === "activity" ? (
        (seedActivity(), <Activity uid="dev" game={GAME} />)
      ) : view === "words" ? (
        <WordGames uid="dev" plan={new URLSearchParams(window.location.search).get("plan") ?? "free"} onReward={() => REWARD} onLimitUse={() => {}} />
      ) : view === "speak" ? (
        <RandomSpeak uid="dev" plan={new URLSearchParams(window.location.search).get("plan") ?? "free"} prefs={{ initialLevel: 5, survey: { status: "student", residence: "family", leisure: ["movies", "cafes"], hobbies: [], sports: ["jogging"], travel: [] } }} onReward={() => REWARD} onLimitUse={() => {}} />
      ) : (
        <PathHome set={SET} results={results} practiced={{ 4: QC, 5: { ...QC, stars: 1 } }} openedChests={[]} busy={false} onOpen={() => {}} onChest={() => {}} onNewSet={() => {}} />
      )}
    </AppShell>
  );
}
