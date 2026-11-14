import { useEffect } from "react";
import { Icon } from "../assets/Icon";
import type { Recorded } from "../lib/game";
import type { QuickCheck } from "../lib/quickcheck";
import { play } from "../lib/sfx";

/** 무료 간단 체크 카드: 별이 하나씩 튀어나오고, 통계 · 쓴 표현 · 다음 팁을 보여준다. */
export function QuickCheckCard({ check, animate = true }: { check: QuickCheck; animate?: boolean }) {
  useEffect(() => {
    if (!animate) return;
    const timers = Array.from({ length: check.stars }, (_, n) =>
      window.setTimeout(() => play("coin", { rate: 1 + n * 0.12, volume: 0.5 }), 350 + n * 260),
    );
    return () => timers.forEach(clearTimeout);
  }, [check, animate]);

  return (
    <section className="qc-card">
      <div className="qc-head">
        <div className="qc-stars" aria-label={`별 ${check.stars}개`}>
          {[0, 1, 2].map((n) => (
            <span
              key={n}
              className={`qc-star${n < check.stars ? " on" : ""}${animate ? " pop" : ""}`}
              style={{ animationDelay: `${350 + n * 260}ms` }}
            >
              <Icon name="star" size={40} />
            </span>
          ))}
        </div>
        <div>
          <strong>{["조금만 더 말해 봐요", "좋은 시작이에요", "잘했어요!", "완벽한 흐름!"][check.stars]}</strong>
          <small>간단 체크 · AI 분석 아님 · 무료</small>
        </div>
      </div>
      <ul className="qc-stats">
        <li>
          <b>{check.words}</b>단어
        </li>
        <li>
          <b>{check.seconds}</b>초
        </li>
        <li>
          <b>{check.wpm || "–"}</b>단어/분
        </li>
        <li>
          <b>{check.connectors.length}</b>연결어
        </li>
      </ul>
      {(check.expressions.length > 0 || check.connectors.length > 0) && (
        <div className="qc-tags">
          {check.expressions.map((e) => (
            <span key={e} className="tag tag-gold">
              <Icon name="sparkle" size={16} />
              {e}
            </span>
          ))}
          {check.connectors.map((c) => (
            <span key={c} className="tag">
              {c}
            </span>
          ))}
        </div>
      )}
      <ul className="qc-tips">
        {check.tips.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </section>
  );
}

/** 보상 표시: +XP · 연속 학습 · 오늘의 목표 */
export function RewardChips({ reward }: { reward: Recorded }) {
  useEffect(() => {
    if (reward.goalJustReached) play("fanfare");
    else if (reward.streakUp) play("streak");
    else play("coin");
  }, [reward]);
  return (
    <span className="reward-chips">
      <span className="chip-pop xp">
        <Icon name="bolt" size={18} />+{reward.gained} XP
      </span>
      {reward.streakUp && (
        <span className="chip-pop streak">
          <Icon name="flame" size={18} />
          {reward.state.streak}일 연속!
        </span>
      )}
      {reward.goalJustReached && (
        <span className="chip-pop goal">
          <Icon name="trophy" size={18} />
          오늘의 목표 달성
        </span>
      )}
    </span>
  );
}

export function Confetti() {
  const colors = ["#4b24ff", "#9b87f5", "#10b981", "#f5a524", "#ef4444", "#38bdf8"];
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 48 }, (_, n) => (
        <i
          key={n}
          style={{
            left: `${(n * 37) % 100}%`,
            background: colors[n % colors.length],
            animationDelay: `${(n % 12) * 0.04}s`,
            animationDuration: `${1.3 + (n % 6) * 0.2}s`,
            width: n % 3 === 0 ? 8 : 10,
            height: n % 3 === 0 ? 8 : 16,
            borderRadius: n % 3 === 0 ? "50%" : 3,
          }}
        />
      ))}
    </div>
  );
}
