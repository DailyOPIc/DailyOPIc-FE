// 개발 전용(운영 빌드에서 제외): 로그인 없이 학습 화면을 샘플 데이터로 본다. /dev/study?view=path|lesson|result|onboarding
import { useState } from "react";
import type { Evaluation, QuestionSet } from "../lib/api";
import type { GameState, Recorded } from "../lib/game";
import { AppShell } from "./AppShell";
import { MyPage } from "./MyPage";
import { Lesson } from "./Lesson";
import { MockExam, type Phase } from "./MockExam";
import { Onboarding } from "./Onboarding";
import { PathHome } from "./PathHome";
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

export function DevPreview() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get("view") ?? "path";
  const [results, setResults] = useState<Record<number, Evaluation>>({ 2: EVAL, 3: { ...EVAL, predictedLevel: "IH" } });

  if (view === "onboarding") return <Onboarding onDone={() => {}} />;
  if (view === "lesson" || view === "result")
    return (
      <Lesson
        set={SET}
        index={view === "result" ? 0 : 3}
        stepNumber={view === "result" ? 1 : 4}
        done={3}
        steps={10}
        results={results}
        plan="free"
        tokens={1}
        onClose={() => {}}
        onNext={() => {}}
        onEvaluated={async (n, e) => {
          setResults({ ...results, [n]: e });
          return { ...REWARD, leveledUp: false, level: 3 };
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
        <MyPage
          onChanged={() => {}}
          dev={{
            profile: { nickname: params.get("nick") ?? "오픽왕", progress: { level: 7, xp: 2140, levelXp: 380, levelNeed: 836 }, streak: 4, bestStreak: 9, todayCount: 2, todayXp: 35, dailyGoal: 3 },
            days: Array.from({ length: 60 }, (_, i) => {
              const d = new Date(Date.now() + 9 * 3600e3 - i * 86400e3).toISOString().slice(0, 10).replaceAll("-", "");
              return { date: d, total: i % 4 ? (i * 7) % 9 : 0, xp: ((i * 13) % 90) + 10, counts: { step: (i * 3) % 5, game: i % 3, chest: i % 2, ...(i % 5 === 0 ? { mock: 1, goal: 1 } : {}) } };
            }),
          }}
        />
      ) : view === "words" ? (
        <WordGames plays={{ speed: 2, typing: 5 }} limit={5} onReward={async () => REWARD} onPlayed={() => {}} />
      ) : (
        <PathHome
          path={{
            chapter: Number(params.get("chapter") ?? 1),
            set: { ...SET, questions: SET.questions.slice(0, 10).map((q, i) => ({ ...q, number: i + 1 })) },
            done: Number(params.get("done") ?? 3),
            steps: 10,
            chestSlots: [4, 8, 10],
            claimedChests: [],
            nextLocked: params.get("locked") === "1",
          }}
          results={{ 1: EVAL, 2: { ...EVAL, predictedLevel: "IH" } }}
          fresh={params.get("fresh") === "1"}
          busy={false}
          plan="free"
          onOpen={() => {}}
          onChest={() => {}}
          onNextChapter={() => {}}
        />
      )}
    </AppShell>
  );
}
