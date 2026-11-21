import { claimActivityToken } from "../lib/tokens";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Icon } from "../assets/Icon";
import { Mascot } from "../assets/Mascot";
import { EXPRESSIONS, GROUP_LABEL } from "../data/expressions";
import { decodeChallenge, newSeed, rng, seededShuffle, todaySeed, type Challenge, type GameMode } from "../lib/challenge";
import { XP, type Recorded } from "../lib/game";
import { consume, FREE_DAILY, remaining } from "../lib/limits";
import { speak } from "../lib/recorder";
import { play } from "../lib/sfx";
import { Dictation, Meaning, Rain, Typing } from "./games/classic";
import { GameResult, loadBest, MODE_INFO, saveBest, type GameSummary } from "./games/common";
import { Build, Fill, Speed } from "./games/new";
import { LimitReached } from "./LimitReached";

const ORDER: GameMode[] = ["speed", "typing", "meaning", "build", "fill", "dictation", "rain"];
const GAMES = { typing: Typing, meaning: Meaning, dictation: Dictation, rain: Rain, build: Build, fill: Fill, speed: Speed };

type Props = { uid: string; plan: string; onReward: (xp: number) => Recorded; onLimitUse: () => void };

export function WordGames({ uid, plan, onReward, onLimitUse }: Props) {
  const [params, setParams] = useSearchParams();
  const incoming = useMemo(() => decodeChallenge(params.get("vs")), [params]);
  const [run, setRun] = useState<{ mode: GameMode; seed: number; round: number; vs: Challenge | null } | null>(null);
  const [summary, setSummary] = useState<GameSummary | null>(null);
  const [reward, setReward] = useState<Recorded | null>(null);
  const daily = todaySeed();
  const [blocked, setBlocked] = useState(false);
  const left = remaining(uid, plan, "games");
  const preview = useMemo(() => seededShuffle(EXPRESSIONS, rng(daily)).slice(0, 3), [daily]);

  const start = (mode: GameMode, seed: number, vs: Challenge | null = null) => {
    // 받은 도전장은 한도와 상관없이(친구를 데려오는 길은 막지 않는다)
    if (!vs) {
      if (!consume(uid, plan, "games")) {
        play("lose");
        setRun(null);
        setSummary(null);
        setBlocked(true);
        return;
      }
      onLimitUse();
    }
    play("start");
    setSummary(null);
    setReward(null);
    setRun((r) => ({ mode, seed, vs, round: (r?.round ?? 0) + 1 }));
  };
  const finish = (s: GameSummary) => {
    saveBest(s.mode, s.score);
    setReward(onReward(XP.practice + s.correct * XP.wordCorrect));
    setSummary(s);
    void claimActivityToken("game", "오픽게임 한 판");
  };
  const exit = () => {
    setRun(null);
    setSummary(null);
    if (incoming) setParams({}, { replace: true }); // 도전 끝나면 링크 정보 지우기
  };

  if (blocked) return <LimitReached kind="games" onBack={() => setBlocked(false)} />;

  if (run && summary && reward)
    return (
      <GameResult
        summary={summary}
        reward={reward}
        challenge={run.vs}
        // 도전장 · 오늘의 챌린지는 같은 문제로 다시, 일반 판은 새 문제로
        onAgain={() => start(run.mode, run.vs || run.seed === daily ? run.seed : newSeed(), run.vs)}
        onExit={exit}
      />
    );
  if (run) {
    const Game = GAMES[run.mode];
    return <Game key={run.round} seed={run.seed} onExit={exit} onDone={finish} />;
  }

  return (
    <div className="mode-page">
      {incoming ? (
        <section className="challenge-card" aria-label="받은 도전장">
          <Mascot mood="cheer" size={88} />
          <div>
            <p className="eyebrow">도전장이 왔어요!</p>
            <h2>
              {incoming.n}님 · {MODE_INFO[incoming.m].title} <b>{incoming.sc}점</b>
            </h2>
            <p>똑같은 문제로 이 기록을 넘어 보세요.</p>
          </div>
          <button className="btn btn-primary" onClick={() => start(incoming.m, incoming.s, incoming)}>
            도전 수락
          </button>
        </section>
      ) : (
        <div className="mode-hero">
          <Mascot mood="happy" size={96} />
          <div>
            <p className="eyebrow">무료 · 무제한</p>
            <h1>오픽게임</h1>
            <p className="lead">OPIc 답변에 바로 쓰는 표현 {EXPRESSIONS.length}개를 게임으로 익히고, 친구와 기록 대결도 해요.</p>
          </div>
        </div>
      )}

      {!incoming && (
      <button className="daily-card" onClick={() => start("speed", daily)}>
        <span className="daily-icon">
          <Icon name="timer" size={40} />
        </span>
        <span className="daily-text">
          <small>
            오늘의 챌린지 · 모두 같은 문제{Number.isFinite(left) ? ` · 오늘 남은 판 ${left}/${FREE_DAILY.games}` : ""}
          </small>
          <strong>60초 스피드 퀴즈</strong>
          <span>내 최고 {loadBest("speed")}점 · 친구에게 도전장을 보내 보세요</span>
        </span>
        <span className="daily-go">
          <Icon name="back" size={22} />
        </span>
      </button>
      )}

      <div className="mode-grid">
        {ORDER.map((m, n) => {
          const info = MODE_INFO[m];
          return (
            <button key={m} className="mode-card" title={info.desc} style={{ animationDelay: `${n * 50}ms` }} onClick={() => start(m, newSeed())}>
              <span className="mode-icon">
                <Icon name={info.icon} size={44} />
              </span>
              <span className={`mode-tag${info.tag === "NEW" ? " new" : ""}`}>{info.tag}</span>
              <strong>{info.title}</strong>
              <span>{info.desc}</span>
              <small>최고 {loadBest(m)}</small>
            </button>
          );
        })}
      </div>

      <section className="expr-shelf">
        <h2>오늘의 표현</h2>
        <div className="expr-list">
          {preview.map((e) => (
            <button
              key={e.en}
              className="expr-chip"
              onClick={() => {
                play("tap", { volume: 0.4 });
                speak(e.en);
              }}
            >
              <b>{e.en}</b>
              <span>{e.ko}</span>
              <em>{GROUP_LABEL[e.group]}</em>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
