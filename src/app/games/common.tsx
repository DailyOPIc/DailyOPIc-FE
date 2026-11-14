import { useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "../../assets/Icon";
import { Mascot } from "../../assets/Mascot";
import { challengeUrl, type Challenge, type GameMode } from "../../lib/challenge";
import type { Recorded } from "../../lib/game";
import { play } from "../../lib/sfx";
import { renderStoryCard, shareImage, shareLink } from "../../lib/share";
import { Confetti, RewardChips } from "../Reward";

export type GameSummary = {
  mode: GameMode;
  seed: number;
  correct: number;
  total: number;
  score: number;
  bestCombo: number;
  extra?: string;
};

export type GameProps = { seed: number; onExit: () => void; onDone: (s: GameSummary) => void };

export const MODE_INFO: Record<GameMode, { title: string; desc: string; icon: IconName; tag: string }> = {
  speed: { title: "60초 스피드", desc: "60초 동안 뜻을 최대한 많이 맞혀요", icon: "timer", tag: "타임어택" },
  typing: { title: "타자 연습", desc: "표현을 그대로 따라 쳐요. 속도 · 정확도 · 콤보!", icon: "keyboard", tag: "PC 추천" },
  meaning: { title: "뜻 맞추기", desc: "4지선다, 하트 3개, 시간 제한", icon: "book", tag: "모바일 추천" },
  build: { title: "문장 조립", desc: "단어 블록을 순서대로 눌러 답변 문장을 완성해요", icon: "pencil", tag: "NEW" },
  fill: { title: "빈칸 채우기", desc: "문장에 딱 맞는 연결어를 골라요", icon: "target", tag: "NEW" },
  dictation: { title: "받아쓰기", desc: "들려주는 표현을 듣고 그대로 입력해요", icon: "headphones", tag: "듣기" },
  rain: { title: "단어 비", desc: "떨어지는 표현을 입력해 터뜨려요. 점점 빨라져요!", icon: "sparkle", tag: "게임" },
};

export const clean = (s: string) => s.toLowerCase().replace(/[^a-z' ]/g, "").replace(/\s+/g, " ").trim();

const bestKey = (m: GameMode) => `dailyopic:best:${m}`;
export function loadBest(m: GameMode): number {
  try {
    return Number(localStorage.getItem(bestKey(m)) ?? 0);
  } catch {
    return 0;
  }
}
export function saveBest(m: GameMode, v: number) {
  try {
    if (v > loadBest(m)) localStorage.setItem(bestKey(m), String(v));
  } catch {
    /* noop */
  }
}

const NICK_KEY = "dailyopic:nick";
function loadNick() {
  try {
    return localStorage.getItem(NICK_KEY) ?? "";
  } catch {
    return "";
  }
}

export function GameTop({ onExit, progress, hearts, combo, right }: { onExit: () => void; progress: number; hearts?: number; combo: number; right?: ReactNode }) {
  return (
    <header className="lesson-top">
      <button className="icon-btn" onClick={onExit} aria-label="그만하기">
        <Icon name="close" size={22} />
      </button>
      <div className="lesson-progress">
        <span style={{ transform: `scaleX(${Math.max(0.03, Math.min(1, progress))})` }} />
      </div>
      {combo >= 2 && (
        <span className="combo-badge" key={combo}>
          {combo} 콤보
        </span>
      )}
      {right}
      {hearts !== undefined && (
        <span className="hearts" aria-label={`하트 ${hearts}개`}>
          {Array.from({ length: 3 }, (_, n) => (
            <Icon key={n} name={n < hearts ? "heart" : "heartEmpty"} size={26} className={n === hearts ? "heart-lost" : undefined} />
          ))}
        </span>
      )}
    </header>
  );
}

export function starsFor(s: GameSummary) {
  const acc = s.total ? s.correct / s.total : 0;
  return acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : acc >= 0.4 ? 1 : 0;
}

/** 결과 화면: 별 · 기록 · 보상, 도전장이면 승부 결과, 그리고 공유(링크 · 인스타 이미지) */
export function GameResult({
  summary,
  reward,
  challenge,
  onAgain,
  onExit,
}: {
  summary: GameSummary;
  reward: Recorded;
  challenge: Challenge | null;
  onAgain: () => void;
  onExit: () => void;
}) {
  const stars = starsFor(summary);
  const isBest = summary.score > 0 && summary.score >= loadBest(summary.mode);
  const vs = challenge && challenge.m === summary.mode && challenge.s === summary.seed ? challenge : null;
  const won = vs ? summary.score > vs.sc : null;
  const tie = vs ? summary.score === vs.sc : false;
  const [nick, setNick] = useState(loadNick);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const page = useRef<HTMLDivElement>(null);
  const info = MODE_INFO[summary.mode];

  const link = () => {
    const n = nick.trim() || "익명의 도전자";
    try {
      localStorage.setItem(NICK_KEY, n);
    } catch {
      /* noop */
    }
    return challengeUrl({ m: summary.mode, s: summary.seed, sc: summary.score, c: summary.correct, t: summary.total, n });
  };
  const text = `데일리오픽 ${info.title} ${summary.score}점! 같은 문제로 나를 이겨 봐`;
  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  const onShareLink = async () => {
    play("select");
    const r = await shareLink("데일리오픽 도전장", text, link());
    if (r === "copied") flash("도전장 링크를 복사했어요. 친구에게 붙여넣어 보내 보세요!");
    if (r === "failed") flash("공유하지 못했어요. 다시 시도해 주세요.");
  };
  const onShareImage = async () => {
    play("select");
    setBusy(true);
    try {
      const blob = await renderStoryCard({
        mode: info.title,
        score: summary.score,
        correct: summary.correct,
        total: summary.total,
        stars,
        headline: vs ? (won ? "도전 성공!" : "아깝다, 재도전!") : "나를 이겨 봐!",
        mascot: page.current?.querySelector<SVGSVGElement>(".mascot"),
      });
      const r = await shareImage(blob, text, link());
      if (r === "downloaded") flash("이미지를 저장했어요. 인스타 스토리에 올리고 링크 스티커로 도전장 링크를 붙여 보세요!");
    } catch {
      flash("이미지를 만들지 못했어요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lesson result-screen" ref={page}>
      {(stars === 3 || won) && <Confetti />}
      <main className="lesson-body center">
        <Mascot mood={won === false ? "sad" : stars >= 2 || won ? "happy" : stars === 1 ? "cheer" : "sad"} size={130} />
        <h1 className="result-title">
          {vs ? (tie ? "무승부! 한 판 더?" : won ? `${vs.n}님을 이겼어요!` : `${vs.n}님에게 졌어요`) : ["다음엔 더 잘할 수 있어요!", "좋아요, 감 잡았어요!", "잘했어요!", "완벽해요!"][stars]}
        </h1>
        {vs && (
          <div className={`versus${won ? " win" : tie ? " tie" : " lose"}`}>
            <div>
              <small>나</small>
              <b>{summary.score}</b>
            </div>
            <span>VS</span>
            <div>
              <small>{vs.n}</small>
              <b>{vs.sc}</b>
            </div>
          </div>
        )}
        <div className="qc-stars big">
          {[0, 1, 2].map((n) => (
            <span key={n} className={`qc-star pop${n < stars ? " on" : ""}`} style={{ animationDelay: `${200 + n * 220}ms` }}>
              <Icon name="star" size={48} />
            </span>
          ))}
        </div>
        <ul className="result-stats">
          <li>
            <b>
              {summary.correct}/{summary.total}
            </b>
            맞힘
          </li>
          <li>
            <b>{summary.bestCombo}</b>최고 콤보
          </li>
          <li className={isBest ? "best" : undefined}>
            <b>{summary.score}</b>
            {isBest ? "최고 기록!" : "점수"}
          </li>
          {summary.extra && (
            <li>
              <b>{summary.extra}</b>
            </li>
          )}
        </ul>
        <p className="reward-line">
          <RewardChips reward={reward} />
        </p>

        <section className="share-box">
          <p>
            <Icon name="trophy" size={22} /> 같은 문제로 친구와 기록 대결!
          </p>
          <label className="nick">
            닉네임
            <input value={nick} maxLength={12} placeholder="익명의 도전자" onChange={(e) => setNick(e.target.value)} />
          </label>
          <div className="share-actions">
            <button className="btn btn-secondary" onClick={onShareLink}>
              <Icon name="chat" size={20} /> 도전장 보내기
            </button>
            <button className="btn btn-insta" onClick={onShareImage} disabled={busy}>
              <InstaGlyph /> {busy ? "만드는 중…" : "스토리 이미지"}
            </button>
          </div>
        </section>
        {toast && <p className="toast">{toast}</p>}
      </main>
      <footer className="lesson-bar">
        <button className="btn btn-ghost" onClick={onExit}>
          게임 목록
        </button>
        <button className="btn btn-primary" onClick={onAgain}>
          {vs ? "다시 도전" : "한 판 더"}
        </button>
      </footer>
    </div>
  );
}

function InstaGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}
