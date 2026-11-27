import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../assets/Icon";
import { Mascot, type Mood } from "../assets/Mascot";
import { api, type ApiError, type Evaluation, type QuestionSet } from "../lib/api";
import type { Gain } from "../lib/progress";
import { quickCheck, type QuickCheck } from "../lib/quickcheck";
import { speak, speechSupported, useAnswerRecorder, type Recording } from "../lib/recorder";
import { play } from "../lib/sfx";
import { canWatchAd, watchAdForToken } from "../lib/tokens";
import { SECTION } from "./PathHome";
import { Confetti, QuickCheckCard, RewardChips } from "./Reward";
import { ResultDetail } from "./ResultDetail";

type Phase = "ready" | "recording" | "checked" | "analyzing" | "result" | "quota";

type Props = {
  set: QuestionSet;
  index: number;
  /** 화면에 보이는 단계 번호(묶음을 넘어 이어지는 번호) */
  stepNumber: number;
  done: number;
  steps: number;
  results: Record<number, Evaluation>;
  plan: string;
  tokens: number | null;
  onClose: () => void;
  /** 이 단계를 끝내고 다음 단계로(묶음의 마지막 단계면 경로로) */
  onNext: () => void;
  onEvaluated: (number: number, evaluation: Evaluation) => Promise<Gain | null>;
};

/** 학습 단계 하나: 듣기 → 말하기 → 간단 체크 → AI 분석(토큰 1)까지 해야 단계 완료. 건너뛰기는 없다. */
export function Lesson(props: Props) {
  const { set, index, stepNumber, done, steps, results, plan, tokens, onClose, onNext } = props;
  const question = set.questions[index];
  const [phase, setPhase] = useState<Phase>(results[question.number] ? "result" : "ready");
  const [pending, setPending] = useState<Recording | null>(null);
  const [check, setCheck] = useState<QuickCheck | null>(null);
  const [reward, setReward] = useState<Gain | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorder = useAnswerRecorder();
  const evalKey = useRef(crypto.randomUUID()); // 같은 답변 재전송 = 같은 키 → 추가 차감 없음
  const result = results[question.number];
  const section = SECTION[question.examSection] ?? SECTION.practice;
  const isLast = index >= set.questions.length - 1;

  const finishRecording = (r: Recording) => {
    play("rec_stop");
    setPending(r);
    if (!r.transcript) {
      play("wrong", { volume: 0.5 });
      setError("인식된 답변이 없어요. 조금 더 크게, 영어로 다시 말해 주세요.");
      setPhase("ready");
      return;
    }
    setCheck(quickCheck(r.transcript, r.seconds));
    setPhase("checked");
  };

  useEffect(() => {
    recorder.onAutoStop.current = finishRecording;
  });

  useEffect(() => {
    setPhase(results[question.number] ? "result" : "ready");
    setPending(null);
    setCheck(null);
    setReward(null);
    setShowDetail(false);
    setError(null);
    evalKey.current = crypto.randomUUID();
    window.speechSynthesis?.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.number]);

  const record = async () => {
    if (phase === "recording") {
      finishRecording(await recorder.stop());
      return;
    }
    window.speechSynthesis?.cancel();
    setError(null);
    setReward(null);
    evalKey.current = crypto.randomUUID();
    await recorder.start();
    play("rec_start");
    setPhase("recording");
  };

  const analyze = async () => {
    if (!pending?.transcript) return;
    setPhase("analyzing");
    setError(null);
    try {
      const evaluation = await api.evaluate(
        { set, number: question.number, transcript: pending.transcript, audio: pending.audio },
        evalKey.current,
      );
      play("correct");
      setPhase("result");
      setReward(await props.onEvaluated(question.number, evaluation));
    } catch (e) {
      const err = e as ApiError;
      play("wrong", { volume: 0.5 });
      if (err.isQuotaExhausted) setPhase("quota");
      else {
        setError(err.message);
        setPhase("checked");
      }
    }
  };

  const next = () => {
    play("tap", { volume: 0.5 });
    onNext();
  };

  const mood: Mood =
    phase === "recording" ? "listen" : phase === "analyzing" ? "think" : phase === "quota" ? "sad"
    : phase === "result" || (check && check.stars >= 2) ? "happy" : check ? "cheer" : "idle";
  const bubble =
    phase === "recording" ? "듣고 있어요! 영어로 쭉 말해 보세요"
    : phase === "analyzing" ? "AI가 답변을 꼼꼼히 보고 있어요…"
    : phase === "checked" ? (check && check.stars >= 2 ? "오, 흐름이 좋은데요? AI 분석으로 단계를 끝내요" : "좋아요! 다시 말하거나 AI 분석으로 끝내요")
    : phase === "result" ? "진단 결과가 나왔어요"
    : "질문을 듣고, 마이크를 눌러 답해 보세요";

  return (
    <div className="lesson">
      {reward?.goalJustReached && <Confetti />}
      <header className="lesson-top">
        <button className="icon-btn" onClick={onClose} aria-label="학습 경로로 돌아가기">
          <Icon name="close" size={22} />
        </button>
        <div className="lesson-progress" aria-label={`${done} / ${steps}`}>
          <span style={{ transform: `scaleX(${Math.max(0.03, done / steps)})` }} />
        </div>
        <span className="lesson-count">
          {stepNumber}
          <small>단계</small>
        </span>
        <span className="bar-token" title="오늘 남은 AI 분석 토큰">
          <Icon name="coin" size={20} /> {tokens ?? "–"}
        </span>
      </header>

      <main className="lesson-body" key={question.number}>
        <p className="lesson-section">
          <Icon name={section.icon} size={22} /> {section.label} · {question.difficulty}
        </p>

        <div className="talk-row">
          <Mascot mood={mood} size={92} />
          <p className="talk-bubble" key={bubble}>
            {bubble}
          </p>
        </div>

        <div className="prompt-row">
          <button
            className="speak-btn"
            onClick={() => {
              play("tap", { volume: 0.5 });
              speak(question.prompt);
            }}
            disabled={phase === "recording"}
            aria-label="질문 듣기"
          >
            <Icon name="speaker" size={30} />
          </button>
          <p className="prompt-bubble">{question.prompt}</p>
        </div>

        {!speechSupported && (
          <p className="lesson-error">이 브라우저는 음성 인식을 지원하지 않아요. Chrome · Safari · Edge에서 이용해 주세요.</p>
        )}

        {(phase === "ready" || phase === "recording") && (
          <div className="mic-stage">
            <button
              className={`big-mic${phase === "recording" ? " on" : ""}`}
              onClick={record}
              disabled={!speechSupported}
              aria-label={phase === "recording" ? "답변 완료" : "말하기 시작"}
            >
              {phase === "recording" ? <span className="stop-sq" /> : <MicGlyph />}
            </button>
            {phase === "recording" ? (
              <>
                <span className="live-bars" aria-hidden="true">
                  {Array.from({ length: 11 }, (_, n) => (
                    <span key={n} style={{ animationDelay: `${n * -0.09}s` }} />
                  ))}
                </span>
                <p className="mic-caption">
                  <span className="rec-dot" /> {recorder.remaining}초 남음
                </p>
              </>
            ) : (
              <p className="mic-caption">가운데 버튼을 눌러 영어로 답해요</p>
            )}
          </div>
        )}

        {phase === "recording" && recorder.liveText && <div className="transcript-card live">{recorder.liveText}</div>}

        {(phase === "checked" || phase === "analyzing") && pending && (
          <>
            <div className="transcript-card">{pending.transcript}</div>
            {check && <QuickCheckCard check={check} />}
          </>
        )}

        {phase === "analyzing" && (
          <div className="analyzing">
            <span className="dots">
              <i />
              <i />
              <i />
            </span>
            AI 정밀 분석 중
          </div>
        )}

        {phase === "result" && result && showDetail && <ResultDetail evaluation={result} plan={plan} />}
        {(error || recorder.error) && <p className="lesson-error">{error ?? recorder.error}</p>}
      </main>

      {phase === "checked" && (
        <footer className="lesson-bar sheet practiced">
          <div className="sheet-head">
            <div>
              <strong>답변을 받았어요</strong>
              <p>AI 분석까지 받으면 이 단계가 끝나요.</p>
            </div>
          </div>
          <div className="bar-actions">
            <button className="btn btn-ghost" onClick={record}>
              <Icon name="refresh" size={18} /> 다시 말하기
            </button>
            <button className="btn btn-primary" onClick={analyze} title="데일리 토큰 1개">
              <Icon name="sparkle" size={20} /> AI 분석하고 완료
              <span className="cost">
                <Icon name="coin" size={16} />1
              </span>
            </button>
          </div>
        </footer>
      )}

      {phase === "result" && result && (
        <footer className={`lesson-bar sheet result${reward ? " fresh" : ""}`}>
          <div className="sheet-head">
            <span className="grade-badge">{result.predictedLevel}</span>
            <div>
              <strong>{reward ? cheer(result.predictedLevel) : "이전에 받은 AI 진단이에요"}</strong>
              <p>{reward ? <RewardChips reward={reward} /> : "끝낸 단계예요. 다시 말하면 새로 분석받을 수 있어요."}</p>
            </div>
          </div>
          <div className="bar-actions">
            <button className="btn btn-ghost" onClick={() => setPhase("ready")}>
              다시 말하기
            </button>
            <button className="btn btn-secondary" onClick={() => setShowDetail((v) => !v)}>
              {showDetail ? "진단 접기" : "진단 보기"}
            </button>
            <button className="btn btn-primary" onClick={next}>
              {isLast ? "경로로" : "다음 단계"}
            </button>
          </div>
        </footer>
      )}

      {phase === "quota" && (
        <footer className="lesson-bar sheet quota">
          <div className="sheet-head">
            <Icon name="coin" size={48} />
            <div>
              <strong>오늘의 AI 분석 토큰을 다 썼어요</strong>
              <p>단계를 끝내려면 AI 분석이 필요해요. 토큰은 자정에 다시 채워져요. 보물상자 · 오픽게임으로도 토큰을 받을 수 있어요.</p>
            </div>
          </div>
          <div className="bar-actions">
            {canWatchAd(props.plan) ? (
              <button
                className="btn btn-secondary"
                onClick={() => void watchAdForToken().then((ok) => ok && setPhase(pending ? "checked" : "ready"))}
              >
                광고 보고 토큰 받기
              </button>
            ) : (
              <Link to="/membership#tokens" className="btn btn-secondary">
                토큰 · 이용권
              </Link>
            )}
            <button className="btn btn-primary" onClick={onClose}>
              경로로
            </button>
          </div>
        </footer>
      )}

      {phase === "analyzing" && (
        <footer className="lesson-bar">
          <button className="btn btn-primary btn-wide" disabled>
            분석 중…
          </button>
        </footer>
      )}
    </div>
  );
}

function cheer(level: string) {
  if (level === "AL" || level === "IH") return "훌륭해요! 고득점 페이스예요";
  if (level.startsWith("IM")) return "좋아요! 한 단계씩 올라가는 중";
  return "잘 시작했어요! 조금 더 길게 말해 봐요";
}

function MicGlyph() {
  return (
    <svg viewBox="0 0 32 32" width="58" height="58" aria-hidden="true">
      <rect x="10.5" y="2.5" width="11" height="17" rx="5.5" fill="#fff" />
      <path d="M7.5 15a8.5 8.5 0 0 0 17 0M16 24v4M11 28.5h10" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
