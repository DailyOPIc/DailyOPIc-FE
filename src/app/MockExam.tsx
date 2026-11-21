import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../assets/Icon";
import { Mascot } from "../assets/Mascot";
import { api, type ApiError, type Evaluation, type MockEvaluation, type MockSession, type Question, type Usage } from "../lib/api";
import type { StudyPrefs } from "../lib/prefs";
import { speak, speechSupported, useAnswerRecorder } from "../lib/recorder";
import { play } from "../lib/sfx";
import { ResultDetail } from "./ResultDetail";

// 실전 모의고사(15문항). 서버 단계: 생성 → 1~7번 → 난이도 조정 → 8~15번 → 채점.
// 답변 오디오는 채점 전까지 메모리에만 있으므로, 새로고침하면 같은 문제를 처음부터 다시 답한다.

export type Phase = "intro" | "loading" | "answer" | "adjust" | "result" | "limit";
type Answer = { transcript: string; audio: Blob };
type Props = {
  prefs: StudyPrefs;
  usage: Usage | null;
  onChanged: () => void;
  onReward: (xp: number) => void;
  /** 개발 미리보기(/dev/study?view=mock&phase=…)용 시작 상태 */
  dev?: { phase: Phase; session?: MockSession; result?: MockEvaluation };
};

const ADJUST = [
  { id: "easier", label: "쉽게", desc: "조금 더 쉬운 문제로" },
  { id: "same", label: "그대로", desc: "지금 난이도 유지" },
  { id: "harder", label: "어렵게", desc: "고난도 문제로 도전" },
] as const;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 서버가 아직 생성 중(409 mock_session_processing)이면 잠시 뒤 같은 요청을 다시 보낸다. */
async function retrying<T>(fn: () => Promise<T>): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if ((e as ApiError).code !== "mock_session_processing" || i >= 20) throw e;
      await sleep(3000);
    }
  }
}

export function MockExam({ prefs, usage, onChanged, onReward, dev }: Props) {
  const [phase, setPhase] = useState<Phase>(dev?.phase ?? "intro");
  const [loadingText, setLoadingText] = useState("");
  const [session, setSession] = useState<MockSession | null>(dev?.session ?? null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState<MockEvaluation | null>(dev?.result ?? null);
  const [error, setError] = useState<string | null>(null);
  const recorder = useAnswerRecorder();
  const keys = useRef({ create: crypto.randomUUID(), start: crypto.randomUUID(), adjust: crypto.randomUUID(), result: crypto.randomUUID() });

  const allQuestions: Question[] = session?.questionSet?.questions ?? [];
  const split = session?.questionSet?.requiresAdjustmentAfter ?? 7;
  const inTail = session?.stage !== "answering_front";
  const questions = allQuestions.filter((q) => inTail || q.number <= split);
  const question = questions[index];
  const answer = question ? answers[question.number] : undefined;
  const inProgress = phase === "answer" || phase === "adjust" || (phase === "loading" && Object.keys(answers).length > 0);

  // 답변 중 창을 닫으면 녹음이 사라진다
  useEffect(() => {
    if (!inProgress) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [inProgress]);

  const fail = (e: unknown) => {
    const err = e as ApiError;
    play("wrong", { volume: 0.5 });
    if (err.code === "mock_limit_reached" || err.code === "reward_quota_exhausted") {
      setError(err.message);
      setPhase("limit");
    } else {
      setError(err.message || "잠시 후 다시 시도해 주세요.");
      setPhase("intro");
    }
    onChanged();
  };

  const loading = (text: string) => {
    setLoadingText(text);
    setPhase("loading");
    setError(null);
  };

  /** 서버 단계에 맞춰 다음 화면으로 */
  const advance = async (s: MockSession, done: Record<number, Answer>) => {
    setSession(s);
    const firstMissing = (list: Question[]) => Math.max(0, list.findIndex((q) => !done[q.number]));
    switch (s.stage) {
      case "awaiting_start_ad":
      case "generating_front": {
        loading("문제를 만들고 있어요… (30초 정도 걸려요)");
        const { nonce } = await api.rewardIntent("mock_start", s.sessionHash);
        return advance(await retrying(() => api.mockStart(s.sessionId, nonce, keys.current.start)), done);
      }
      case "answering_front": {
        const front = (s.questionSet?.questions ?? []).filter((q) => q.number <= (s.questionSet?.requiresAdjustmentAfter ?? 7));
        setIndex(firstMissing(front));
        return setPhase(front.every((q) => done[q.number]) ? "adjust" : "answer");
      }
      case "awaiting_adjustment_ad":
      case "generating_tail":
        if (s.adjustment) return adjust(s, s.adjustment, done);
        return setPhase("adjust");
      default: {
        // 8~15번 답변 중 또는 결과 대기: 15문항 답이 다 있으면 채점, 아니면 빠진 문항부터
        const all = s.questionSet?.questions ?? [];
        if (all.length >= 15 && all.every((q) => done[q.number])) return submit(s, done);
        setIndex(firstMissing(all));
        return setPhase("answer");
      }
    }
  };

  const begin = async () => {
    play("start");
    loading("모의고사를 준비하고 있어요…");
    try {
      const s = usage?.mockSessionStage && usage.mockSessionStage !== "completed"
        ? await api.mockCurrent()
        : await api.mockCreate({ initialLevel: prefs.initialLevel, survey: prefs.survey }, keys.current.create);
      onChanged();
      await advance(s, answers);
    } catch (e) {
      fail(e);
    }
  };

  const adjust = async (s: MockSession, choice: "easier" | "same" | "harder", done = answers) => {
    loading("8번부터 15번 문제를 만들고 있어요…");
    try {
      const { nonce } = await api.rewardIntent("mock_adjustment", s.sessionHash);
      await advance(await retrying(() => api.mockAdjust(s.sessionId, choice, nonce, keys.current.adjust)), done);
    } catch (e) {
      fail(e);
    }
  };

  const submit = async (s: MockSession, done: Record<number, Answer>) => {
    loading("15개 답변을 채점하고 있어요… (1분 정도 걸려요)");
    try {
      const { nonce } = await api.rewardIntent("mock_result", s.sessionHash);
      const r = await retrying(() =>
        api.mockEvaluate(
          {
            sessionId: s.sessionId,
            setId: s.setId ?? s.questionSet?.setId ?? "",
            targetLevel: s.questionSet?.expectedTargetLevel ?? "IM2",
            rewardNonce: nonce,
            answers: Object.entries(done).map(([n, a]) => ({ number: Number(n), ...a })),
          },
          keys.current.result,
        ),
      );
      setResult(r);
      onReward(50);
      play("fanfare");
      setPhase("result");
      onChanged();
    } catch (e) {
      fail(e);
    }
  };

  const toggleRecord = async () => {
    if (!question) return;
    if (!recording) {
      setError(null);
      await recorder.start();
      play("rec_start");
      setRecording(true);
      return;
    }
    const r = await recorder.stop();
    setRecording(false);
    play("rec_stop");
    if (!r.audio) return setError("녹음이 저장되지 않았어요. 다시 말해 주세요.");
    setAnswers((prev) => ({ ...prev, [question.number]: { transcript: r.transcript || "(no transcript)", audio: r.audio! } }));
  };

  // 180초가 지나 자동으로 멈춘 녹음도 답으로 남긴다
  recorder.onAutoStop.current = (r) => {
    setRecording(false);
    if (question && r.audio) setAnswers((prev) => ({ ...prev, [question.number]: { transcript: r.transcript || "(no transcript)", audio: r.audio! } }));
  };

  const next = () => {
    play("tap", { volume: 0.5 });
    if (index < questions.length - 1) return setIndex(index + 1);
    if (!session) return;
    if (session.stage === "answering_front") return setPhase("adjust");
    void submit(session, answers);
  };

  const abandon = async () => {
    if (!session || !window.confirm("이번 회차를 그만둘까요? 오늘 남은 횟수는 돌아오지 않아요.")) return;
    try {
      await api.mockAbandon(session.sessionId);
    } catch {
      /* 이미 끝난 회차 */
    }
    setSession(null);
    setAnswers({});
    setPhase("intro");
    onChanged();
  };

  if (phase === "loading")
    return (
      <div className="mode-page mock">
        <div className="splash inline">
          <Mascot mood="think" size={110} />
          <p>{loadingText}</p>
        </div>
      </div>
    );

  if (phase === "limit")
    return (
      <div className="mode-page mock">
        <div className="mode-hero">
          <Mascot mood="sad" size={96} />
          <h1>오늘 모의고사를 모두 봤어요</h1>
          <p>{error ?? "무료 체험은 1회, 유료 플랜은 매일 다시 볼 수 있어요."}</p>
        </div>
        <div className="row-actions">
          <Link to="/membership" className="btn btn-primary">요금제 보기</Link>
          <Link to="/study/words" className="btn btn-ghost">오픽게임 하러 가기</Link>
        </div>
      </div>
    );

  if (phase === "result" && result)
    return (
      <div className="mode-page mock">
        <div className="mode-hero">
          <p className="eyebrow">모의고사 예상 등급</p>
          <div className="mock-grade">{result.predictedLevel}</div>
          <p>{result.overallFeedback}</p>
        </div>
        {/* 모의고사 결과는 플랜과 상관없이 전체를 보여 준다 */}
        <ResultDetail evaluation={{ ...result, answerQuality: "gradable" } as unknown as Evaluation} plan="mock" />
        <section className="detail-card">
          <h3>문항별 피드백</h3>
          <ol className="mock-per">
            {result.perQuestion.map((p) => (
              <li key={p.number}>
                <b>Q{p.number}</b> {p.feedback}
                <details>
                  <summary>모범 답안</summary>
                  <p className="answer-en">{p.sampleAnswer}</p>
                </details>
              </li>
            ))}
          </ol>
        </section>
        <p className="detail-hint">{result.disclaimer}</p>
        <div className="row-actions">
          <Link to="/study" className="btn btn-primary">오늘의 학습으로</Link>
        </div>
      </div>
    );

  if (phase === "adjust" && session)
    return (
      <div className="mode-page mock">
        <div className="mode-hero">
          <p className="eyebrow">7번까지 끝났어요</p>
          <h1>남은 8문항 난이도를 골라요</h1>
          <p>실제 OPIc처럼 중간에 난이도를 다시 정해요.</p>
        </div>
        <div className="mock-adjust">
          {ADJUST.map((a) => (
            <button key={a.id} className="mock-choice" onClick={() => void adjust(session, a.id)}>
              <strong>{a.label}</strong>
              <span>{a.desc}</span>
            </button>
          ))}
        </div>
      </div>
    );

  if (phase === "answer" && question)
    return (
      <div className="mode-page mock">
        <div className="mock-top">
          <span className="mock-count">
            Q{question.number} <em>/ 15</em>
          </span>
          <div className="mock-progress" aria-hidden>
            <span style={{ width: `${(Object.keys(answers).length / 15) * 100}%` }} />
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => void abandon()}>
            그만두기
          </button>
        </div>
        <div className="mock-question">
          <p>{question.prompt}</p>
          <button className="speak-btn small" onClick={() => speak(question.prompt)} aria-label="질문 듣기">
            <Icon name="speaker" size={24} />
          </button>
        </div>
        <div className="mic-stage">
          <button
            className={`big-mic${recording ? " on" : ""}`}
            onClick={() => void toggleRecord()}
            disabled={!speechSupported}
            aria-label={recording ? "답변 완료" : "말하기 시작"}
          >
            {recording ? <span className="stop-sq" /> : <Icon name="mic" size={64} className="mic-white" />}
          </button>
          <p className="mic-caption">
            {recording ? `${recorder.remaining}초 남음 · 다 말하면 눌러요` : answer ? "다시 누르면 새로 녹음해요" : "눌러서 말하기"}
          </p>
          {recording && recorder.liveText && <div className="transcript-card live">{recorder.liveText}</div>}
          {!recording && answer && <div className="transcript-card">{answer.transcript}</div>}
        </div>
        {(error || recorder.error) && <p className="lesson-error">{error ?? recorder.error}</p>}
        <div className="row-actions">
          {index > 0 && (
            <button className="btn btn-ghost" disabled={recording} onClick={() => setIndex(index - 1)}>
              이전
            </button>
          )}
          <button className="btn btn-primary" disabled={!answer || recording} onClick={next}>
            {index < questions.length - 1 ? "다음 문제" : session?.stage === "answering_front" ? "난이도 고르기" : "채점받기"}
          </button>
        </div>
      </div>
    );

  // 시작 화면
  const resumable = usage?.mockSessionStage && usage.mockSessionStage !== "completed";
  const left = usage?.mockRemaining;
  return (
    <div className="mode-page mock">
      <div className="mode-hero">
        <Icon name="clipboard" size={56} />
        <h1>실전 모의고사</h1>
        <p>실제 OPIc처럼 15문항을 이어서 답하고, 끝나면 예상 등급과 문항별 피드백을 받아요.</p>
      </div>
      <ul className="mock-rules">
        <li><b>15문항</b> 자기소개 · 설문 주제 · 돌발 · 롤플레이</li>
        <li><b>7번 뒤</b> 남은 문항 난이도 다시 고르기</li>
        <li><b>문항당 최대 3분</b> 조용한 곳에서 25분 정도 필요해요</li>
      </ul>
      {!speechSupported && <p className="lesson-error">이 브라우저는 녹음을 지원하지 않아요. Chrome · Safari · Edge에서 이용해 주세요.</p>}
      {error && <p className="lesson-error">{error}</p>}
      <div className="row-actions">
        <button
          className="btn btn-primary btn-lg"
          disabled={!speechSupported || (!resumable && usage?.mockAvailable === false)}
          onClick={() => void begin()}
        >
          {resumable ? "이어서 보기" : "모의고사 시작"}
        </button>
      </div>
      <p className="detail-hint">
        {resumable
          ? "진행 중인 회차가 있어요. 답변 녹음은 기기에 남지 않아 같은 문제를 처음부터 다시 답해요."
          : usage?.mockAvailable === false
            ? "오늘 볼 수 있는 모의고사를 모두 봤어요."
            : left != null
              ? `오늘 ${left}회 볼 수 있어요.`
              : "무료 체험 1회, 유료 플랜은 매일 볼 수 있어요."}
      </p>
    </div>
  );
}
