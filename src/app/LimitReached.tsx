import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../assets/Icon";
import { Mascot } from "../assets/Mascot";
import { FREE_DAILY, LIMIT_LABEL, msUntilReset, type LimitKind } from "../lib/limits";

const pad = (n: number) => String(n).padStart(2, "0");

/** 다음 초기화까지 실시간 카운트다운 */
export function useCountdown() {
  const [ms, setMs] = useState(msUntilReset);
  useEffect(() => {
    const id = window.setInterval(() => setMs(msUntilReset()), 1000);
    return () => clearInterval(id);
  }, []);
  const s = Math.floor(ms / 1000);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

/** 오늘의 무료 한도를 다 썼을 때: 잠자는 마스코트 · 자정까지 카운트다운 · 다른 무료 활동 안내 */
export function LimitReached({ kind, onBack }: { kind: LimitKind; onBack?: () => void }) {
  const left = useCountdown();
  return (
    <div className="limit-page">
      <Mascot mood="sleep" size={140} />
      <p className="eyebrow">오늘의 무료 {LIMIT_LABEL[kind]}를 다 했어요</p>
      <h1>
        {FREE_DAILY[kind]}
        {kind === "speak" ? "문제" : "판"} 완료! 내일 또 만나요
      </h1>
      <div className="countdown" aria-label={`다음 초기화까지 ${left}`}>
        <Icon name="timer" size={28} />
        <b>{left}</b>
        <span>후 다시 채워져요</span>
      </div>
      <ul className="limit-options">
        <li>
          <Icon name="mic" size={26} />
          <span>
            <b>오늘의 세트 말하기 연습</b>은 계속 무료예요
          </span>
        </li>
        <li>
          <Icon name="trophy" size={26} />
          <span>
            친구가 보낸 <b>도전장</b>은 언제든 받을 수 있어요
          </span>
        </li>
        <li>
          <Icon name="gem" size={26} />
          <span>
            <b>베이직부터</b> 랜덤 스피킹 · 단어 게임이 무제한이에요
          </span>
        </li>
      </ul>
      <div className="row-actions">
        {onBack ? (
          <button className="btn btn-ghost" onClick={onBack}>
            돌아가기
          </button>
        ) : (
          <Link to="/study" className="btn btn-ghost">
            오늘의 세트로
          </Link>
        )}
        <Link to="/membership" className="btn btn-primary">
          무제한으로 하기
        </Link>
      </div>
    </div>
  );
}
