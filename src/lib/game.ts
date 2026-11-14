// 학습 게임 요소(XP · 연속 학습 · 일일 목표). 아직 서버에 없어서 이 브라우저에만 저장한다.
// ponytail: 기기 로컬 저장 — 웹 · 앱 동기화가 필요해지면 서버(userProfiles)로 옮긴다.

export const XP_PER_ANSWER = 10;
export const DAILY_GOAL = 3; // 하루 목표: 답변 3개 분석

export type GameState = {
  xp: number;
  streak: number;
  bestStreak: number;
  lastDay: string | null; // 마지막으로 답변을 분석한 날(KST)
  today: string;
  todayCount: number;
};

/** 서버와 같은 기준: 한국 시간 날짜 */
export function kstDay(date = new Date()) {
  return new Date(date.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
}

function prevDay(day: string) {
  return new Date(Date.parse(`${day}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
}

const key = (uid: string) => `dailyopic:game:${uid}`;

export function loadGame(uid: string): GameState {
  const today = kstDay();
  let s: GameState = { xp: 0, streak: 0, bestStreak: 0, lastDay: null, today, todayCount: 0 };
  try {
    const raw = localStorage.getItem(key(uid));
    if (raw) s = { ...s, ...(JSON.parse(raw) as GameState) };
  } catch {
    /* 저장이 막힌 브라우저 */
  }
  if (s.today !== today) s = { ...s, today, todayCount: 0 };
  // 어제도 오늘도 안 했으면 연속 기록은 끊긴 것
  if (s.lastDay && s.lastDay !== today && s.lastDay !== prevDay(today)) s = { ...s, streak: 0 };
  return s;
}

export function recordAnswer(uid: string): { state: GameState; gained: number; goalJustReached: boolean; streakUp: boolean } {
  const before = loadGame(uid);
  const today = before.today;
  const streakUp = before.lastDay !== today;
  const streak = streakUp ? (before.lastDay === prevDay(today) ? before.streak + 1 : 1) : before.streak;
  const state: GameState = {
    ...before,
    xp: before.xp + XP_PER_ANSWER,
    streak,
    bestStreak: Math.max(before.bestStreak, streak),
    lastDay: today,
    todayCount: before.todayCount + 1,
  };
  try {
    localStorage.setItem(key(uid), JSON.stringify(state));
  } catch {
    /* noop */
  }
  return {
    state,
    gained: XP_PER_ANSWER,
    goalJustReached: before.todayCount < DAILY_GOAL && state.todayCount >= DAILY_GOAL,
    streakUp,
  };
}

// 자체 점검: node -e 로 돌릴 수 있도록 순수 함수만 썼다.
export function _selfCheck() {
  console.assert(prevDay("2026-03-01") === "2026-02-28", "prevDay month boundary");
  console.assert(kstDay(new Date("2026-11-14T15:30:00Z")) === "2026-11-15", "KST rolls over at 15:00 UTC");
}
