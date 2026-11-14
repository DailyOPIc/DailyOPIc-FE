import { Link } from "react-router-dom";
import type { Evaluation } from "../lib/api";

const AREA: [keyof Evaluation["scores"], string][] = [
  ["taskFulfillment", "과제 충족"],
  ["grammar", "문법"],
  ["vocabulary", "어휘"],
  ["discourse", "담화 구성"],
  ["fluency", "유창성"],
];

/** 오픽미식 진단: 영역별 점수 → 잘한 점 → 감점 요인(개선할 점) → 교정 · 모범 답안 */
export function ResultDetail({ evaluation: e, plan }: { evaluation: Evaluation; plan: string }) {
  const weakest = [...AREA].sort((a, b) => e.scores[a[0]] - e.scores[b[0]])[0];
  return (
    <div className="detail">
      {e.warnings.length > 0 && <p className="detail-warning">{e.warnings[0]}</p>}

      <section className="detail-card">
        <h3>영역별 진단</h3>
        <ul className="area-bars">
          {AREA.map(([k, label], n) => (
            <li key={k} className={k === weakest[0] ? "weak" : undefined} style={{ animationDelay: `${n * 80}ms` }}>
              <span>{label}</span>
              <span className="area-track">
                <span style={{ width: `${e.scores[k]}%` }} />
              </span>
              <b>{e.scores[k]}</b>
            </li>
          ))}
        </ul>
        <p className="detail-hint">
          가장 먼저 올릴 영역: <b>{weakest[1]}</b>
        </p>
      </section>

      <section className="detail-card good">
        <h3>👍 잘한 점</h3>
        <ul>
          {e.strengths.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>
      <section className="detail-card fix">
        <h3>🎯 감점 요인 · 개선할 점</h3>
        <ul>
          {e.improvements.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      {e.targetGap && (
        <section className="detail-card">
          <h3>목표 등급까지</h3>
          <p>{e.targetGap}</p>
        </section>
      )}
      {e.correctedAnswer && (
        <section className="detail-card">
          <h3>✏️ 교정 답안</h3>
          <p className="answer-en">{e.correctedAnswer}</p>
        </section>
      )}
      {e.sampleAnswer && (
        <section className="detail-card">
          <h3>⭐ 모범 답안</h3>
          <p className="answer-en">{e.sampleAnswer}</p>
        </section>
      )}
      {plan === "free" && !e.correctedAnswer && (
        <section className="detail-card locked">
          <h3>🔒 교정 답안 · 모범 답안 · 목표 등급까지</h3>
          <p>베이직 플랜부터 결과 전체를 볼 수 있어요.</p>
          <Link to="/membership" className="btn btn-secondary">
            요금제 보기
          </Link>
        </section>
      )}
      <p className="detail-disclaimer">{e.disclaimer}</p>
    </div>
  );
}
