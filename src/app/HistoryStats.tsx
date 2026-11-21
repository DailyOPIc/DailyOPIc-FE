import { Link } from "react-router-dom";
import { Icon } from "../assets/Icon";
import type { GameState } from "../lib/game";
import { activeDays, areaAverages, AREAS, LEVEL_ORDER, levelTrend, loadHistory } from "../lib/history";

/** 학습 기록 · 통계: AI 분석과 모의고사 결과를 모아 등급 흐름 · 영역 평균 · 최근 기록을 보여 준다. */
export function HistoryStats({ uid, game }: { uid: string; game: GameState }) {
  const list = loadHistory(uid);
  const stats = areaAverages(list);
  const trend = levelTrend(list);
  const mocks = list.filter((e) => e.kind === "mock").length;

  return (
    <div className="mode-page stats-page">
      <div className="mode-hero">
        <Icon name="compare" size={56} />
        <div>
          <h1>학습 기록</h1>
          <p>AI 분석과 모의고사 결과가 여기에 쌓여요.</p>
        </div>
      </div>

      <div className="stat-grid">
        <Stat label="분석한 답변" value={list.length - mocks} />
        <Stat label="모의고사" value={mocks} />
        <Stat label="학습한 날" value={activeDays(list).size} />
        <Stat label="최고 연속" value={`${game.bestStreak}일`} />
      </div>

      {!list.length ? (
        <section className="detail-card empty-card">
          <p>아직 기록이 없어요. 오늘의 학습에서 답변을 분석받으면 여기에 쌓여요.</p>
          <Link to="/study" className="btn btn-primary">
            오늘의 학습 하러 가기
          </Link>
        </section>
      ) : (
        <>
          <section className="detail-card">
            <h3>예상 등급 흐름</h3>
            <div className="level-trend" role="img" aria-label={`최근 예상 등급: ${trend.join(", ")}`}>
              {trend.map((lv, i) => (
                <span key={i} style={{ height: `${((LEVEL_ORDER.indexOf(lv) + 1) / LEVEL_ORDER.length) * 100}%` }}>
                  <em>{lv}</em>
                </span>
              ))}
            </div>
          </section>

          {stats && (
            <section className="detail-card">
              <h3>영역별 평균</h3>
              <ul className="area-bars">
                {AREAS.map(([k, label]) => (
                  <li key={k} className={k === stats.weakest[0] ? "weak" : undefined}>
                    <span>{label}</span>
                    <span className="area-track">
                      <span style={{ width: `${stats.avg[k]}%` }} />
                    </span>
                    <b>{stats.avg[k]}</b>
                  </li>
                ))}
              </ul>
              <p className="detail-hint">
                가장 먼저 올릴 영역: <b>{stats.weakest[1]}</b>
              </p>
            </section>
          )}

          <section className="detail-card">
            <h3>최근 기록</h3>
            <ul className="history-list">
              {[...list].reverse().slice(0, 20).map((e) => (
                <li key={e.at}>
                  <span className={`history-kind ${e.kind}`}>{e.kind === "mock" ? "모의고사" : "답변"}</span>
                  <span className="history-prompt">{e.prompt ?? "AI 분석"}</span>
                  <b>{e.level}</b>
                  <time>{e.day.slice(5).replace("-", ".")}</time>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
      <p className="detail-hint">기록은 이 브라우저에 저장돼요.</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="stat-box">
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}
