import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { signOut } from "../lib/auth";
import { DAILY_GOAL, type GameState } from "../lib/game";
import { isMuted, setMuted, sfx } from "../lib/sfx";

type Props = {
  game: GameState;
  tokens: number | null;
  plan: string;
  onEditPrefs: () => void;
  children: ReactNode;
};

/** 서비스 화면 틀: 사이트 헤더 · 푸터 없이 왼쪽 레일 + 가운데 학습 + 오른쪽 현황 */
export function AppShell({ game, tokens, plan, onEditPrefs, children }: Props) {
  const [menu, setMenu] = useState(false);
  const [muted, setMute] = useState(isMuted);

  const toggleMute = () => {
    setMuted(!muted);
    setMute(!muted);
    if (muted) sfx.tap();
  };

  const nav = (
    <>
      <span className="rail-item active">
        <span className="rail-icon">🎙️</span>학습
      </span>
      <span className="rail-item soon" title="곧 열려요">
        <span className="rail-icon">📝</span>모의고사<em>곧</em>
      </span>
      <span className="rail-item soon" title="곧 열려요">
        <span className="rail-icon">📚</span>단어장<em>곧</em>
      </span>
      <Link className="rail-item" to="/membership">
        <span className="rail-icon">💎</span>요금제
      </Link>
      <button className="rail-item" onClick={onEditPrefs}>
        <span className="rail-icon">⚙️</span>단계 · 설문
      </button>
      <button className="rail-item" onClick={toggleMute}>
        <span className="rail-icon">{muted ? "🔇" : "🔊"}</span>효과음 {muted ? "끔" : "켬"}
      </button>
      <button className="rail-item" onClick={() => void signOut()}>
        <span className="rail-icon">👋</span>로그아웃
      </button>
    </>
  );

  return (
    <div className="app">
      <aside className="rail">
        <Link to="/" className="rail-brand">
          <img src="/images/logo-mark.png" alt="" width={32} height={32} />
          데일리오픽
        </Link>
        <nav className="rail-nav">{nav}</nav>
      </aside>

      <header className="app-topbar">
        <Link to="/" className="rail-brand">
          <img src="/images/logo-mark.png" alt="데일리오픽" width={28} height={28} />
        </Link>
        <Stats game={game} tokens={tokens} compact />
        <button className="topbar-menu" aria-expanded={menu} aria-label="메뉴" onClick={() => setMenu((v) => !v)}>
          ☰
        </button>
        {menu && (
          <nav className="topbar-sheet" onClick={() => setMenu(false)}>
            {nav}
          </nav>
        )}
      </header>

      <main className="app-main">{children}</main>

      <aside className="side">
        <Stats game={game} tokens={tokens} />
        <GoalCard game={game} />
        {plan === "free" && (
          <div className="side-card upsell">
            <strong>결과 전체를 열어 보세요</strong>
            <p>교정 답안 · 모범 답안 · 목표 등급까지 차이를 베이직부터 볼 수 있어요.</p>
            <Link to="/membership" className="btn btn-primary btn-block">
              요금제 보기
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}

function Stats({ game, tokens, compact }: { game: GameState; tokens: number | null; compact?: boolean }) {
  return (
    <div className={compact ? "stats-row compact" : "stats-row"}>
      <span className={`stat-chip streak${game.streak > 0 ? " lit" : ""}`} title="연속 학습일">
        🔥 <b>{game.streak}</b>
      </span>
      <span className="stat-chip xp" title="경험치">
        ⚡ <b>{game.xp}</b>
      </span>
      <span className="stat-chip token" title="오늘 남은 데일리 토큰">
        🪙 <b>{tokens ?? "–"}</b>
      </span>
    </div>
  );
}

export function GoalCard({ game }: { game: GameState }) {
  const done = Math.min(game.todayCount, DAILY_GOAL);
  const pct = done / DAILY_GOAL;
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="side-card goal">
      <svg viewBox="0 0 80 80" width="80" height="80" aria-hidden="true">
        <circle cx="40" cy="40" r={r} className="goal-track" />
        <circle
          cx="40"
          cy="40"
          r={r}
          className="goal-fill"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform="rotate(-90 40 40)"
        />
      </svg>
      <div>
        <strong>오늘의 목표</strong>
        <p>
          답변 분석 {done} / {DAILY_GOAL}
          {done >= DAILY_GOAL ? " · 달성! 🎉" : ""}
        </p>
      </div>
    </div>
  );
}
