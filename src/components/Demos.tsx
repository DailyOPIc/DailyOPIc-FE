import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Icon, type IconName } from "../assets/Icon";
import { Mascot } from "../assets/Mascot";

const i = (n: number) => ({ "--i": n }) as CSSProperties;

/** 로고가 선으로 그려지며 완성되고, 마이크에서 음파가 퍼진다. */
export function LogoBuild({ className = "" }: { className?: string }) {
  return (
    <span className={`logo-build ${className}`} aria-hidden="true">
      <span className="wave" />
      <span className="wave" style={i(1)} />
      <span className="wave" style={i(2)} />
      <svg viewBox="250 210 560 560" className="logo-svg">
        <path className="stroke s1" pathLength={1} d="M400 300 V515" strokeWidth={110} />
        <path className="stroke s2" pathLength={1} d="M303 505 A98 98 0 0 0 499 505" strokeWidth={34} />
        <path className="stroke s3" pathLength={1} d="M401 610 V688" strokeWidth={34} />
        <path className="stroke s4" pathLength={1} d="M372 695 H560" strokeWidth={50} />
        <path
          className="stroke s5"
          pathLength={1}
          d="M400 280 H548 C662 280 730 372 730 488 C730 610 660 695 545 695"
          strokeWidth={64}
        />
      </svg>
    </span>
  );
}

/** 말하는 중임을 보여주는 이퀄라이저 알약 */
export function VoicePill() {
  return (
    <span className="voice-pill" aria-hidden="true">
      {Array.from({ length: 14 }, (_, n) => (
        <span key={n} style={i(n)} />
      ))}
    </span>
  );
}

/** 화면에 들어오면 0에서 목표 숫자까지 올라간다. */
export function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(to);
      return;
    }
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 1400);
        setValue(Math.round(to * (1 - Math.pow(1 - t, 3))));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [to]);
  return (
    <span ref={ref}>
      {value.toLocaleString("ko-KR")}
      {suffix}
    </span>
  );
}

/** 01 오늘의 문제: 문항 칩이 넘어가고, 질문 듣기 → 녹음 */
export function QuestionDemo() {
  return (
    <div className="demo demo-question" data-reveal aria-hidden="true">
      <div className="q-chips">
        {["Q2", "Q3", "Q4", "Q5", "Q6", "Q7"].map((q, n) => (
          <span key={q} style={i(n)}>
            {q}
          </span>
        ))}
      </div>
      <div className="q-card">
        <span className="q-label">Q2 · 묘사</span>
        <p>Describe a place on campus where you like to sit.</p>
      </div>
      <div className="q-listen">
        <span className="bars">
          {[0, 1, 2, 3, 4].map((n) => (
            <span key={n} style={i(n)} />
          ))}
        </span>
        질문 듣기
      </div>
      <div className="q-mic">
        <span className="ring" />
        <span className="ring" style={i(1)} />
        <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor">
          <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
        </svg>
      </div>
      <p className="q-caption">탭하고 답변하기 · 3:00</p>
    </div>
  );
}

const AREAS: [string, number][] = [
  ["과제 충족", 82],
  ["문법", 68],
  ["어휘", 74],
  ["담화 구성", 60],
  ["유창성", 78],
];

/** 02 AI 분석: 예상 등급이 올라가고, 5개 영역 막대가 차오르고, 피드백이 도착한다. */
export function AnalysisDemo() {
  return (
    <div className="demo demo-analysis" data-reveal aria-hidden="true">
      <div className="grade-box">
        <span className="grade-box-label">OPIc 예상 등급</span>
        <span className="grade-roll-window">
          <span className="grade-roll">
            {["IL", "IM1", "IM2", "IM3", "IH"].map((g) => (
              <span key={g}>{g}</span>
            ))}
          </span>
        </span>
      </div>
      <ul className="areas">
        {AREAS.map(([name, value], n) => (
          <li key={name} style={{ ...i(n), "--v": `${value}%` } as CSSProperties}>
            <span>{name}</span>
            <span className="bar">
              <span />
            </span>
          </li>
        ))}
      </ul>
      <div className="fb">
        <span className="fb-good" style={i(0)}>
          잘한 점 · 질문에 바로 답했어요
        </span>
        <span className="fb-fix" style={i(1)}>
          개선할 점 · 이유를 2~3개 더하기
        </span>
      </div>
    </div>
  );
}

/* ───────── 랜딩 v4 장면: 게임 · 단어 게임 · 기록 대결 ───────── */

const BOARD_STEPS: { icon: IconName; done?: "ai" | "pr" }[] = [
  { icon: "mic", done: "ai" },
  { icon: "mic", done: "pr" },
  { icon: "dice", done: "pr" },
  { icon: "phone", done: "ai" },
  { icon: "compare", done: "pr" },
  { icon: "rocket" },
];

/** 학습 판이 하나씩 채워지고 보물상자가 열린다 */
export function BoardDemo() {
  return (
    <div className="demo demo-board" data-reveal aria-hidden="true">
      <div className="db-head">
        <span className="db-chip flame">
          <Icon name="flame" size={22} /> 12일 연속
        </span>
        <span className="db-chip bolt">
          <Icon name="bolt" size={22} /> <b className="db-xp">+15 XP</b>
        </span>
      </div>
      <div className="db-board">
        {BOARD_STEPS.map((s, n) => (
          <span key={n} className={`db-node${s.done ? ` ${s.done}` : " next"}`} style={i(n)}>
            {s.done ? <Icon name="check" size={26} /> : <Icon name={s.icon} size={26} />}
          </span>
        ))}
        <span className="db-chest" style={i(BOARD_STEPS.length)}>
          <Icon name="chest" size={40} />
          <i className="db-burst" />
        </span>
      </div>
      <div className="db-foot">
        <Mascot mood="happy" size={64} />
        <p>5문항마다 보물상자! 오늘의 목표 달성</p>
      </div>
    </div>
  );
}

const GAME_ICONS: IconName[] = ["timer", "keyboard", "book", "pencil", "target", "headphones", "sparkle"];
const TYPED = "To be honest,";

/** 게임 아이콘이 통통 나오고, 표현이 한 글자씩 쳐진다 */
export function GamesDemo() {
  return (
    <div className="demo demo-games" data-reveal aria-hidden="true">
      <div className="dg-icons">
        {GAME_ICONS.map((g, n) => (
          <span key={g} style={i(n)}>
            <Icon name={g} size={34} />
          </span>
        ))}
      </div>
      <div className="dg-type">
        {TYPED.split("").map((ch, n) => (
          <span key={n} style={i(n)}>
            {ch}
          </span>
        ))}
      </div>
      <div className="dg-meaning">솔직히 말하면,</div>
      <div className="dg-stats">
        <span>
          <b>312</b>타/분
        </span>
        <span className="combo">7 콤보</span>
        <span>
          <b>100</b>%
        </span>
      </div>
    </div>
  );
}

/** 같은 문제로 대결: 점수가 올라가고 이긴 쪽에 왕관 */
export function VersusDemo() {
  return (
    <div className="demo demo-versus" data-reveal aria-hidden="true">
      <div className="dv-row">
        <div className="dv-player me">
          <Mascot mood="happy" size={70} />
          <small>나</small>
          <b>
            <CountUp to={1180} />
          </b>
          <span className="dv-crown">
            <Icon name="trophy" size={34} />
          </span>
        </div>
        <span className="dv-vs">VS</span>
        <div className="dv-player">
          <Mascot mood="sad" size={70} />
          <small>친구</small>
          <b>
            <CountUp to={1080} />
          </b>
        </div>
      </div>
      <div className="dv-share">
        <span className="dv-bubble">
          <Icon name="chat" size={22} /> 도전장 링크
        </span>
        <span className="dv-bubble insta">스토리 이미지</span>
      </div>
      <p className="dv-note">같은 문제 · 같은 순서로 공정하게</p>
    </div>
  );
}
