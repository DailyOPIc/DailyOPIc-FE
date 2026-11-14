import type { CSSProperties } from "react";
import type { Evaluation, QuestionSet } from "../lib/api";
import { sfx } from "../lib/sfx";

export const SECTION: Record<string, { label: string; icon: string }> = {
  introduction: { label: "자기소개", icon: "👋" },
  survey: { label: "설문 주제", icon: "🎤" },
  unexpected: { label: "돌발 주제", icon: "⚡" },
  roleplay: { label: "롤플레이", icon: "🎭" },
  comparison: { label: "비교", icon: "⚖️" },
  advanced: { label: "심화", icon: "🚀" },
  practice: { label: "연습", icon: "🎯" },
};

type Props = {
  set: QuestionSet;
  results: Record<number, Evaluation>;
  busy: boolean;
  onOpen: (index: number) => void;
  onNewSet: () => void;
};

/** 오늘의 세트를 구불구불한 학습 경로로 보여준다. 다음에 할 문항이 통통 튄다. */
export function PathHome({ set, results, busy, onOpen, onNewSet }: Props) {
  const doneCount = set.questions.filter((q) => results[q.number]).length;
  const nextIndex = set.questions.findIndex((q) => !results[q.number]);
  const allDone = nextIndex === -1;

  return (
    <div className="path-page">
      <section className="unit-banner">
        <div>
          <p className="unit-kicker">오늘의 세트 · 목표 {set.expectedTargetLevel}</p>
          <h1>
            Q2 → Q15 실전 루틴
            <span>
              {doneCount} / {set.questions.length} 완료
            </span>
          </h1>
          <div className="unit-progress" aria-hidden="true">
            <span style={{ transform: `scaleX(${doneCount / set.questions.length})` }} />
          </div>
        </div>
        <button className="btn btn-on-dark" onClick={onNewSet} disabled={busy}>
          🔄 새 세트 · 토큰 1
        </button>
      </section>

      <ol className="path" aria-label="오늘의 문항">
        {set.questions.map((q, n) => {
          const done = Boolean(results[q.number]);
          const current = n === nextIndex;
          const section = SECTION[q.examSection] ?? { label: q.examSection, icon: "🎯" };
          const style = { "--x": `${Math.round(Math.sin(n * 0.85) * 120)}px` } as CSSProperties;
          return (
            <li key={q.number} className="path-step" style={style}>
              {current && <span className="path-bubble">시작!</span>}
              <button
                className={`node${done ? " done" : ""}${current ? " current" : ""}`}
                onClick={() => {
                  sfx.tap();
                  onOpen(n);
                }}
                aria-label={`Q${q.number} ${section.label}${done ? " 완료" : ""}`}
              >
                <span className="node-icon">{done ? "✓" : section.icon}</span>
                {done && <span className="node-grade">{results[q.number].predictedLevel}</span>}
              </button>
              <span className="node-label">
                Q{q.number} · {section.label}
              </span>
            </li>
          );
        })}
        <li className="path-step" style={{ "--x": "0px" } as CSSProperties}>
          <span className={`trophy${allDone ? " earned" : ""}`} aria-label={allDone ? "오늘의 세트 완주" : "완주 보상"}>
            🏆
          </span>
          <span className="node-label">{allDone ? "오늘의 세트 완주!" : "끝까지 가면 완주"}</span>
        </li>
      </ol>
    </div>
  );
}
