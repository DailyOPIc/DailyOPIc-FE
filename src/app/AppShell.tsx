import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Icon, type IconName } from "../assets/Icon";
import { Mascot } from "../assets/Mascot";
import { CoachMarks } from "./CoachMarks";
import { DeleteAccountDialog } from "./DeleteAccount";
import { signOut } from "../lib/auth";
import { callNative, inApp } from "../lib/native";
import { canWatchAd, watchAdForToken } from "../lib/tokens";
import type { LevelProgress } from "../lib/api";
import { DAILY_GOAL, type GameState } from "../lib/game";
import { levelFromXp } from "../lib/level";
import { LEVEL_UP_EVENT } from "../lib/progress";
import { Confetti } from "./Reward";
import { FREE_DAILY, LIMIT_LABEL, used, type LimitKind } from "../lib/limits";
import { isMuted, play, setMuted } from "../lib/sfx";

type Props = {
  uid: string;
  game: GameState;
  tokens: number | null;
  /** 서버 레벨(없으면 XP로 계산) */
  level?: LevelProgress | null;
  /** 광고 보고 토큰 받기: 오늘 본 횟수 / 하루 최대 */
  ads?: { used: number; max: number } | null;
  plan: string;
  /** 첫 화면(오늘의 문제)이 준비된 뒤에만 코치마크를 띄운다. 로딩 화면 위에 먼저 뜨지 않게. */
  coachReady: boolean;
  onEditPrefs: () => void;
  children: ReactNode;
};

// tab: 모바일 하단 탭 이름(5개까지). 없으면 ☰ 메뉴에서만 보인다.
const NAV: { to: string; label: string; tab?: string; icon: IconName; end?: boolean }[] = [
  { to: "/study", label: "오늘의 학습", tab: "학습", icon: "mic", end: true },
  { to: "/study/mock", label: "모의고사", tab: "모의고사", icon: "clipboard" },
  { to: "/study/words", label: "오픽게임", tab: "오픽게임", icon: "keyboard" },
  { to: "/study/activity", label: "활동", tab: "활동", icon: "flame" },
  { to: "/study/speak", label: "랜덤 스피킹", icon: "dice" },
];

/** 서비스 화면 틀: 사이트 헤더 · 푸터 없이 왼쪽 레일 + 가운데 학습 + 오른쪽 현황 */
export function AppShell({ uid, game, tokens, level, ads, plan, coachReady, onEditPrefs, children }: Props) {
  const [menu, setMenu] = useState(false);
  const [adDialog, setAdDialog] = useState(false);
  const navigate = useNavigate();
  const lv = level ?? { ...levelFromXp(game.xp), xp: game.xp };
  // + 버튼: 앱(무료)은 광고 보고 토큰 받기, 그 밖에는 토큰 · 이용권 안내
  const onPlus = () => {
    play("tap", { volume: 0.5 });
    if (canWatchAd(plan)) setAdDialog(true);
    else navigate("/membership#tokens");
  };
  const stats = (compact?: boolean) => <Stats game={game} level={lv} tokens={tokens} compact={compact} onPlus={onPlus} />;
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
      {inApp ? (
        // 앱 안: 로그인 연결 · 계정 삭제(Apple 토큰 폐기 포함)는 앱의 계정 화면이 맡는다
        <button className="rail-item small" onClick={() => void callNative("openAccount")}>
          <Icon name="door" size={26} />
          계정 · 로그인
        </button>
      ) : (
        <>
          <button className="rail-item small" onClick={() => void signOut()}>
            <Icon name="door" size={26} />
            로그아웃
          </button>
          <button className="rail-item small danger" onClick={() => setDeleting(true)}>
            <Icon name="close" size={26} />
            계정 삭제
          </button>
        </>
      )}
    </>
  );

  return (
    <div className="app">
      <aside className="rail">
        <Link to="/" className="rail-brand">
          <img src="/images/logo-mark.png" alt="" width={34} height={34} />
          데일리오픽
        </Link>
        <div className="rail-stats">{stats(true)}</div>
        <nav className="rail-nav">{nav}</nav>
      </aside>

      <header className="app-topbar">
        <Link to="/" className="topbar-logo" aria-label="데일리오픽 홈">
          <img src="/images/logo-mark.png" alt="" width={30} height={30} />
        </Link>
        {stats(true)}
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
      {adDialog && <AdDialog ads={ads ?? null} onClose={() => setAdDialog(false)} />}
      <LevelUpToast />
      {coachReady && <CoachMarks uid={uid} />}

      <nav className="tabbar" aria-label="학습 메뉴">
        {NAV.filter((n) => n.tab).map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className="tab" onClick={() => play("tap", { volume: 0.4 })}>
            <Icon name={n.icon} size={26} />
            <span>{n.tab}</span>
          </NavLink>
        ))}
      </nav>

      <aside className="side">
        {stats()}
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
            보물상자 · 오픽게임 · 하루 목표로 토큰을 더 받을 수 있어요. 학습 단계는 AI 분석까지 받으면 끝나요.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Stats({ game, level, tokens, compact, onPlus }: { game: GameState; level: LevelProgress; tokens: number | null; compact?: boolean; onPlus: () => void }) {
  const size = compact ? 22 : 26;
  return (
    <div className={compact ? "stats-row compact" : "stats-row"}>
      <span className={`stat-chip streak${game.streak > 0 ? " lit" : ""}`} title="연속 학습일" data-coach="streak">
        <Icon name="flame" size={size} /> <b>{game.streak}</b>
      </span>
      <span className="stat-chip level" title={`레벨 ${level.level} · 다음 레벨까지 ${level.levelNeed - level.levelXp} XP`} data-coach="level">
        <b>Lv.{level.level}</b>
        <span className="xp-mini" aria-hidden="true">
          <span style={{ transform: `scaleX(${level.levelXp / level.levelNeed})` }} />
        </span>
      </span>
      <span className="stat-chip token" title="오늘 남은 토큰" data-coach="token">
        <Icon name="coin" size={size} /> <b>{tokens ?? "–"}</b>
      </span>
      <button className="token-plus" onClick={onPlus} aria-label="토큰 더 받기" data-coach="plus">
        +
      </button>
    </div>
  );
}

/** 광고 보고 토큰 1개 받기(앱 · 무료). 오늘 본 횟수 / 하루 최대를 함께 보여 준다. */
function AdDialog({ ads, onClose }: { ads: { used: number; max: number } | null; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const left = ads ? Math.max(0, ads.max - ads.used) : 1;
  return (
    <div className="dialog-backdrop" role="presentation" onClick={busy ? undefined : onClose}>
      <div className="dialog ad-dialog" role="dialog" aria-modal="true" aria-labelledby="ad-title" onClick={(e) => e.stopPropagation()}>
        <Icon name="coin" size={56} />
        <h2 id="ad-title">광고 보고 토큰 받기</h2>
        <p>광고를 끝까지 보면 오늘 쓸 토큰 1개를 받아요. 토큰은 AI 분석 · 새 단계에 써요.</p>
        {ads && (
          <p className="ad-count">
            오늘 <b>{ads.used}</b> / {ads.max}회
          </p>
        )}
        <div className="row-actions">
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
            닫기
          </button>
          <button
            className="btn btn-primary"
            disabled={busy || left === 0}
            onClick={() => {
              setBusy(true);
              void watchAdForToken().finally(() => {
                setBusy(false);
                onClose();
              });
            }}
          >
            {left === 0 ? "오늘은 모두 받았어요" : busy ? "광고 불러오는 중…" : "광고 보기"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** 레벨이 오르면 잠깐 축하 */
function LevelUpToast() {
  const [level, setLevel] = useState<number | null>(null);
  useEffect(() => {
    let timer = 0;
    const on = (e: Event) => {
      setLevel(Number((e as CustomEvent).detail));
      play("fanfare");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setLevel(null), 2600);
    };
    window.addEventListener(LEVEL_UP_EVENT, on);
    return () => {
      window.removeEventListener(LEVEL_UP_EVENT, on);
      window.clearTimeout(timer);
    };
  }, []);
  if (level === null) return null;
  return (
    <>
      <Confetti />
      <div className="levelup-toast" role="status">
        <span>LEVEL UP</span>
        <b>Lv.{level}</b>
      </div>
    </>
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
