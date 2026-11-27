import { useLayoutEffect, useState } from "react";
import { Icon } from "../assets/Icon";
import { createPortal } from "react-dom";

// 상단 불 · 번개 · 토큰이 뭔지 알려 주는 코치마크. 모든 사용자에게 뜨고,
// '다시 보지 않기'를 체크하면 이 계정(이 브라우저)에서는 다시 안 뜬다.
// ponytail: 기기별 저장 — 기기마다 따로 끄게 되면 서버 프로필로 옮긴다.

const STEPS = [
  { target: "streak", title: "불꽃 = 연속 학습일", body: "하루에 하나라도 학습하면 1일씩 늘어요. 하루를 쉬면 0으로 돌아가요." },
  { target: "level", title: "레벨 = 경험치 통", body: "학습 단계 · 보물상자 · 오픽게임 · 모의고사로 경험치를 채우면 레벨이 올라요. 레벨이 오를수록 통이 커져요." },
  { target: "token", title: "코인 = 오늘의 토큰", body: "학습 단계의 AI 분석에 1개씩 써요. 매일 자정에 다시 채워져요." },
  { target: "plus", title: "+ = 토큰 더 받기", body: "앱에서는 광고를 보고 토큰을 더 받을 수 있어요. 보물상자 · 오픽게임 · 하루 목표로도 받아요." },
];
const offKey = (uid: string) => `dailyopic:coach-off:${uid}`;

export function CoachMarks({ uid }: { uid: string }) {
  const [step, setStep] = useState<number | null>(() => {
    try {
      return localStorage.getItem(offKey(uid)) ? null : 0;
    } catch {
      return 0;
    }
  });
  const [never, setNever] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useLayoutEffect(() => {
    if (step === null) return;
    const place = () => {
      // 화면 폭에 따라 상단바 · 왼쪽 레일 · 오른쪽 현황판 중 지금 화면 안에 보이는 것을 가리킨다
      const el = [...document.querySelectorAll(`[data-coach="${STEPS[step].target}"]`)].find((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
      });
      setRect(el ? el.getBoundingClientRect() : null);
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [step]);

  if (step === null) return null;
  const close = () => {
    if (never) {
      try {
        localStorage.setItem(offKey(uid), "1");
      } catch {
        /* noop */
      }
    }
    setStep(null);
  };
  const last = step === STEPS.length - 1;
  const s = STEPS[step];
  const cardW = Math.min(320, window.innerWidth - 32);
  // 대상 아래에 자리가 없으면(약 260px) 위로 띄운다
  const below = rect ? window.innerHeight - rect.bottom > 260 : true;
  const cardStyle = rect
    ? {
        ...(below ? { top: rect.bottom + 14 } : { bottom: window.innerHeight - rect.top + 14 }),
        left: Math.max(16, Math.min(rect.left + rect.width / 2 - cardW / 2, window.innerWidth - cardW - 16)),
        width: cardW,
      }
    : { top: "30%", left: (window.innerWidth - cardW) / 2, width: cardW };

  return createPortal(
    <div className="coach" role="dialog" aria-modal="true" aria-labelledby="coach-title">
      {rect ? (
        <div className="coach-hole" style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }} />
      ) : (
        <div className="coach-dim" />
      )}
      <div className="coach-card" style={cardStyle}>
        <button className="coach-x" onClick={close} aria-label="설명 닫기">
          <Icon name="close" size={18} />
        </button>
        <p className="coach-step">
          {step + 1} / {STEPS.length}
        </p>
        <h2 id="coach-title">{s.title}</h2>
        <p>{s.body}</p>
        <label className="coach-never">
          <input type="checkbox" checked={never} onChange={(e) => setNever(e.target.checked)} /> 다시 보지 않기
        </label>
        <div className="coach-actions">
          {step > 0 && (
            <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>
              이전
            </button>
          )}
          <button className="btn btn-primary" onClick={() => (last ? close() : setStep(step + 1))}>
            {last ? "시작하기" : "다음"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
