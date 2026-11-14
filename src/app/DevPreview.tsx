// 개발 전용(운영 빌드에서 제외): 로그인 없이 학습 화면을 샘플 데이터로 본다. /dev/study?view=path|lesson|result|onboarding
import { useState } from "react";
import type { Evaluation, QuestionSet } from "../lib/api";
import type { GameState } from "../lib/game";
import { AppShell } from "./AppShell";
import { Lesson } from "./Lesson";
import { Onboarding } from "./Onboarding";
import { PathHome } from "./PathHome";
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

export function DevPreview() {
  const view = new URLSearchParams(window.location.search).get("view") ?? "path";
  const [results, setResults] = useState<Record<number, Evaluation>>({ 2: EVAL, 3: { ...EVAL, predictedLevel: "IH" } });

  if (view === "onboarding") return <Onboarding onDone={() => {}} />;
  if (view === "lesson" || view === "result")
    return (
      <Lesson
        set={SET}
        index={view === "result" ? 0 : 2}
        results={results}
        plan="free"
        onClose={() => {}}
        onGo={() => {}}
        onEvaluated={(n, e) => {
          setResults({ ...results, [n]: e });
          return { gained: 10, streakUp: true, streak: 5, goalJustReached: true };
        }}
      />
    );
  return (
    <AppShell game={GAME} tokens={1} plan="free" onEditPrefs={() => {}}>
      <PathHome set={SET} results={results} busy={false} onOpen={() => {}} onNewSet={() => {}} />
    </AppShell>
  );
}
