import { useCallback, useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api, ApiError, type Evaluation, type QuestionSet, type Usage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { LEVELS, SURVEY, TOPIC_GROUPS, loadPrefs, savePrefs, type StudyPrefs } from "../lib/prefs";
import { speak, speechSupported, useAnswerRecorder, type Recording } from "../lib/recorder";

const SECTION: Record<string, string> = {
  introduction: "자기소개",
  survey: "설문 주제",
  unexpected: "돌발 주제",
  roleplay: "롤플레이",
  comparison: "비교",
  advanced: "심화",
  practice: "연습",
};
const STYLE: Record<string, string> = {
  description: "묘사",
  routine: "루틴",
  past_experience: "경험",
  comparison: "비교",
  roleplay: "롤플레이",
  problem_solving: "문제 해결",
  opinion: "의견",
};
const AREA: [keyof Evaluation["scores"], string][] = [
  ["taskFulfillment", "과제 충족"],
  ["grammar", "문법"],
  ["vocabulary", "어휘"],
  ["discourse", "담화 구성"],
  ["fluency", "유창성"],
];
const CONFIDENCE: Record<string, string> = { low: "낮음", medium: "보통", high: "높음" };

export function Study() {
  const { user, ready } = useAuth();
  const [prefs, setPrefs] = useState<StudyPrefs | null>(() => (user ? loadPrefs(user.uid) : null));

  useEffect(() => {
    if (user) setPrefs(loadPrefs(user.uid));
  }, [user]);

  if (!ready) return <div className="study-loading">불러오는 중…</div>;
  if (!user) return <Navigate to="/login?next=/study" replace />;
  if (!prefs)
    return (
      <Onboarding
        onDone={(p) => {
          savePrefs(user.uid, p);
          setPrefs(p);
        }}
      />
    );
  return <Practice prefs={prefs} onEditPrefs={() => setPrefs(null)} />;
}

/* ───────── 온보딩: 자가 평가 단계 → 배경 설문 ───────── */

function Onboarding({ onDone }: { onDone: (p: StudyPrefs) => void }) {
  const [level, setLevel] = useState<number | null>(null);
  const [status, setStatus] = useState("student");
  const [residence, setResidence] = useState("family");
  const [topics, setTopics] = useState<Record<string, string[]>>({ leisure: [], hobbies: [], sports: [], travel: [] });
  const count = Object.values(topics).flat().length;

  const toggle = (group: string, id: string) =>
    setTopics((t) => {
      const list = t[group];
      if (list.includes(id)) return { ...t, [group]: list.filter((x) => x !== id) };
      if (list.length >= 6) return t;
      return { ...t, [group]: [...list, id] };
    });

  if (level === null)
    return (
      <div className="study wide">
        <p className="eyebrow">1 / 2 · 시작 단계</p>
        <h1 className="study-title">지금 말하기 실력은 어느 정도인가요?</h1>
        <p className="lead">고른 단계에 맞춰 오늘의 문제 난이도가 정해져요. 나중에 바꿀 수 있어요.</p>
        <div className="level-grid">
          {LEVELS.map((l) => (
            <button key={l.value} className="level-card" onClick={() => setLevel(l.value)}>
              <span className="level-step">{l.value}단계</span>
              <strong>예상 {l.range}</strong>
              <span>{l.desc}</span>
            </button>
          ))}
        </div>
      </div>
    );

  return (
    <div className="study wide">
      <p className="eyebrow">2 / 2 · 배경 설문</p>
      <h1 className="study-title">나에 대해 알려주세요</h1>
      <p className="lead">실제 OPIc처럼, 고른 주제로 질문이 나와요. 주제는 3개 이상 골라 주세요.</p>

      <fieldset className="survey-group">
        <legend>현재 상태</legend>
        <div className="chip-row">
          {SURVEY.status.map((o) => (
            <button key={o.id} className={status === o.id ? "chip on" : "chip"} onClick={() => setStatus(o.id)}>
              {o.label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="survey-group">
        <legend>사는 곳</legend>
        <div className="chip-row">
          {SURVEY.residence.map((o) => (
            <button
              key={o.id}
              className={residence === o.id ? "chip on" : "chip"}
              onClick={() => setResidence(o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>
      </fieldset>
      {TOPIC_GROUPS.map((g) => (
        <fieldset key={g.key} className="survey-group">
          <legend>{g.label}</legend>
          <div className="chip-row">
            {SURVEY.topics[g.key].map((o) => {
              const on = topics[g.key].includes(o.id);
              return (
                <button key={o.id} className={on ? "chip on" : "chip"} aria-pressed={on} onClick={() => toggle(g.key, o.id)}>
                  {o.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="study-actions">
        <button className="button button-ghost" onClick={() => setLevel(null)}>
          이전
        </button>
        <button
          className="button button-primary"
          disabled={count < 3}
          onClick={() =>
            onDone({
              initialLevel: level,
              survey: { status, residence, ...(topics as Record<"leisure" | "hobbies" | "sports" | "travel", string[]>) },
            })
          }
        >
          {count < 3 ? `주제 ${3 - count}개 더 골라 주세요` : "오늘의 문제 받기"}
        </button>
      </div>
    </div>
  );
}

/* ───────── 데일리 연습 ───────── */

type Phase = "idle" | "recording" | "review" | "analyzing";

const resultsKey = (setId: string) => `dailyopic:results:${setId}`;

function Practice({ prefs, onEditPrefs }: { prefs: StudyPrefs; onEditPrefs: () => void }) {
  const [set, setSet] = useState<QuestionSet | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [plan, setPlan] = useState("free");
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [pending, setPending] = useState<Recording | null>(null);
  const [results, setResults] = useState<Record<number, Evaluation>>({});
  const [error, setError] = useState<string | null>(null);
  const [quotaOut, setQuotaOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const recorder = useAnswerRecorder();
  // 같은 답변을 다시 보내면(재시도) 같은 키 → 서버가 추가 차감 없이 같은 결과를 준다.
  const evalKey = useRef<string>(crypto.randomUUID());

  const tokens = usage ? usage.freeRemaining + usage.bonusRemaining : null;
  const question = set?.questions[index];
  const result = question ? results[question.number] : undefined;

  const refreshUsage = useCallback(() => api.usage().then(setUsage).catch(() => {}), []);

  const applySet = (s: QuestionSet) => {
    setSet(s);
    setIndex(0);
    setPending(null);
    setPhase("idle");
    try {
      setResults(JSON.parse(localStorage.getItem(resultsKey(s.setId)) ?? "{}"));
    } catch {
      setResults({});
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      api.practiceSet({ initialLevel: prefs.initialLevel, survey: prefs.survey }, crypto.randomUUID()),
      api.usage(),
      api.capabilities().catch(() => ({ plan: "free" })),
    ])
      .then(([s, u, c]) => {
        if (cancelled) return;
        applySet(s);
        setUsage(u);
        setPlan(c.plan);
      })
      .catch((e: ApiError) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [prefs]);

  // 180초가 끝나 자동으로 멈춘 녹음도 검토 단계로 보낸다.
  useEffect(() => {
    recorder.onAutoStop.current = (r) => {
      setPending(r);
      setPhase("review");
    };
  }, [recorder.onAutoStop]);

  const goTo = (n: number) => {
    if (phase === "recording" || phase === "analyzing") return;
    window.speechSynthesis?.cancel();
    setIndex(n);
    setPending(null);
    setPhase("idle");
    setError(null);
    evalKey.current = crypto.randomUUID();
  };

  const toggleRecord = async () => {
    if (phase === "recording") {
      const r = await recorder.stop();
      setPending(r);
      setPhase("review");
      return;
    }
    window.speechSynthesis?.cancel();
    setPending(null);
    setError(null);
    evalKey.current = crypto.randomUUID();
    await recorder.start();
    setPhase("recording");
  };

  const analyze = async () => {
    if (!set || !question || !pending) return;
    if (!pending.transcript) {
      setError("인식된 답변이 없어요. 조금 더 크게, 영어로 다시 녹음해 주세요.");
      return;
    }
    setPhase("analyzing");
    setError(null);
    setQuotaOut(false);
    try {
      const evaluation = await api.evaluate(
        { set, number: question.number, transcript: pending.transcript, audio: pending.audio },
        evalKey.current,
      );
      const next = { ...results, [question.number]: evaluation };
      setResults(next);
      try {
        localStorage.setItem(resultsKey(set.setId), JSON.stringify(next));
      } catch {
        /* 저장이 막혀도 화면 결과는 유지 */
      }
      setPending(null);
      setPhase("idle");
      evalKey.current = crypto.randomUUID();
    } catch (e) {
      const err = e as ApiError;
      if (err.isQuotaExhausted) setQuotaOut(true);
      else setError(err.message);
      setPhase("review");
    } finally {
      refreshUsage();
    }
  };

  const newSet = async () => {
    if (!window.confirm("데일리 토큰 1개를 써서 새 문제 세트를 받을까요?")) return;
    setLoading(true);
    setError(null);
    try {
      applySet(await api.refreshSet({ initialLevel: prefs.initialLevel, survey: prefs.survey }, crypto.randomUUID()));
    } catch (e) {
      const err = e as ApiError;
      if (err.isQuotaExhausted) setQuotaOut(true);
      else setError(err.message);
    } finally {
      setLoading(false);
      refreshUsage();
    }
  };

  if (loading && !set)
    return (
      <div className="study wide study-loading">
        <span className="loader" aria-hidden="true" />
        오늘의 문제를 준비하고 있어요…
      </div>
    );

  if (!set || !question)
    return (
      <div className="study wide">
        <h1 className="study-title">문제를 불러오지 못했어요</h1>
        <p className="lead">{error ?? "잠시 후 다시 시도해 주세요."}</p>
        <button className="button button-primary" onClick={() => window.location.reload()}>
          다시 시도
        </button>
      </div>
    );

  return (
    <div className="study wide">
      <div className="study-top">
        <span className="token-pill" title="매일 자정(한국 시간)에 다시 채워져요">
          데일리 토큰 <b>{tokens ?? "–"}</b>
        </span>
        <div className="study-top-actions">
          <button className="text-button" onClick={newSet} disabled={loading || phase !== "idle"}>
            새 문제 받기 · 토큰 1개
          </button>
          <button className="text-button" onClick={onEditPrefs} disabled={phase !== "idle"}>
            단계 · 설문 바꾸기
          </button>
        </div>
      </div>

      <nav className="q-nav" aria-label="문항">
        {set.questions.map((q, n) => (
          <button
            key={q.number}
            className={`q-dot${n === index ? " current" : ""}${results[q.number] ? " done" : ""}`}
            onClick={() => goTo(n)}
            aria-current={n === index ? "step" : undefined}
          >
            Q{q.number}
          </button>
        ))}
      </nav>

      <div className="practice-grid">
        <section className="question-panel">
          <div className="question-meta">
            <span>Q{question.number}</span>
            <span>{SECTION[question.examSection] ?? question.examSection}</span>
            {question.questionStyle && <span>{STYLE[question.questionStyle] ?? question.questionStyle}</span>}
            <span className="difficulty">{question.difficulty}</span>
          </div>
          <p className="question-text">{question.prompt}</p>
          <button className="button button-soft" onClick={() => speak(question.prompt)} disabled={phase === "recording"}>
            🔊 질문 듣기
          </button>
        </section>

        <section className="answer-panel">
          {!speechSupported && (
            <p className="form-error">이 브라우저는 음성 인식을 지원하지 않아요. Chrome · Safari · Edge에서 이용해 주세요.</p>
          )}

          {(phase === "idle" || phase === "recording") && !result && (
            <div className="record-area">
              <button
                className={`mic-button${phase === "recording" ? " recording" : ""}`}
                onClick={toggleRecord}
                disabled={!speechSupported}
                aria-label={phase === "recording" ? "답변 완료" : "답변 녹음 시작"}
              >
                {phase === "recording" ? <span className="stop-square" /> : <MicIcon />}
              </button>
              <p className="record-label">{phase === "recording" ? "탭하면 답변 완료" : "탭하고 답변하기"}</p>
              {phase === "recording" && <p className="record-timer">남은 시간 {recorder.remaining}초</p>}
            </div>
          )}

          {(phase === "recording" || phase === "review" || phase === "analyzing") && (
            <div className="transcript-box">
              <p className="transcript-label">{phase === "recording" ? "듣고 있어요" : "내 답변"}</p>
              <p className="transcript">
                {(phase === "recording" ? recorder.liveText : pending?.transcript) || "영어로 답변해 주세요."}
              </p>
            </div>
          )}

          {(phase === "review" || phase === "analyzing") && (
            <div className="review-actions">
              <p className="cost-line">분석하면 데일리 토큰 1개를 써요.</p>
              <button className="button button-primary" onClick={analyze} disabled={phase === "analyzing"}>
                {phase === "analyzing" ? "분석하고 있어요…" : "✨ 분석하기"}
              </button>
              <button className="button button-soft" onClick={toggleRecord} disabled={phase === "analyzing"}>
                다시 녹음
              </button>
            </div>
          )}

          {quotaOut && (
            <div className="quota-box" role="alert">
              <strong>오늘의 데일리 토큰을 모두 썼어요</strong>
              <p>토큰은 매일 자정에 다시 채워져요. 더 연습하려면 플랜을 확인해 보세요.</p>
              <Link to="/membership" className="button button-primary">
                요금제 보기
              </Link>
            </div>
          )}
          {(error || recorder.error) && (
            <p className="form-error" role="alert">
              {error ?? recorder.error}
            </p>
          )}

          {result && <Result evaluation={result} plan={plan} onRetry={() => setResults((r) => {
            const copy = { ...r };
            delete copy[question.number];
            return copy;
          })} />}
        </section>
      </div>

      <div className="study-pager">
        <button className="button button-ghost" onClick={() => goTo(index - 1)} disabled={index === 0}>
          ← 이전
        </button>
        <button
          className="button button-ghost"
          onClick={() => goTo(index + 1)}
          disabled={index >= set.questions.length - 1}
        >
          다음 →
        </button>
      </div>
    </div>
  );
}

function Result({ evaluation: e, plan, onRetry }: { evaluation: Evaluation; plan: string; onRetry: () => void }) {
  const locked = plan === "free";
  return (
    <div className="result">
      <div className="result-grade">
        <span>OPIc 예상 등급</span>
        <strong>{e.predictedLevel}</strong>
        <small>신뢰도 {CONFIDENCE[e.confidence] ?? e.confidence} · AI 예상 등급이라 실제 시험 결과와 다를 수 있어요.</small>
      </div>
      {e.warnings.length > 0 && <p className="result-warning">{e.warnings[0]}</p>}

      <ul className="result-areas">
        {AREA.map(([k, label]) => (
          <li key={k}>
            <span>{label}</span>
            <span className="bar">
              <span style={{ width: `${e.scores[k]}%`, transform: "none" }} />
            </span>
            <b>{e.scores[k]}</b>
          </li>
        ))}
      </ul>

      <div className="result-block good">
        <h3>잘한 점</h3>
        <ul>
          {e.strengths.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
      <div className="result-block fix">
        <h3>개선할 점</h3>
        <ul>
          {e.improvements.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
      {e.targetGap && (
        <div className="result-block">
          <h3>목표 등급까지</h3>
          <p>{e.targetGap}</p>
        </div>
      )}
      {e.correctedAnswer && (
        <div className="result-block">
          <h3>교정 답안</h3>
          <p className="answer-en">{e.correctedAnswer}</p>
        </div>
      )}
      {e.sampleAnswer && (
        <div className="result-block">
          <h3>모범 답안</h3>
          <p className="answer-en">{e.sampleAnswer}</p>
        </div>
      )}
      {locked && !e.correctedAnswer && (
        <div className="result-block locked">
          <h3>🔒 교정 답안 · 모범 답안 · 목표 등급까지</h3>
          <p>베이직 플랜부터 결과 전체를 볼 수 있어요.</p>
          <Link to="/membership" className="text-link">
            요금제 보기 →
          </Link>
        </div>
      )}
      <p className="result-disclaimer">{e.disclaimer}</p>
      <button className="button button-soft" onClick={onRetry}>
        이 문항 다시 답변하기
      </button>
    </div>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor" aria-hidden="true">
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
    </svg>
  );
}
