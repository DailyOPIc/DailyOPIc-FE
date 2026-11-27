import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../assets/Icon";
import { Mascot } from "../assets/Mascot";
import { msUntilReset } from "../lib/limits";

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

/** 이 게임을 오늘 다 했을 때(게임마다 하루 5판): 잠자는 마스코트 · 자정까지 카운트다운 · 다른 게임 안내 */
export function LimitReached({ title, limit, onBack }: { title: string; limit: number; onBack: () => void }) {
  const left = useCountdown();
  return (
    <div className="limit-page">
      <Mascot mood="sleep" size={140} />
      <p className="eyebrow">오늘의 {title}를 다 했어요</p>
      <h1>{limit}판 완료! 내일 새 문제로 만나요</h1>
      <div className="countdown" aria-label={`다음 초기화까지 ${left}`}>
        <Icon name="timer" size={28} />
        <b>{left}</b>
        <span>후 다시 열려요</span>
      </div>
      <ul className="limit-options">
        <li>
          <Icon name="keyboard" size={26} />
          <span>
            <b>다른 게임</b>은 따로 하루 {limit}판씩 할 수 있어요
          </span>
        </li>
        <li>
          <Icon name="mic" size={26} />
          <span>
            <b>학습 단계</b>를 이어 가면 경험치를 더 받아요
          </span>
        </li>
        <li>
          <Icon name="trophy" size={26} />
          <span>
            친구가 보낸 <b>도전장</b>은 언제든 받을 수 있어요
          </span>
        </li>
      </ul>
      <div className="row-actions">
        <button className="btn btn-ghost" onClick={onBack}>
          다른 게임 하기
        </button>
        <Link to="/study" className="btn btn-primary">
          학습 이어 가기
        </Link>
      </div>
    </div>
  );
}
