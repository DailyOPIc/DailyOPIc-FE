import { useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { Icon, type IconName } from "../assets/Icon";
import { Mascot } from "../assets/Mascot";
import { CoachMarks } from "./CoachMarks";
import { DeleteAccountDialog } from "./DeleteAccount";
import { signOut } from "../lib/auth";
import { DAILY_GOAL, type GameState } from "../lib/game";
import { FREE_DAILY, LIMIT_LABEL, used, type LimitKind } from "../lib/limits";
import { isMuted, play, setMuted } from "../lib/sfx";

type Props = {
  uid: string;
  game: GameState;
  tokens: number | null;
  plan: string;
  onEditPrefs: () => void;
  children: ReactNode;
};

// tab: 모바일 하단 탭 이름(5개까지). 없으면 ☰ 메뉴에서만 보인다.
const NAV: { to: string; label: string; tab?: string; icon: IconName; end?: boolean }[] = [
  { to: "/study", label: "오늘의 학습", tab: "학습", icon: "mic", end: true },
  { to: "/study/mock", label: "모의고사", tab: "모의고사", icon: "clipboard" },
  { to: "/study/words", label: "오픽게임", tab: "오픽게임", icon: "keyboard" },
  { to: "/study/speak", label: "랜덤 스피킹", tab: "스피킹", icon: "dice" },
  { to: "/study/activity", label: "활동", icon: "flame" },
];

/** 서비스 화면 틀: 사이트 헤더 · 푸터 없이 왼쪽 레일 + 가운데 학습 + 오른쪽 현황 */
export function AppShell({ uid, game, tokens, plan, onEditPrefs, children }: Props) {
  const [menu, setMenu] = useState(false);
  const [muted, setMute] = useState(isMuted);
  const [deleting, setDeleting] = useState(false);

  const toggleMute = () => {
    setMuted(!muted);
    setMute(!muted);
    if (muted) play("select");
  };

  const nav = (
    <>
      {NAV.map((n) => (
        <NavLink key={n.to} to={n.to} end={n.end} className="rail-item" onClick={() => play("tap", { volume: 0.4 })}>
          <Icon name={n.icon} size={30} />
          {n.label}
        </NavLink>
      ))}
      <Link className="rail-item" to="/membership">
        <Icon name="gem" size={30} />
        요금제
      </Link>
      <div className="rail-sep" />
      <button className="rail-item small" onClick={onEditPrefs}>
        <Icon name="sliders" size={26} />
        단계 · 설문
      </button>
      <button className="rail-item small" onClick={toggleMute}>
        <Icon name={muted ? "soundOff" : "soundOn"} size={26} />
        효과음 {muted ? "끔" : "켬"}
      </button>
      <button className="rail-item small" onClick={() => void signOut()}>
        <Icon name="door" size={26} />
        로그아웃
      </button>
      <button className="rail-item small danger" onClick={() => setDeleting(true)}>
        <Icon name="close" size={26} />
        계정 삭제
      </button>
    </>
  );

  return (
    <div className="app">
      <aside className="rail">
        <Link to="/" className="rail-brand">
          <img src="/images/logo-mark.png" alt="" width={34} height={34} />
          데일리오픽
        </Link>
        <nav className="rail-nav">{nav}</nav>
      </aside>

      <header className="app-topbar">
        <Link to="/" className="topbar-logo" aria-label="데일리오픽 홈">
          <img src="/images/logo-mark.png" alt="" width={30} height={30} />
        </Link>
        <Stats game={game} tokens={tokens} compact />
        <button className="icon-btn" aria-expanded={menu} aria-label="메뉴" onClick={() => setMenu((v) => !v)}>
          <Icon name={menu ? "close" : "menu"} size={24} />
        </button>
        {menu && (
          <nav className="topbar-sheet" onClick={() => setMenu(false)}>
            {nav}
          </nav>
        )}
      </header>

      <main className="app-main">{children}</main>
      {deleting && <DeleteAccountDialog onClose={() => setDeleting(false)} />}
      <CoachMarks uid={uid} />

      <nav className="tabbar" aria-label="학습 메뉴">
        {NAV.filter((n) => n.tab).map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className="tab" onClick={() => play("tap", { volume: 0.4 })}>
            <Icon name={n.icon} size={26} />
            <span>{n.tab}</span>
          </NavLink>
        ))}
      </nav>

      <aside className="side">
        <Stats game={game} tokens={tokens} />
        <GoalCard game={game} />
        {plan === "free" && <FreeLimits uid={uid} />}
        {plan === "free" && (
          <div className="side-card upsell">
            <Mascot mood="cheer" size={64} />
            <div>
              <strong>결과 전체를 열어 보세요</strong>
              <p>교정 답안 · 모범 답안 · 목표 등급까지 차이를 베이직부터 볼 수 있어요.</p>
            </div>
            <Link to="/membership" className="btn btn-primary btn-block">
              요금제 보기
            </Link>
          </div>
        )}
        <div className="side-card tip">
          <Icon name="sparkle" size={28} />
          <p>
            <b>무료로 계속 연습하기</b>
            말하기 연습 · 간단 체크 · 랜덤 스피킹 · 단어 게임은 토큰 없이 무제한이에요. 토큰은 AI 정밀 분석에만 써요.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Stats({ game, tokens, compact }: { game: GameState; tokens: number | null; compact?: boolean }) {
  return (
    <div className={compact ? "stats-row compact" : "stats-row"}>
      <span className={`stat-chip streak${game.streak > 0 ? " lit" : ""}`} title="연속 학습일" data-coach="streak">
        <Icon name="flame" size={compact ? 22 : 26} /> <b>{game.streak}</b>
      </span>
      <span className="stat-chip xp" title="경험치" data-coach="xp">
        <Icon name="bolt" size={compact ? 22 : 26} /> <b>{game.xp}</b>
      </span>
      <span className="stat-chip token" title="오늘 남은 토큰" data-coach="token">
        <Icon name="coin" size={compact ? 22 : 26} /> <b>{tokens ?? "–"}</b>
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
    <div className={`side-card goal${done >= DAILY_GOAL ? " met" : ""}`}>
      <svg viewBox="0 0 80 80" width="80" height="80" aria-hidden="true">
        <circle cx="40" cy="40" r={r} className="goal-track" />
        <circle cx="40" cy="40" r={r} className="goal-fill" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 40 40)" />
        <foreignObject x="20" y="20" width="40" height="40">
          <Icon name={done >= DAILY_GOAL ? "trophy" : "target"} size={40} />
        </foreignObject>
      </svg>
      <div>
        <strong>오늘의 목표</strong>
        <p>
          학습 활동 {done} / {DAILY_GOAL}
          {done >= DAILY_GOAL ? " · 달성!" : ""}
        </p>
      </div>
    </div>
  );
}

function FreeLimits({ uid }: { uid: string }) {
  const kinds: LimitKind[] = ["speak", "games"];
  return (
    <div className="side-card limits">
      <strong>오늘의 무료 이용</strong>
      {kinds.map((k) => {
        const u = Math.min(used(uid, k), FREE_DAILY[k]);
        return (
          <div key={k} className="limit-row">
            <span>{LIMIT_LABEL[k]}</span>
            <span className="limit-track">
              <span style={{ transform: `scaleX(${u / FREE_DAILY[k]})` }} className={u >= FREE_DAILY[k] ? "full" : undefined} />
            </span>
            <b>
              {FREE_DAILY[k] - u}/{FREE_DAILY[k]}
            </b>
          </div>
        );
      })}
      <p>매일 자정에 다시 채워져요</p>
    </div>
  );
}
