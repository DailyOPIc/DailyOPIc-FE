import { Fragment, type CSSProperties } from "react";
import { Icon, type IconName } from "../assets/Icon";
import { Mascot } from "../assets/Mascot";
import type { Evaluation, QuestionSet } from "../lib/api";
import type { QuickCheck } from "../lib/quickcheck";
import { play } from "../lib/sfx";

export const SECTION: Record<string, { label: string; icon: IconName }> = {
  introduction: { label: "자기소개", icon: "chat" },
  survey: { label: "설문 주제", icon: "mic" },
  unexpected: { label: "돌발 주제", icon: "dice" },
  roleplay: { label: "롤플레이", icon: "phone" },
  comparison: { label: "비교", icon: "compare" },
  advanced: { label: "심화", icon: "rocket" },
  practice: { label: "연습", icon: "target" },
};

// 이 문항까지 다 하면 상자가 열린다(인덱스 기준, 5문항마다).
export const CHEST_AFTER = [4, 9];

type Props = {
  set: QuestionSet;
  results: Record<number, Evaluation>;
  practiced: Record<number, QuickCheck>;
  openedChests: number[];
  busy: boolean;
  onOpen: (index: number) => void;
  onChest: (afterIndex: number) => void;
  onNewSet: () => void;
};

/** 오늘의 세트 학습 경로. 다음 문항이 통통 튀고, 5문항마다 보물상자가 있다. */
export function PathHome({ set, results, practiced, openedChests, busy, onOpen, onChest, onNewSet }: Props) {
  const isDone = (n: number) => Boolean(results[set.questions[n].number] || practiced[set.questions[n].number]);
  const doneCount = set.questions.filter((_, n) => isDone(n)).length;
  const nextIndex = set.questions.findIndex((_, n) => !isDone(n));
  const allDone = nextIndex === -1;
  const offset = (n: number) => ({ "--x": `${Math.round(Math.sin(n * 0.85) * 110)}px` }) as CSSProperties;

  return (
    <div className="path-page">
      <section className="unit-banner">
        <div className="unit-text">
          <p className="unit-kicker">오늘의 세트 · 목표 {set.expectedTargetLevel}</p>
          <h1>Q2 → Q15 실전 루틴</h1>
          <div className="unit-progress-row">
            <div className="unit-progress" aria-hidden="true">
              <span style={{ transform: `scaleX(${doneCount / set.questions.length})` }} />
            </div>
            <span>
              {doneCount}/{set.questions.length}
            </span>
          </div>
        </div>
        <button className="btn btn-on-dark" onClick={onNewSet} disabled={busy} title="데일리 토큰 1개">
          <Icon name="refresh" size={18} /> 새 세트
          <span className="cost">
            <Icon name="coin" size={16} />1
          </span>
        </button>
      </section>

      <div className="path-intro">
        <Mascot mood={allDone ? "happy" : doneCount === 0 ? "cheer" : "idle"} size={84} />
        <p className="talk-bubble small">
          {allDone
            ? "오늘의 세트 완주! 대단해요"
            : doneCount === 0
              ? "말하기 연습은 무료예요. 마음껏 말해 봐요!"
              : `좋아요! ${set.questions.length - doneCount}문항 남았어요`}
        </p>
      </div>

      <ol className="path" aria-label="오늘의 문항">
        {set.questions.map((q, n) => {
          const ai = results[q.number];
          const pr = practiced[q.number];
          const current = n === nextIndex;
          const section = SECTION[q.examSection] ?? SECTION.practice;
          const chestHere = CHEST_AFTER.includes(n);
          const chestReady = chestHere && set.questions.slice(0, n + 1).every((_, k) => isDone(k));
          const chestOpened = openedChests.includes(n);
          return (
            <Fragment key={q.number}>
              <li className="path-step" style={offset(n)}>
                {current && <span className="path-bubble">시작!</span>}
                <button
                  className={`node${ai ? " ai" : pr ? " practiced" : ""}${current ? " current" : ""}`}
                  onClick={() => {
                    play("select", { volume: 0.5 });
                    onOpen(n);
                  }}
                  aria-label={`Q${q.number} ${section.label}${ai ? ` AI ${ai.predictedLevel}` : pr ? " 연습 완료" : ""}`}
                >
                  {ai || pr ? (
                    <Icon name="check" size={34} className="node-check" />
                  ) : (
                    <Icon name={section.icon} size={34} />
                  )}
                  {ai && <span className="node-badge">{ai.predictedLevel}</span>}
                  {!ai && pr && (
                    <span className="node-stars" aria-hidden="true">
                      {[0, 1, 2].map((k) => (
                        <i key={k} className={k < pr.stars ? "on" : undefined} />
                      ))}
                    </span>
                  )}
                </button>
                <span className="node-label">
                  Q{q.number} · {section.label}
                </span>
              </li>
              {chestHere && (
                <li className="path-step" style={offset(n + 0.5)}>
                  <button
                    className={`chest${chestReady ? " ready" : ""}${chestOpened ? " opened" : ""}`}
                    disabled={!chestReady || chestOpened}
                    onClick={() => onChest(n)}
                    aria-label={chestOpened ? "열린 보물상자" : chestReady ? "보물상자 열기" : "잠긴 보물상자"}
                  >
                    <Icon name={chestOpened ? "sparkle" : "chest"} size={56} />
                  </button>
                  <span className="node-label">{chestOpened ? "+15 XP 받음" : chestReady ? "열어 보세요!" : `Q${q.number}까지 하면 열려요`}</span>
                </li>
              )}
            </Fragment>
          );
        })}
        <li className="path-step" style={offset(0)}>
          <span className={`trophy${allDone ? " earned" : ""}`} aria-label={allDone ? "완주" : "완주 보상"}>
            <Icon name="trophy" size={72} />
          </span>
          <span className="node-label">{allDone ? "오늘의 세트 완주!" : "끝까지 가면 완주"}</span>
        </li>
      </ol>
    </div>
  );
}
