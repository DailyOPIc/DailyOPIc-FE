import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api, type ApiError, type Evaluation, type QuestionSet } from "../lib/api";
import { speak, speechSupported, useAnswerRecorder, type Recording } from "../lib/recorder";
import { sfx } from "../lib/sfx";
import { SECTION } from "./PathHome";
import { ResultDetail } from "./ResultDetail";

type Phase = "ready" | "recording" | "review" | "analyzing" | "result" | "quota";

export type Celebration = { gained: number; streakUp: boolean; streak: number; goalJustReached: boolean };

type Props = {
  set: QuestionSet;
  index: number;
  results: Record<number, Evaluation>;
  plan: string;
  onClose: () => void;
  onGo: (index: number) => void;
  onEvaluated: (number: number, evaluation: Evaluation) => Celebration;
};

/** 문항 하나를 푸는 전체 화면. 상단 진행 바, 가운데 문제와 마이크, 하단 확인 바. */
export function Lesson({ set, index, results, plan, onClose, onGo, onEvaluated }: Props) {
  const question = set.questions[index];
  const existing = results[question.number];
  const [phase, setPhase] = useState<Phase>(existing ? "result" : "ready");
  const [pending, setPending] = useState<Recording | null>(null);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorder = useAnswerRecorder();
  // 같은 답변 재전송 = 같은 키 → 서버가 추가 차감 없이 같은 결과를 준다.
  const evalKey = useRef(crypto.randomUUID());
  const result = results[question.number];
  const doneCount = set.questions.filter((q) => results[q.number]).length;
  const section = SECTION[question.examSection] ?? { label: question.examSection, icon: "🎯" };
  const isLast = index >= set.questions.length - 1;

  useEffect(() => {
    recorder.onAutoStop.current = (r) => {
      sfx.stop();
      setPending(r);
      setPhase("review");
    };
  }, [recorder.onAutoStop]);

  // 문항이 바뀌면 상태를 새로 시작한다.
  useEffect(() => {
    setPhase(results[question.number] ? "result" : "ready");
    setPending(null);
    setCelebration(null);
    setShowDetail(false);
    setError(null);
    evalKey.current = crypto.randomUUID();
    window.speechSynthesis?.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.number]);

  const record = async () => {
    if (phase === "recording") {
      const r = await recorder.stop();
      sfx.stop();
      setPending(r);
      setPhase("review");
      return;
    }
    window.speechSynthesis?.cancel();
    setError(null);
    evalKey.current = crypto.randomUUID();
    await recorder.start();
    sfx.start();
    setPhase("recording");
  };

  const analyze = async () => {
    if (!pending) return;
    if (!pending.transcript) {
      sfx.error();
      setError("인식된 답변이 없어요. 조금 더 크게, 영어로 다시 말해 주세요.");
      return;
    }
    setPhase("analyzing");
    setError(null);
    try {
      const evaluation = await api.evaluate(
        { set, number: question.number, transcript: pending.transcript, audio: pending.audio },
        evalKey.current,
      );
      const c = onEvaluated(question.number, evaluation);
      setCelebration(c);
      (c.goalJustReached ? sfx.goal : sfx.success)();
      setPhase("result");
    } catch (e) {
      const err = e as ApiError;
      sfx.error();
      if (err.isQuotaExhausted) setPhase("quota");
      else {
        setError(err.message);
        setPhase("review");
      }
    }
  };

  const next = () => {
    sfx.tap();
    if (isLast) onClose();
    else onGo(index + 1);
  };

  return (
    <div className="lesson">
      <header className="lesson-top">
        <button className="lesson-close" onClick={onClose} aria-label="학습 경로로 돌아가기">
          ✕
        </button>
        <div className="lesson-progress" aria-label={`${doneCount} / ${set.questions.length} 완료`}>
          <span style={{ transform: `scaleX(${Math.max(0.04, doneCount / set.questions.length)})` }} />
        </div>
        <span className="lesson-count">
          Q{question.number}
          <small>/15</small>
        </span>
      </header>

      <main className="lesson-body">
        <p className="lesson-section">
          {section.icon} {section.label} · {question.difficulty}
        </p>
        <div className="prompt-row">
          <button
            className="speak-btn"
            onClick={() => {
              sfx.tap();
              speak(question.prompt);
            }}
            disabled={phase === "recording"}
            aria-label="질문 듣기"
          >
            🔊
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
              {phase === "recording" ? <span className="stop-sq" /> : "🎙️"}
            </button>
            {phase === "recording" ? (
              <>
                <span className="live-bars" aria-hidden="true">
                  {Array.from({ length: 9 }, (_, n) => (
                    <span key={n} style={{ animationDelay: `${n * -0.11}s` }} />
                  ))}
                </span>
                <p className="mic-caption">듣고 있어요 · {recorder.remaining}초</p>
              </>
            ) : (
              <p className="mic-caption">눌러서 영어로 답해 보세요</p>
            )}
          </div>
        )}

        {phase !== "ready" && phase !== "result" && (
          <div className="transcript-card">
            {(phase === "recording" ? recorder.liveText : pending?.transcript) || "…"}
          </div>
        )}

        {phase === "analyzing" && (
          <div className="analyzing">
            <span className="dots">
              <i />
              <i />
              <i />
            </span>
            AI가 답변을 분석하고 있어요
          </div>
        )}

        {phase === "result" && result && showDetail && <ResultDetail evaluation={result} plan={plan} />}
        {(error || recorder.error) && <p className="lesson-error">{error ?? recorder.error}</p>}
      </main>

      {phase === "result" && result && (
        <ResultSheet
          evaluation={result}
          celebration={celebration}
          showDetail={showDetail}
          onToggle={() => setShowDetail((v) => !v)}
          onRetry={() => {
            setPhase("ready");
            setShowDetail(false);
          }}
          onNext={next}
          isLast={isLast}
        />
      )}

      {phase === "quota" && (
        <footer className="lesson-bar sheet quota">
          <div className="sheet-head">
            <span className="sheet-emoji">🪙</span>
            <div>
              <strong>오늘의 토큰을 모두 썼어요</strong>
              <p>토큰은 매일 자정에 다시 채워져요.</p>
            </div>
          </div>
          <div className="bar-actions">
            <Link to="/membership" className="btn btn-secondary">
              요금제 보기
            </Link>
            <button className="btn btn-primary" onClick={next}>
              {isLast ? "경로로" : "다음 문항"}
            </button>
          </div>
        </footer>
      )}

      {(phase === "ready" || phase === "recording" || phase === "review" || phase === "analyzing") && (
        <footer className="lesson-bar">
          {phase === "ready" && (
            <>
              <button className="btn btn-ghost" onClick={next}>
                건너뛰기
              </button>
              <button className="btn btn-primary" onClick={record} disabled={!speechSupported}>
                말하기 시작
              </button>
            </>
          )}
          {phase === "recording" && (
            <button className="btn btn-danger btn-wide" onClick={record}>
              답변 완료
            </button>
          )}
          {(phase === "review" || phase === "analyzing") && (
            <>
              <button className="btn btn-ghost" onClick={record} disabled={phase === "analyzing"}>
                다시 녹음
              </button>
              <button className="btn btn-primary" onClick={analyze} disabled={phase === "analyzing"}>
                {phase === "analyzing" ? "분석 중…" : "분석하기 · 🪙1"}
              </button>
            </>
          )}
        </footer>
      )}
    </div>
  );
}

function ResultSheet({
  evaluation: e,
  celebration,
  showDetail,
  onToggle,
  onRetry,
  onNext,
  isLast,
}: {
  evaluation: Evaluation;
  celebration: Celebration | null;
  showDetail: boolean;
  onToggle: () => void;
  onRetry: () => void;
  onNext: () => void;
  isLast: boolean;
}) {
  const fresh = Boolean(celebration);
  return (
    <footer className={`lesson-bar sheet result${fresh ? " fresh" : ""}`}>
      {celebration?.goalJustReached && <Confetti />}
      <div className="sheet-head">
        <span className="grade-badge">{e.predictedLevel}</span>
        <div>
          <strong>{fresh ? cheer(e.predictedLevel) : "이전에 받은 결과예요"}</strong>
          <p>
            {fresh && <span className="xp-pop">+{celebration!.gained} XP</span>}
            {celebration?.streakUp && <span className="streak-pop">🔥 {celebration.streak}일 연속!</span>}
            {celebration?.goalJustReached && <span className="goal-pop">🎉 오늘의 목표 달성</span>}
            {!fresh && "다시 답변하면 새로 분석해요."}
          </p>
        </div>
      </div>
      <div className="bar-actions">
        <button className="btn btn-ghost" onClick={onRetry}>
          다시 답변
        </button>
        <button className="btn btn-secondary" onClick={onToggle}>
          {showDetail ? "진단 접기" : "진단 보기"}
        </button>
        <button className="btn btn-primary" onClick={onNext}>
          {isLast ? "완료" : "계속"}
        </button>
      </div>
    </footer>
  );
}

function cheer(level: string) {
  if (level === "AL" || level === "IH") return "훌륭해요! 실전 고득점 페이스예요";
  if (level.startsWith("IM")) return "좋아요! 한 단계씩 올라가고 있어요";
  return "잘 시작했어요! 조금만 더 길게 말해 봐요";
}

function Confetti() {
  const colors = ["#4b24ff", "#9b87f5", "#10b981", "#f5a524", "#ef4444"];
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 36 }, (_, n) => (
        <i
          key={n}
          style={{
            left: `${(n * 37) % 100}%`,
            background: colors[n % colors.length],
            animationDelay: `${(n % 9) * 0.05}s`,
            animationDuration: `${1.4 + (n % 5) * 0.2}s`,
            transform: `rotate(${n * 23}deg)`,
          }}
        />
      ))}
    </div>
  );
}
