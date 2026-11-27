import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Icon } from "../assets/Icon";
import { Mascot } from "../assets/Mascot";
import { EXPRESSIONS, GROUP_LABEL } from "../data/expressions";
import { decodeChallenge, newSeed, rng, seededShuffle, todaySeed, type Challenge, type GameMode } from "../lib/challenge";
import { api, type ApiError } from "../lib/api";
import type { Recorded } from "../lib/game";
import { loadGameSets, setActiveGameSet, type GameSet } from "../lib/gamePool";
import { claimActivityToken } from "../lib/tokens";
import { speak } from "../lib/recorder";
import { play } from "../lib/sfx";
import { Dictation, Meaning, Rain, Typing } from "./games/classic";
import { GameResult, loadBest, MODE_INFO, saveBest, type GameSummary } from "./games/common";
import { Build, Fill, Speed } from "./games/new";
import { LimitReached } from "./LimitReached";

const ORDER: GameMode[] = ["speed", "typing", "meaning", "build", "fill", "dictation", "rain"];
const GAMES = { typing: Typing, meaning: Meaning, dictation: Dictation, rain: Rain, build: Build, fill: Fill, speed: Speed };

type Props = {
  /** 게임마다 오늘 한 판 수 · 하루 한도(서버) */
  plays: Record<string, number>;
  limit: number;
  /** 한 판 끝: 서버에 기록한 뒤 프로필을 다시 읽어 보상을 돌려준다 */
  onReward: () => Promise<Recorded | null>;
  onPlayed: () => void;
};

export function WordGames({ plays, limit, onReward, onPlayed }: Props) {
  const [params, setParams] = useSearchParams();
  const incoming = useMemo(() => decodeChallenge(params.get("vs")), [params]);
  const [run, setRun] = useState<{ mode: GameMode; seed: number; round: number; vs: Challenge | null } | null>(null);
  const [summary, setSummary] = useState<GameSummary | null>(null);
  const [reward, setReward] = useState<Recorded | null>(null);
  const daily = todaySeed();
  const [blocked, setBlocked] = useState<GameMode | null>(null);
  const [starting, setStarting] = useState(false);
  const left = (m: GameMode) => Math.max(0, limit - (plays[m] ?? 0));
  const preview = useMemo(() => seededShuffle(EXPRESSIONS, rng(daily)).slice(0, 3), [daily]);
  // 오늘의 AI 세트(하루 5개). 받기 전 · 실패 시엔 기본 문제로 논다.
  const [sets, setSets] = useState<GameSet[] | null>(null);
  useEffect(() => {
    void loadGameSets().then(setSets);
  }, []);

  const start = async (mode: GameMode, seed: number, vs: Challenge | null = null) => {
    let setIndex: number | null = null;
    // 받은 도전장은 한도와 상관없이(친구를 데려오는 길은 막지 않는다). 그 밖에는 서버가 게임마다 하루 5판을 센다.
    if (!vs) {
      if (starting) return;
      setStarting(true);
      try {
        setIndex = (await api.gamePlay(mode)).setIndex;
      } catch (e) {
        if ((e as ApiError).code === "game_daily_limit") {
          play("lose");
          setRun(null);
          setSummary(null);
          setBlocked(mode);
          return;
        }
        // 서버에 못 닿으면 기본 문제로 그냥 논다(한도는 다음 판에서 다시 센다)
      } finally {
        setStarting(false);
        onPlayed();
      }
    }
    // 판마다 오늘의 세트 중 다른 세트(서버가 정한 순번). 도전장 · 오늘의 챌린지는 모두 같은 문제여야 해서 기본 문제로.
    setActiveGameSet(!vs && seed !== daily && sets && setIndex !== null ? sets[setIndex % sets.length] : null);
    play("start");
    setSummary(null);
    setReward(null);
    setRun((r) => ({ mode, seed, vs, round: (r?.round ?? 0) + 1 }));
  };
  const finish = (s: GameSummary) => {
    saveBest(s.mode, s.score);
    setSummary(s);
    void claimActivityToken("game", "오픽게임 한 판");
    // 경험치는 서버가 정답 수로 준다(한 판 최대 15)
    void api
      .gameFinish(s.mode, s.correct)
      .catch(() => null)
      .then(() => onReward())
      .then((r) => setReward(r ?? { state: { xp: 0, streak: 0, bestStreak: 0, lastDay: null, today: "", todayCount: 0 }, gained: 0, goalJustReached: false, streakUp: false }));
  };
  const exit = () => {
    setRun(null);
    setSummary(null);
    if (incoming) setParams({}, { replace: true }); // 도전 끝나면 링크 정보 지우기
  };

  if (blocked) return <LimitReached title={MODE_INFO[blocked].title} limit={limit} onBack={() => setBlocked(null)} />;

  if (run && summary && reward)
    return (
      <GameResult
        summary={summary}
        reward={reward}
        challenge={run.vs}
        // 도전장 · 오늘의 챌린지는 같은 문제로 다시, 일반 판은 새 문제로
        onAgain={() => void start(run.mode, run.vs || run.seed === daily ? run.seed : newSeed(), run.vs)}
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
          <button className="btn btn-primary" onClick={() => void start(incoming.m, incoming.s, incoming)}>
            도전 수락
          </button>
        </section>
      ) : (
        <div className="mode-hero">
          <Mascot mood="happy" size={96} />
          <div>
            <p className="eyebrow">매일 새 문제</p>
            <h1>오픽게임</h1>
            <p className="lead">OPIc 답변에 바로 쓰는 표현을 매일 새로 나오는 문제로 익혀요. 게임마다 하루 {limit}판, 판마다 다른 문제가 나와요.</p>
          </div>
        </div>
      )}

      {!incoming && (
      <button className="daily-card" onClick={() => void start("speed", daily)} disabled={starting}>
        <span className="daily-icon">
          <Icon name="timer" size={40} />
        </span>
        <span className="daily-text">
          <small>
            오늘의 챌린지 · 모두 같은 문제 · 스피드 퀴즈 남은 판 {left("speed")}/{limit}
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
            <button
              key={m}
              className={`mode-card${left(m) === 0 ? " spent" : ""}`}
              title={info.desc}
              style={{ animationDelay: `${n * 50}ms` }}
              disabled={starting}
              onClick={() => void start(m, newSeed())}
            >
              <span className="mode-icon">
                <Icon name={info.icon} size={44} />
              </span>
              <span className={`mode-tag${info.tag === "NEW" ? " new" : ""}`}>{info.tag}</span>
              <strong>{info.title}</strong>
              <span>{info.desc}</span>
              <small>
                남은 판 {left(m)}/{limit} · 최고 {loadBest(m)}
              </small>
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
