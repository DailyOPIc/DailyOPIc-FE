import { useEffect, useState } from "react";
import { Icon } from "../assets/Icon";
import { api, type ApiError, type StudyPlan } from "../lib/api";
import { kstDay } from "../lib/game";
import { activeDays, loadHistory } from "../lib/history";
import { play } from "../lib/sfx";

const WEEK = ["월", "화", "수", "목", "금", "토", "일"]; // 서버: 1=월 … 7=일
const INTENSITY: { id: StudyPlan["intensity"]; label: string; desc: string }[] = [
  { id: "light", label: "가볍게", desc: "하루 10분" },
  { id: "steady", label: "꾸준히", desc: "하루 20분" },
  { id: "focused", label: "집중", desc: "하루 40분" },
];
const DEFAULT: StudyPlan = {
  examDate: null,
  studyWeekdays: [1, 2, 3, 4, 5],
  intensity: "steady",
  preferredStudyTime: "21:00",
  timezoneIdentifier: "Asia/Seoul",
};

/** 학습 플래너: 시험일 D-day · 공부 요일 · 강도를 서버(앱과 같은 값)에 저장하고, 이번 달 학습한 날을 달력에 표시한다. */
export function Planner({ uid }: { uid: string }) {
  const [plan, setPlan] = useState<StudyPlan>(DEFAULT);
  const [state, setState] = useState<"loading" | "idle" | "saving" | "saved">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .studyPlan()
      .then((r) => r.studyPlan && setPlan({ ...DEFAULT, ...r.studyPlan }))
      .catch(() => {})
      .finally(() => setState("idle"));
  }, []);

  const edit = (patch: Partial<StudyPlan>) => {
    setPlan((p) => ({ ...p, ...patch }));
    setState("idle");
  };
  const toggleDay = (d: number) =>
    edit({ studyWeekdays: plan.studyWeekdays.includes(d) ? plan.studyWeekdays.filter((x) => x !== d) : [...plan.studyWeekdays, d].sort() });

  const save = async () => {
    setState("saving");
    setError(null);
    try {
      await api.saveStudyPlan({ ...plan, timezoneIdentifier: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Seoul" });
      play("correct");
      setState("saved");
    } catch (e) {
      setError((e as ApiError).message);
      setState("idle");
    }
  };

  const today = kstDay();
  const dday = plan.examDate ? Math.round((Date.parse(plan.examDate) - Date.parse(today)) / 86_400_000) : null;

  return (
    <div className="mode-page planner-page">
      <div className="mode-hero">
        <Icon name="timer" size={56} />
        <div>
          <h1>학습 플래너</h1>
          <p>시험일과 공부할 요일을 정하면 앱과 같이 맞춰져요.</p>
        </div>
      </div>

      {dday !== null && (
        <div className="dday-card">
          <span>OPIc 시험까지</span>
          <b>{dday > 0 ? `D-${dday}` : dday === 0 ? "D-DAY" : "시험 끝"}</b>
        </div>
      )}

      <Calendar uid={uid} today={today} weekdays={plan.studyWeekdays} />

      <section className="detail-card plan-form">
        <label className="plan-field">
          <span>시험일</span>
          <input type="date" value={plan.examDate ?? ""} min={today} onChange={(e) => edit({ examDate: e.target.value || null })} />
        </label>

        <div className="plan-field">
          <span>공부할 요일</span>
          <div className="day-toggles">
            {WEEK.map((w, i) => (
              <button
                key={w}
                type="button"
                className={plan.studyWeekdays.includes(i + 1) ? "on" : undefined}
                aria-pressed={plan.studyWeekdays.includes(i + 1)}
                onClick={() => toggleDay(i + 1)}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        <div className="plan-field">
          <span>강도</span>
          <div className="intensity-row">
            {INTENSITY.map((o) => (
              <button
                key={o.id}
                type="button"
                className={plan.intensity === o.id ? "on" : undefined}
                aria-pressed={plan.intensity === o.id}
                onClick={() => edit({ intensity: o.id })}
              >
                <strong>{o.label}</strong>
                <span>{o.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="plan-field">
          <span>공부 시간</span>
          <input type="time" value={plan.preferredStudyTime} onChange={(e) => edit({ preferredStudyTime: e.target.value || "21:00" })} />
        </label>

        {error && <p className="lesson-error">{error}</p>}
        <button
          className="btn btn-primary btn-block"
          disabled={state === "loading" || state === "saving" || plan.studyWeekdays.length === 0}
          onClick={() => void save()}
        >
          {state === "saving" ? "저장 중…" : state === "saved" ? "저장했어요" : "플랜 저장"}
        </button>
      </section>
    </div>
  );
}

function Calendar({ uid, today, weekdays }: { uid: string; today: string; weekdays: number[] }) {
  const done = activeDays(loadHistory(uid));
  const [y, m] = today.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7; // 월요일 시작
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  return (
    <section className="detail-card">
      <h3>
        {y}년 {m}월
      </h3>
      <div className="plan-cal">
        {WEEK.map((w) => (
          <span key={w} className="plan-cal-head">
            {w}
          </span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const day = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const cls = [done.has(day) && "is-done", day === today && "is-today", weekdays.includes((i % 7) + 1) && "is-plan"].filter(Boolean).join(" ");
          return (
            <span key={i} className={`plan-day ${cls}`}>
              {d}
            </span>
          );
        })}
      </div>
      <p className="plan-legend">
        <span className="plan-day is-done">✓</span> 학습한 날 <span className="plan-day is-plan">·</span> 공부할 요일
      </p>
    </section>
  );
}
