import { Icon } from "../assets/Icon";
import { heatmapDays, kstDay, loadActivity, type GameState } from "../lib/game";

const WEEKS = 17; // 320px 폭에서도 한 줄에 들어가는 주 수

/** 활동: GitHub 잔디처럼 날마다 학습한 횟수를 칸 색으로 보여 준다. */
export function Activity({ uid, game }: { uid: string; game: GameState }) {
  const log = loadActivity(uid);
  const days = heatmapDays(kstDay(), WEEKS);
  const total = Object.values(log).filter((n) => n > 0).length;
  const level = (n = 0) => (n === 0 ? 0 : n < 2 ? 1 : n < 4 ? 2 : n < 6 ? 3 : 4);

  return (
    <div className="mode-page activity-page">
      <div className="mode-hero">
        <Icon name="flame" size={56} />
        <div>
          <h1>활동</h1>
          <p>하루에 하나라도 하면 칸이 채워져요.</p>
        </div>
      </div>

      <div className="stat-grid">
        <Stat label="연속 학습" value={`${game.streak}일`} />
        <Stat label="최고 연속" value={`${game.bestStreak}일`} />
        <Stat label="학습한 날" value={`${total}일`} />
      </div>

      <section className="detail-card">
        <div className="heatmap" role="img" aria-label={`최근 ${WEEKS}주 동안 ${days.filter((d) => d && log[d]).length}일 학습`}>
          {days.map((d, i) => (
            <span key={i} className={d ? `hm l${level(log[d])}` : "hm empty"} title={d ? `${d} · ${log[d] ?? 0}회` : undefined} />
          ))}
        </div>
        <p className="heatmap-legend">
          적게 <span className="hm l1" /> <span className="hm l2" /> <span className="hm l3" /> <span className="hm l4" /> 많이
        </p>
      </section>
      <p className="detail-hint">활동 기록은 이 브라우저에 저장돼요.</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-box">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}
