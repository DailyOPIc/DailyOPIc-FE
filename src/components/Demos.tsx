import { useEffect, useRef, useState, type CSSProperties } from "react";

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

/** 04 루틴: 달력에 연속 학습이 채워지고, 단어 카드가 뒤집힌다. */
export function RoutineDemo() {
  const filled = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  return (
    <div className="demo demo-routine" data-reveal aria-hidden="true">
      <div className="cal">
        <div className="cal-head">
          <span>🔥 연속 학습</span>
          <b>D-16</b>
        </div>
        <div className="cal-grid">
          {Array.from({ length: 21 }, (_, n) => {
            const order = filled.indexOf(n);
            return (
              <span
                key={n}
                className={order >= 0 ? "on" : n === 13 ? "today" : undefined}
                style={order >= 0 ? i(order) : undefined}
              >
                {n + 1}
              </span>
            );
          })}
        </div>
      </div>
      <div className="flip">
        <div className="flip-inner">
          <div className="flip-face">
            <small>오늘의 단어 7/20</small>
            <b>strict</b>
            <span>🔊 발음 듣기</span>
          </div>
          <div className="flip-face flip-back">
            <small>뜻</small>
            <b>엄격한</b>
            <span>My teacher was strict but fair.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
