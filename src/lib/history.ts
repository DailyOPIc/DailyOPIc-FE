import type { Evaluation, OPIcLevel } from "./api";
import { kstDay } from "./game";

// 학습 기록(AI 분석 · 모의고사 결과). 통계 · 플래너 달력이 이걸 읽는다.
// ponytail: 이 브라우저에만 저장 — 기기 간 동기화가 필요해지면 서버 기록 API로 옮긴다.

export type Scores = Evaluation["scores"];
export type HistoryEntry = {
  kind: "practice" | "mock";
  at: number;
  day: string; // KST
  level: OPIcLevel;
  scores: Scores;
  prompt?: string;
};

export const LEVEL_ORDER: OPIcLevel[] = ["NL", "NM", "NH", "IL", "IM1", "IM2", "IM3", "IH", "AL"];
export const AREAS: [keyof Scores, string][] = [
  ["taskFulfillment", "과제 충족"],
  ["grammar", "문법"],
  ["vocabulary", "어휘"],
  ["discourse", "담화 구성"],
  ["fluency", "유창성"],
];
const MAX = 300;
const key = (uid: string) => `dailyopic:history:${uid}`;

export function loadHistory(uid: string): HistoryEntry[] {
  try {
    return (JSON.parse(localStorage.getItem(key(uid)) ?? "[]") as HistoryEntry[]) ?? [];
  } catch {
    return [];
  }
}

export function addHistory(uid: string, e: Omit<HistoryEntry, "at" | "day">) {
  const now = new Date();
  const list = [...loadHistory(uid), { ...e, at: now.getTime(), day: kstDay(now) }].slice(-MAX);
  try {
    localStorage.setItem(key(uid), JSON.stringify(list));
  } catch {
    /* 저장이 막힌 브라우저 */
  }
}

/** 영역별 평균(기록 없으면 null)과 가장 약한 영역 */
export function areaAverages(list: HistoryEntry[]) {
  if (!list.length) return null;
  const avg = Object.fromEntries(
    AREAS.map(([k]) => [k, Math.round(list.reduce((s, e) => s + e.scores[k], 0) / list.length)]),
  ) as Scores;
  const weakest = [...AREAS].sort((a, b) => avg[a[0]] - avg[b[0]])[0];
  return { avg, weakest };
}

/** 최근 n개의 예상 등급(오래된 것부터) */
export const levelTrend = (list: HistoryEntry[], n = 12) => list.slice(-n).map((e) => e.level);

export const activeDays = (list: HistoryEntry[]) => new Set(list.map((e) => e.day));

export function _selfCheck() {
  const s: Scores = { taskFulfillment: 80, grammar: 40, vocabulary: 60, discourse: 70, fluency: 90 };
  const list: HistoryEntry[] = [
    { kind: "practice", at: 1, day: "2026-11-20", level: "IM1", scores: s },
    { kind: "mock", at: 2, day: "2026-11-21", level: "IM2", scores: { ...s, grammar: 60 } },
  ];
  const r = areaAverages(list);
  console.assert(r?.avg.grammar === 50 && r.weakest[0] === "grammar", "average + weakest");
  console.assert(areaAverages([]) === null, "empty");
  console.assert(levelTrend(list).join() === "IM1,IM2", "trend order");
  console.assert(activeDays(list).size === 2, "days");
}
