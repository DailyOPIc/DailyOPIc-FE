import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Icon, type IconName } from "../assets/Icon";
import { Mascot } from "../assets/Mascot";
import type { Evaluation, PathState } from "../lib/api";
import { play } from "../lib/sfx";
import { Confetti } from "./Reward";

export const SECTION: Record<string, { label: string; icon: IconName }> = {
  introduction: { label: "자기소개", icon: "chat" },
  survey: { label: "설문 주제", icon: "mic" },
  unexpected: { label: "돌발 주제", icon: "dice" },
  roleplay: { label: "롤플레이", icon: "phone" },
  comparison: { label: "비교", icon: "compare" },
  advanced: { label: "심화", icon: "rocket" },
  practice: { label: "연습", icon: "target" },
};

type Props = {
  path: PathState;
  results: Record<number, Evaluation>;
  /** 방금 새 묶음이 열렸다 → 단계들이 아래에서 위로 하나씩 튀어나온다 */
  fresh: boolean;
  busy: boolean;
  plan: string;
  onOpen: (index: number) => void;
  onChest: (slot: number) => void;
  onNextChapter: () => void;
};

type Item = { kind: "step"; n: number } | { kind: "chest"; slot: number };

const ROW = 124; // 칸 사이 세로 간격(px): 동그라미 + 이름표가 이웃 칸과 겹치지 않게
const PAD = 70; // 위 · 아래 여백
// 듀오링고처럼 좌우로 굽이치는 길: 칸마다 가운데에서 벗어나는 비율
const WAVE = [0, 0.55, 0.9, 0.55, 0, -0.55, -0.9, -0.55];

function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(360);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

/** 학습 경로: 10단계 묶음이 아래에서 위로 올라간다. 지금 단계를 끝내야 다음 단계가 열린다. */
export function PathHome({ path, results, fresh, busy, plan, onOpen, onChest, onNextChapter }: Props) {
  const { ref, width } = useWidth();
  const { set, done, steps, chestSlots, claimedChests, chapter, nextLocked } = path;
  const first = (chapter - 1) * steps; // 이전 묶음까지 끝낸 단계 수
  const finished = done >= steps;

  const items: Item[] = [];
  for (let n = 1; n <= steps; n++) {
    items.push({ kind: "step", n });
    if (chestSlots.includes(n)) items.push({ kind: "chest", slot: n });
  }
  const height = PAD * 2 + (items.length - 1) * ROW;
  const amp = Math.max(0, Math.min(96, width / 2 - 64));
  const pos = (k: number) => ({ x: width / 2 + WAVE[k % WAVE.length] * amp, y: height - PAD - k * ROW });
  const reached = (item: Item) => (item.kind === "step" ? item.n <= done : item.slot <= done);
  const lastReached = items.reduce((acc, item, k) => (reached(item) ? k : acc), -1);
  const line = (upTo: number) =>
    items
      .slice(0, upTo + 1)
      .map((_, k) => `${pos(k).x},${pos(k).y}`)
      .join(" ");

  // 들어오면 지금 단계로 스크롤(새 묶음이면 첫 단계)
  const current = useRef<HTMLButtonElement>(null);
  // 페이지 이동 때 맨 위로 올리는 처리가 먼저 끝난 뒤에 스크롤한다.
  useEffect(() => {
    const t = window.setTimeout(() => current.current?.scrollIntoView({ block: "center", behavior: fresh ? "smooth" : "auto" }), 60);
    return () => window.clearTimeout(t);
  }, [chapter, done, fresh]);

  return (
    <div className="ladder-page">
      {fresh && <Confetti />}
      <section className="unit-banner ladder-banner">
        <div className="unit-text">
          <p className="unit-kicker">
            {chapter}번째 묶음 · 목표 {set.expectedTargetLevel}
          </p>
          <h1>
            {first + 1}~{first + steps}단계
          </h1>
          <div className="unit-progress-row">
            <div className="unit-progress" aria-hidden="true">
              <span style={{ transform: `scaleX(${done / steps})` }} />
            </div>
            <span>
              {done}/{steps}
            </span>
          </div>
        </div>
        <div className="unit-talk">
          <Mascot mood={finished ? "happy" : done === 0 ? "cheer" : "idle"} size={56} />
          <p>{finished ? "10단계 클리어!" : `지금 ${first + done + 1}단계예요`}</p>
        </div>
      </section>

      {finished && (
        <section className={`ladder-next${nextLocked ? " locked" : ""}`}>
          {nextLocked ? (
            <>
              <Icon name="lock" size={34} />
              <div>
                <strong>오늘의 10단계를 모두 끝냈어요!</strong>
                <p>
                  {plan === "free" ? "무료 플랜은 하루 10단계까지예요. 내일 새 단계가 열려요." : "오늘 열 수 있는 단계를 모두 열었어요. 내일 다시 만나요."}
                </p>
              </div>
              {plan === "free" && (
                <Link to="/membership" className="btn btn-primary">
                  계속하기
                </Link>
              )}
            </>
          ) : (
            <>
              <Icon name="sparkle" size={34} />
              <div>
                <strong>다음 10단계가 기다려요</strong>
                <p>새 문제는 AI가 바로 만들어 줘요.</p>
              </div>
              <button className="btn btn-primary" disabled={busy} onClick={onNextChapter}>
                {busy ? "만드는 중…" : "새 단계 열기"}
              </button>
            </>
          )}
        </section>
      )}

      <div className={`ladder${fresh ? " fresh" : ""}`} ref={ref} style={{ height }}>
        <svg className="ladder-trail" width={width} height={height} aria-hidden="true">
          <polyline points={line(items.length - 1)} className="trail-todo" />
          {lastReached > 0 && <polyline points={line(lastReached)} className="trail-done" />}
        </svg>

        {items.map((item, k) => {
          const { x, y } = pos(k);
          const style = { left: x, top: y, animationDelay: fresh ? `${k * 90}ms` : undefined };

          if (item.kind === "chest") {
            const ready = done >= item.slot;
            const opened = claimedChests.includes(item.slot);
            return (
              <div key={`chest-${item.slot}`} className="rung" style={style}>
                <button
                  className={`chest${ready ? " ready" : ""}${opened ? " opened" : ""}`}
                  disabled={!ready || opened || busy}
                  onClick={() => onChest(item.slot)}
                  aria-label={opened ? "열린 보물상자" : ready ? "보물상자 열기" : "잠긴 보물상자"}
                >
                  <Icon name={opened ? "sparkle" : "chest"} size={44} />
                </button>
                <span className="node-label">{opened ? "열었어요" : ready ? "열기!" : "보물상자"}</span>
              </div>
            );
          }

          const index = item.n - 1;
          const q = set.questions[index];
          const ai = results[q.number];
          const isDone = item.n <= done;
          const isCurrent = item.n === done + 1;
          const locked = item.n > done + 1;
          const section = SECTION[q.examSection] ?? SECTION.practice;
          return (
            <div key={q.number} className="rung" style={style}>
              <button
                ref={isCurrent ? current : undefined}
                className={`node${isDone ? " ai" : ""}${isCurrent ? " current" : ""}${locked ? " locked" : ""}`}
                disabled={locked}
                onClick={() => {
                  play("select", { volume: 0.5 });
                  onOpen(index);
                }}
                aria-label={`${first + item.n}단계 ${section.label}${isDone ? " 완료" : locked ? " 잠김" : ""}`}
              >
                {isDone ? <Icon name="check" size={30} className="node-check" /> : <Icon name={locked ? "lock" : section.icon} size={28} />}
                {ai && <span className="node-badge">{ai.predictedLevel}</span>}
                {isCurrent && <span className="node-start">시작</span>}
              </button>
              <span className="node-label">
                {first + item.n}단계
                {!isDone && <small>{section.label}</small>}
              </span>
            </div>
          );
        })}
      </div>

      {chapter > 1 && (
        <p className="ladder-past">
          <Icon name="check" size={16} /> 지난 {first}단계 완료
        </p>
      )}
    </div>
  );
}
