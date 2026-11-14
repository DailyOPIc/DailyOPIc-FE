import { useEffect, useMemo, useState } from "react";
import { Icon } from "../assets/Icon";
import { Mascot } from "../assets/Mascot";
import { PROMPTS, STYLE_LABEL, type Prompt } from "../data/prompts";
import { rng, seededShuffle, todaySeed } from "../lib/challenge";
import { XP, type Recorded } from "../lib/game";
import { consume, FREE_DAILY, remaining } from "../lib/limits";
import type { StudyPrefs } from "../lib/prefs";
import { quickCheck, type QuickCheck } from "../lib/quickcheck";
import { speak, speechSupported, useAnswerRecorder } from "../lib/recorder";
import { play } from "../lib/sfx";
import { LimitReached } from "./LimitReached";
import { Confetti, QuickCheckCard, RewardChips } from "./Reward";

type Phase = "pick" | "rolling" | "ready" | "recording" | "checked";

/** 무료 랜덤 스피킹: 내 설문 주제에서 문제를 뽑아 무제한으로 말하기 연습(AI 분석 없음, 토큰 0). */
type Props = { uid: string; plan: string; prefs: StudyPrefs; onReward: (xp: number) => Recorded; onLimitUse: () => void };

export function RandomSpeak({ uid, plan, prefs, onReward, onLimitUse }: Props) {
  const pool = useMemo(() => {
    const mine = new Set([...prefs.survey.leisure, ...prefs.survey.hobbies, ...prefs.survey.sports, ...prefs.survey.travel, "home", "any"]);
    const list = PROMPTS.filter((p) => mine.has(p.topic));
    // 오늘의 문제 순서: 날짜(한국)로 섞어서 매일 바뀐다
    return seededShuffle(list.length >= 6 ? list : PROMPTS, rng(todaySeed()));
  }, [prefs]);
  const [drawn, setDrawn] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const left = remaining(uid, plan, "speak");
  const [phase, setPhase] = useState<Phase>("pick");
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [rollFace, setRollFace] = useState<Prompt | null>(null);
  const [check, setCheck] = useState<QuickCheck | null>(null);
  const [transcript, setTranscript] = useState("");
  const [reward, setReward] = useState<Recorded | null>(null);
  const [count, setCount] = useState(0);
  const recorder = useAnswerRecorder();

  const roll = () => {
    // 새 문제를 뽑을 때 하루 한도를 쓴다(같은 문제 다시 말하기는 무료)
    if (!consume(uid, plan, "speak")) {
      play("lose");
      setBlocked(true);
      return;
    }
    onLimitUse();
    play("start");
    setPhase("rolling");
    setCheck(null);
    setReward(null);
    let n = 0;
    const id = window.setInterval(() => {
      setRollFace(pool[Math.floor(Math.random() * pool.length)]);
      play("key", { rate: 1 + n * 0.05, volume: 0.4 });
      if (++n >= 9) {
        window.clearInterval(id);
        const pick = pool[drawn % pool.length];
        setDrawn((d) => d + 1);
        setPrompt(pick);
        setRollFace(null);
        play("select");
        setPhase("ready");
      }
    }, 90);
  };

  const finish = (r: { transcript: string; seconds: number }) => {
    play("rec_stop");
    if (!r.transcript) {
      play("wrong", { volume: 0.5 });
      setPhase("ready");
      return;
    }
    setTranscript(r.transcript);
    const c = quickCheck(r.transcript, r.seconds);
    setCheck(c);
    // 같은 문제를 다시 말해도 경험치는 첫 답변에만
    if (!reward) setReward(onReward(XP.practice));
    setCount((v) => v + 1);
    setPhase("checked");
  };

  useEffect(() => {
    recorder.onAutoStop.current = finish;
  });

  const record = async () => {
    if (phase === "recording") return finish(await recorder.stop());
    window.speechSynthesis?.cancel();
    await recorder.start();
    play("rec_start");
    setPhase("recording");
  };

  if (blocked) return <LimitReached kind="speak" onBack={() => setBlocked(false)} />;

  if (phase === "pick")
    return (
      <div className="mode-page">
        <div className="mode-hero">
          <Mascot mood="cheer" size={120} />
          <div>
            <p className="eyebrow">무료 · 무제한</p>
            <h1>랜덤 스피킹</h1>
            <p className="lead">내 관심 주제에서 OPIc 스타일 질문을 뽑아요. 말하고 바로 간단 체크로 별을 모아 보세요.</p>
          </div>
        </div>
        <button className="dice-card" onClick={roll}>
          <Icon name="dice" size={64} className="dice-spin" />
          <strong>문제 뽑기</strong>
          <span>{Number.isFinite(left) ? `오늘 남은 문제 ${left} / ${FREE_DAILY.speak}` : "무제한"}</span>
        </button>
      </div>
    );

  return (
    <div className="mode-page">
      <div className="mode-top">
        <span className="pill-count">
          <Icon name="mic" size={20} /> 오늘 {count}개 말함{Number.isFinite(left) ? ` · 남은 문제 ${left}` : ""}
        </span>
        <button className="btn btn-ghost" onClick={roll} disabled={phase === "rolling" || phase === "recording"}>
          <Icon name="shuffle" size={18} /> 다른 문제
        </button>
      </div>

      <div className={`flip-card${phase === "rolling" ? " rolling" : ""}`} key={prompt?.en}>
        {phase === "rolling" ? (
          <p className="flip-text blur">{rollFace?.en}</p>
        ) : (
          prompt && (
            <>
              <span className="flip-tag">{STYLE_LABEL[prompt.style]}</span>
              <p className="flip-text">{prompt.en}</p>
              <button
                className="speak-btn small"
                onClick={() => {
                  play("tap", { volume: 0.5 });
                  speak(prompt.en);
                }}
                aria-label="질문 듣기"
              >
                <Icon name="speaker" size={24} />
              </button>
            </>
          )
        )}
      </div>

      {reward?.goalJustReached && <Confetti />}

      {(phase === "ready" || phase === "recording") && (
        <div className="mic-stage">
          <button
            className={`big-mic${phase === "recording" ? " on" : ""}`}
            onClick={record}
            disabled={!speechSupported}
            aria-label={phase === "recording" ? "답변 완료" : "말하기 시작"}
          >
            {phase === "recording" ? <span className="stop-sq" /> : <Icon name="mic" size={64} className="mic-white" />}
          </button>
          <p className="mic-caption">{phase === "recording" ? `${recorder.remaining}초 남음 · 다 말하면 눌러요` : "눌러서 말하기"}</p>
          {phase === "recording" && recorder.liveText && <div className="transcript-card live">{recorder.liveText}</div>}
        </div>
      )}

      {phase === "checked" && check && (
        <div className="checked-area">
          <div className="transcript-card">{transcript}</div>
          <QuickCheckCard check={check} />
          {reward && (
            <p className="reward-line">
              <RewardChips reward={reward} />
            </p>
          )}
          <div className="row-actions">
            <button className="btn btn-ghost" onClick={record}>
              <Icon name="refresh" size={18} /> 다시 말하기
            </button>
            <button className="btn btn-primary" onClick={roll}>
              <Icon name="dice" size={20} /> 다음 문제 뽑기
            </button>
          </div>
        </div>
      )}
      {recorder.error && <p className="lesson-error">{recorder.error}</p>}
    </div>
  );
}
