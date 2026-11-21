import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
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

// 이 문항(인덱스)까지 다 하면 상자가 열린다(5문항마다).
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

type Cell = { kind: "q"; index: number } | { kind: "chest"; after: number } | { kind: "trophy" };

/** 폭에 맞춰 열 수를 정한다: 넓으면 6, 중간 5, 좁으면 4, 아주 좁으면(320px 폰) 3. */
function useColumns() {
  const ref = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(5);
  // 첫 그리기 전에 한 번 재서 깜빡임 없이 시작하고, 이후 크기 변화는 ResizeObserver로
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pick = (w: number) => setCols(w >= 720 ? 6 : w >= 500 ? 5 : w >= 300 ? 4 : 3);
    pick(el.clientWidth);
    const ro = new ResizeObserver(([e]) => pick(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, cols };
}

/** 판 안 각 칸의 동그라미 중심(px)과 판 크기. 판 크기가 바뀌면 다시 잰다. */
function useTrail(ref: React.RefObject<HTMLDivElement | null>, layoutKey: string) {
  const [trail, setTrail] = useState<{ w: number; h: number; points: [number, number][] }>({ w: 100, h: 100, points: [] });
  useLayoutEffect(() => {
    const board = ref.current;
    if (!board) return;
    const measure = () => {
      const points = [...board.querySelectorAll<HTMLElement>(":scope > .cell")].map((cell) => {
        const a = cell.firstElementChild as HTMLElement | null;
        const x = cell.offsetLeft + (a ? a.offsetLeft + a.offsetWidth / 2 : cell.offsetWidth / 2);
        const y = cell.offsetTop + (a ? a.offsetTop + a.offsetHeight / 2 : cell.offsetHeight / 2);
        return [Math.round(x), Math.round(y)] as [number, number];
      });
      setTrail({ w: board.clientWidth || 100, h: board.clientHeight || 100, points });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(board);
    return () => ro.disconnect();
  }, [ref, layoutKey]);
  return trail;
}

/** 오늘의 세트 학습 판: 보드게임처럼 줄마다 방향을 바꿔 한 화면에 들어간다. */
export function PathHome({ set, results, practiced, openedChests, busy, onOpen, onChest, onNewSet }: Props) {
  const { ref, cols } = useColumns();
  const isDone = (n: number) => Boolean(results[set.questions[n].number] || practiced[set.questions[n].number]);
  const doneCount = set.questions.filter((_, n) => isDone(n)).length;
  const nextIndex = set.questions.findIndex((_, n) => !isDone(n));
  const allDone = nextIndex === -1;

  const cells: Cell[] = [];
  set.questions.forEach((_, n) => {
    cells.push({ kind: "q", index: n });
    if (CHEST_AFTER.includes(n)) cells.push({ kind: "chest", after: n });
  });
  cells.push({ kind: "trophy" });

  const rows = Math.ceil(cells.length / cols);
  // 뱀 모양 배치: 짝수 줄은 왼→오, 홀수 줄은 오→왼
  const place = (k: number) => {
    const row = Math.floor(k / cols);
    const c = k % cols;
    return { row, col: row % 2 === 0 ? c : cols - 1 - c };
  };
  // 길은 칸 중심이 아니라 실제 동그라미(칸의 첫 요소) 중심을 잇는다.
  // 칸 안에서 동그라미는 이름표 때문에 위로 올라가 있고, 판에는 위쪽 여백도 있어서
  // 칸 비율로 계산하면 점선이 동그라미 위로 어긋난다. 등장 애니메이션(transform)에
  // 흔들리지 않게 offset(레이아웃 위치)으로 잰다.
  const trail = useTrail(ref, `${cols}:${cells.length}`);
  // 지나온 길: 마지막으로 끝낸 칸까지 보라색
  const lastDoneCell = cells.reduce((acc, c, k) => (c.kind === "q" && isDone(c.index) ? k : acc), -1);
  const points = (upTo: number) =>
    trail.points
      .slice(0, upTo + 1)
      .map((p) => p.join(","))
      .join(" ");

  return (
    <div className="board-page">
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
        <div className="unit-side">
          <div className="unit-talk">
            <Mascot mood={allDone ? "happy" : doneCount === 0 ? "cheer" : "idle"} size={56} />
            <p>{allDone ? "완주! 대단해요" : doneCount === 0 ? "연습은 무료! 마음껏 말해요" : `${set.questions.length - doneCount}문항 남았어요`}</p>
          </div>
          <button className="btn btn-on-dark" onClick={onNewSet} disabled={busy} aria-label="새 세트 받기, 데일리 토큰 1개">
            <Icon name="refresh" size={18} /> 새 세트
            <span className="cost">
              <Icon name="coin" size={16} />1
            </span>
          </button>
        </div>
      </section>

      <div className="board" ref={ref} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`, "--rows": rows, "--cols": cols } as CSSProperties}>
        <svg className="board-trail" viewBox={`0 0 ${trail.w} ${trail.h}`} aria-hidden="true">
          <polyline points={points(cells.length - 1)} className="trail-todo" />
          {lastDoneCell > 0 && <polyline points={points(lastDoneCell)} className="trail-done" />}
        </svg>

        {cells.map((cell, k) => {
          const { row, col } = place(k);
          const style = { gridRow: row + 1, gridColumn: col + 1, animationDelay: `${k * 35}ms` };

          if (cell.kind === "trophy")
            return (
              <div key="trophy" className="cell" style={style}>
                <span className={`trophy${allDone ? " earned" : ""}`} aria-label={allDone ? "완주" : "완주 보상"}>
                  <Icon name="trophy" size={56} />
                </span>
                <span className="node-label">{allDone ? "완주!" : "완주"}</span>
              </div>
            );

          if (cell.kind === "chest") {
            const ready = set.questions.slice(0, cell.after + 1).every((_, n) => isDone(n));
            const opened = openedChests.includes(cell.after);
            return (
              <div key={`chest-${cell.after}`} className="cell" style={style}>
                <button
                  className={`chest${ready ? " ready" : ""}${opened ? " opened" : ""}`}
                  disabled={!ready || opened}
                  onClick={() => onChest(cell.after)}
                  aria-label={opened ? "열린 보물상자" : ready ? "보물상자 열기" : "잠긴 보물상자"}
                >
                  <Icon name={opened ? "sparkle" : "chest"} size={48} />
                </button>
                <span className="node-label">{opened ? "+15 XP" : ready ? "열기!" : "보물상자"}</span>
              </div>
            );
          }

          const q = set.questions[cell.index];
          const ai = results[q.number];
          const pr = practiced[q.number];
          const current = cell.index === nextIndex;
          const section = SECTION[q.examSection] ?? SECTION.practice;
          return (
            <div key={q.number} className="cell" style={style}>
              <button
                className={`node${ai ? " ai" : pr ? " practiced" : ""}${current ? " current" : ""}`}
                onClick={() => {
                  play("select", { volume: 0.5 });
                  onOpen(cell.index);
                }}
                aria-label={`Q${q.number} ${section.label}${ai ? ` AI ${ai.predictedLevel}` : pr ? " 연습 완료" : ""}`}
              >
                {ai || pr ? <Icon name="check" size={30} className="node-check" /> : <Icon name={section.icon} size={30} />}
                {ai && <span className="node-badge">{ai.predictedLevel}</span>}
                {current && <span className="node-start">시작</span>}
              </button>
              <span className="node-label">
                Q{q.number}
                {!ai && pr && (
                  <span className="node-stars" aria-label={`별 ${pr.stars}개`}>
                    {[0, 1, 2].map((s) => (
                      <i key={s} className={s < pr.stars ? "on" : undefined} />
                    ))}
                  </span>
                )}
                {!pr && !ai && <small>{section.label}</small>}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
