import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../assets/Icon";
import { api, type ApiError, type OPIcLevel, type VocabCoach, type VocabEntry, type VocabSet } from "../lib/api";
import { kstDay } from "../lib/game";
import type { StudyPrefs } from "../lib/prefs";
import { speak, speechSupported, useAnswerRecorder } from "../lib/recorder";
import { play } from "../lib/sfx";

// 서버 VocabularyTopic 값
const TOPICS: [string, string][] = [
  ["daily_life", "일상"], ["home_neighborhood", "집 · 동네"], ["school", "학교"], ["work", "회사"],
  ["cafes", "카페"], ["food", "음식"], ["movies", "영화"], ["music", "음악"], ["exercise", "운동"],
  ["park", "공원"], ["shopping", "쇼핑"], ["travel", "여행"], ["transportation", "교통"],
  ["weather", "날씨"], ["vacation", "휴가"], ["family_friends", "가족 · 친구"],
];
// 설문 항목 → 단어장 주제
const FROM_SURVEY: Record<string, string> = {
  movies: "movies", music: "music", cafes: "cafes", shopping: "shopping", cooking: "food", food_travel: "food",
  jogging: "exercise", gym: "exercise", swimming: "exercise", cycling: "exercise", soccer: "exercise", yoga: "exercise",
  hiking: "park", domestic_travel: "travel", overseas_travel: "travel", beach_travel: "travel", mountain_travel: "travel",
  camping: "travel", staycation: "vacation", student: "school", office_worker: "work", family: "family_friends",
};
const TARGET: OPIcLevel[] = ["IL", "IL", "IM1", "IM1", "IM2", "IH", "AL"];
const TYPE_LABEL = { word: "단어", phrase: "표현", pattern: "패턴" } as const;

function load<T>(k: string, fallback: T): T {
  try {
    return (JSON.parse(localStorage.getItem(k) ?? "null") as T) ?? fallback;
  } catch {
    return fallback;
  }
}
function save(k: string, v: unknown) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* noop */
  }
}

/** 단어장: 내 설문 주제로 오늘의 표현을 받고(토큰 1), 외운 표현을 모아 둔다. 표현으로 말해 보면 AI가 쓰임을 봐 준다(토큰 1). */
export function Vocabulary({ uid, prefs, onSpent }: { uid: string; prefs: StudyPrefs; onSpent: () => void }) {
  const s = prefs.survey;
  const fromSurvey = [...s.leisure, ...s.hobbies, ...s.sports, ...s.travel, s.status, s.residence].map((id) => FROM_SURVEY[id]).find(Boolean);
  const [topic, setTopic] = useState(fromSurvey ?? "daily_life");
  const targetLevel = TARGET[prefs.initialLevel] ?? "IM2";
  const setKey = `dailyopic:vocab:${uid}:${kstDay()}:${topic}`;
  const learnedKey = `dailyopic:vocab-learned:${uid}`;
  const [set, setSet] = useState<VocabSet | null>(() => load(setKey, null));
  const [learned, setLearned] = useState<Record<string, string>>(() => load(learnedKey, {}));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"today" | "saved">("today");

  const pickTopic = (t: string) => {
    setTopic(t);
    setSet(load(`dailyopic:vocab:${uid}:${kstDay()}:${t}`, null));
    setError(null);
  };

  const generate = async () => {
    if (!window.confirm("데일리 토큰 1개를 써서 오늘의 표현을 받을까요?")) return;
    setBusy(true);
    setError(null);
    try {
      const r = await api.vocabToday({ topic, targetLevel, excludeTerms: Object.keys(learned).slice(-200) }, crypto.randomUUID());
      setSet(r);
      save(setKey, r);
      play("start");
    } catch (e) {
      const err = e as ApiError;
      setError(err.isQuotaExhausted ? "오늘의 데일리 토큰을 모두 썼어요. 자정에 다시 채워져요." : err.message);
    } finally {
      setBusy(false);
      onSpent();
    }
  };

  const toggleLearned = (e: VocabEntry) => {
    const next = { ...learned };
    if (next[e.term]) delete next[e.term];
    else next[e.term] = e.meaningKo;
    setLearned(next);
    save(learnedKey, next);
    play(next[e.term] ? "coin" : "tap", { volume: 0.5 });
  };

  const savedList = Object.entries(learned).reverse();

  return (
    <div className="mode-page vocab-page">
      <div className="mode-hero">
        <Icon name="book" size={56} />
        <div>
          <h1>단어장</h1>
          <p>내 설문 주제로 OPIc 답변에 바로 쓰는 표현을 모아요.</p>
        </div>
      </div>

      <div className="seg" role="tablist">
        <button role="tab" aria-selected={tab === "today"} className={tab === "today" ? "on" : undefined} onClick={() => setTab("today")}>
          오늘의 표현
        </button>
        <button role="tab" aria-selected={tab === "saved"} className={tab === "saved" ? "on" : undefined} onClick={() => setTab("saved")}>
          외운 표현 {savedList.length > 0 && <em>{savedList.length}</em>}
        </button>
      </div>

      {tab === "saved" ? (
        savedList.length ? (
          <ul className="saved-words">
            {savedList.map(([term, meaning]) => (
              <li key={term}>
                <button className="speak-btn small" onClick={() => speak(term)} aria-label={`${term} 듣기`}>
                  <Icon name="speaker" size={20} />
                </button>
                <b>{term}</b>
                <span>{meaning}</span>
              </li>
            ))}
          </ul>
        ) : (
          <section className="detail-card empty-card">
            <p>오늘의 표현에서 ‘외웠어요’를 누르면 여기에 모여요.</p>
          </section>
        )
      ) : (
        <>
          <label className="topic-select">
            <span>주제</span>
            <select value={topic} onChange={(e) => pickTopic(e.target.value)}>
              {TOPICS.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          {!set ? (
            <section className="detail-card empty-card">
              <p>
                <b>{TOPICS.find((t) => t[0] === topic)?.[1]}</b> 주제로 {targetLevel} 수준 표현을 만들어 드려요.
              </p>
              <button className="btn btn-primary" disabled={busy} onClick={() => void generate()}>
                {busy ? "만드는 중…" : "오늘의 표현 받기 (토큰 1)"}
              </button>
            </section>
          ) : (
            <ul className="word-cards">
              {set.entries.map((e) => (
                <WordCard key={e.id} entry={e} topic={topic} targetLevel={targetLevel} learned={Boolean(learned[e.term])} onLearned={() => toggleLearned(e)} onSpent={onSpent} />
              ))}
            </ul>
          )}
          {error && <p className="lesson-error">{error}</p>}
        </>
      )}

      <Link to="/study/words" className="detail-card vocab-games">
        <Icon name="keyboard" size={32} />
        <span>
          <b>단어 게임으로 복습하기</b>
          <small>타자 · 빈칸 · 듣기 게임</small>
        </span>
      </Link>
    </div>
  );
}

function WordCard(props: { entry: VocabEntry; topic: string; targetLevel: OPIcLevel; learned: boolean; onLearned: () => void; onSpent: () => void }) {
  const { entry: e } = props;
  const recorder = useAnswerRecorder();
  const [phase, setPhase] = useState<"idle" | "recording" | "coaching">("idle");
  const [coach, setCoach] = useState<VocabCoach | null>(null);
  const [error, setError] = useState<string | null>(null);

  const practice = async () => {
    if (phase === "idle") {
      setError(null);
      setCoach(null);
      await recorder.start();
      play("rec_start");
      return setPhase("recording");
    }
    const r = await recorder.stop();
    play("rec_stop");
    if (!r.transcript) {
      setPhase("idle");
      return setError("말한 내용을 알아듣지 못했어요. 다시 말해 주세요.");
    }
    setPhase("coaching");
    try {
      setCoach(
        await api.vocabCoach(
          { entryId: e.id, term: e.term, type: e.type, transcript: r.transcript, meaningKo: e.meaningKo, topic: props.topic, targetLevel: props.targetLevel },
          crypto.randomUUID(),
        ),
      );
      play("correct");
    } catch (err) {
      const x = err as ApiError;
      setError(x.isQuotaExhausted ? "오늘의 데일리 토큰을 모두 썼어요." : x.message);
    } finally {
      setPhase("idle");
      props.onSpent();
    }
  };

  return (
    <li className={`word-card${props.learned ? " learned" : ""}`}>
      <div className="word-head">
        <span className="word-type">{TYPE_LABEL[e.type]}</span>
        <b>{e.term}</b>
        <button className="speak-btn small" onClick={() => speak(e.term)} aria-label={`${e.term} 듣기`}>
          <Icon name="speaker" size={20} />
        </button>
      </div>
      <p className="word-meaning">{e.meaningKo}</p>
      <p className="answer-en">{e.exampleEn}</p>
      <p className="word-ko">{e.exampleKo}</p>
      {phase === "recording" && recorder.liveText && <div className="transcript-card live">{recorder.liveText}</div>}
      {coach && (
        <div className="coach-card">
          <p>{coach.usageFeedbackKo}</p>
          {coach.naturalCorrectionEn && <p className="answer-en">{coach.naturalCorrectionEn}</p>}
        </div>
      )}
      {(error || recorder.error) && <p className="lesson-error">{error ?? recorder.error}</p>}
      <div className="word-actions">
        <button className={`btn ${phase === "recording" ? "btn-danger" : "btn-secondary"}`} disabled={!speechSupported || phase === "coaching"} onClick={() => void practice()}>
          <Icon name="mic" size={18} /> {phase === "recording" ? "다 말했어요" : phase === "coaching" ? "보는 중…" : "이 표현으로 말하기"}
        </button>
        <button className={`btn ${props.learned ? "btn-primary" : "btn-ghost"}`} aria-pressed={props.learned} onClick={props.onLearned}>
          <Icon name="check" size={18} /> 외웠어요
        </button>
      </div>
    </li>
  );
}
