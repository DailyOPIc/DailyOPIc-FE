import { useState } from "react";
import { LEVELS, SURVEY, TOPIC_GROUPS, type StudyPrefs } from "../lib/prefs";
import { sfx } from "../lib/sfx";

type Topics = Record<"leisure" | "hobbies" | "sports" | "travel", string[]>;

/** 게임식 시작 설정: 상단 진행 바 · 말풍선 질문 · 큰 선택 카드 · 하단 계속 바 */
export function Onboarding({ initial, onDone, onCancel }: { initial?: StudyPrefs | null; onDone: (p: StudyPrefs) => void; onCancel?: () => void }) {
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<number | null>(initial?.initialLevel ?? null);
  const [status, setStatus] = useState(initial?.survey.status ?? "");
  const [residence, setResidence] = useState(initial?.survey.residence ?? "");
  const [topics, setTopics] = useState<Topics>(
    initial
      ? { leisure: initial.survey.leisure, hobbies: initial.survey.hobbies, sports: initial.survey.sports, travel: initial.survey.travel }
      : { leisure: [], hobbies: [], sports: [], travel: [] },
  );
  const count = Object.values(topics).flat().length;

  const steps = [
    { ask: "지금 말하기 실력은 어느 정도인가요?", ok: level !== null },
    { ask: "지금 어떤 상황인가요?", ok: Boolean(status && residence) },
    { ask: "평소 좋아하는 걸 3개 이상 골라 주세요", ok: count >= 3 },
  ];

  const toggle = (group: keyof Topics, id: string) => {
    sfx.tap();
    setTopics((t) => {
      const list = t[group];
      if (list.includes(id)) return { ...t, [group]: list.filter((x) => x !== id) };
      if (list.length >= 6) return t;
      return { ...t, [group]: [...list, id] };
    });
  };

  const next = () => {
    sfx.tap();
    if (step < steps.length - 1) setStep(step + 1);
    else onDone({ initialLevel: level!, survey: { status, residence, ...topics } });
  };

  return (
    <div className="lesson onboarding">
      <header className="lesson-top">
        <button
          className="lesson-close"
          onClick={() => (step > 0 ? setStep(step - 1) : onCancel?.())}
          aria-label={step > 0 ? "이전 단계" : "닫기"}
          disabled={step === 0 && !onCancel}
        >
          {step > 0 ? "←" : "✕"}
        </button>
        <div className="lesson-progress">
          <span style={{ transform: `scaleX(${(step + 1) / steps.length})` }} />
        </div>
        <span className="lesson-count">
          {step + 1}
          <small>/{steps.length}</small>
        </span>
      </header>

      <main className="lesson-body">
        <div className="buddy-row" key={step}>
          <img src="/images/logo-mark.png" alt="" width={64} height={64} className="buddy" />
          <p className="buddy-bubble">{steps[step].ask}</p>
        </div>

        {step === 0 && (
          <div className="pick-grid">
            {LEVELS.map((l) => (
              <button
                key={l.value}
                className={`pick${level === l.value ? " on" : ""}`}
                onClick={() => {
                  sfx.tap();
                  setLevel(l.value);
                }}
              >
                <span className="pick-step">{l.value}단계</span>
                <strong>예상 {l.range}</strong>
                <span>{l.desc}</span>
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <>
            <h2 className="pick-title">현재 상태</h2>
            <div className="chips">
              {SURVEY.status.map((o) => (
                <button
                  key={o.id}
                  className={`pill${status === o.id ? " on" : ""}`}
                  onClick={() => {
                    sfx.tap();
                    setStatus(o.id);
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <h2 className="pick-title">사는 곳</h2>
            <div className="chips">
              {SURVEY.residence.map((o) => (
                <button
                  key={o.id}
                  className={`pill${residence === o.id ? " on" : ""}`}
                  onClick={() => {
                    sfx.tap();
                    setResidence(o.id);
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 &&
          TOPIC_GROUPS.map((g) => (
            <div key={g.key}>
              <h2 className="pick-title">{g.label}</h2>
              <div className="chips">
                {SURVEY.topics[g.key].map((o) => {
                  const on = topics[g.key].includes(o.id);
                  return (
                    <button key={o.id} className={`pill${on ? " on" : ""}`} aria-pressed={on} onClick={() => toggle(g.key, o.id)}>
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
      </main>

      <footer className="lesson-bar">
        <span className="bar-note">{step === 2 ? `${count}개 선택됨` : ""}</span>
        <button className="btn btn-primary" disabled={!steps[step].ok} onClick={next}>
          {step === steps.length - 1 ? "오늘의 문제 받기" : "계속"}
        </button>
      </footer>
    </div>
  );
}
