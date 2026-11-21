// 학습 게임 요소(XP · 연속 학습 · 일일 목표). 아직 서버에 없어서 이 브라우저에만 저장한다.
// ponytail: 기기 로컬 저장 — 웹 · 앱 동기화가 필요해지면 서버(userProfiles)로 옮긴다.

export const XP = { aiAnswer: 10, practice: 5, wordCorrect: 1 } as const;
export const DAILY_GOAL = 3; // 하루 목표: 학습 활동 3번(말하기 연습 · AI 분석 · 단어 게임 한 판)

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

export type Recorded = { state: GameState; gained: number; goalJustReached: boolean; streakUp: boolean };

/** 학습 활동 한 번을 기록한다. xp만큼 경험치, 활동 1회(오늘 목표 · 연속 학습에 반영). */
export function recordActivity(uid: string, xp: number): Recorded {
  const before = loadGame(uid);
  const today = before.today;
  const streakUp = before.lastDay !== today;
  const streak = streakUp ? (before.lastDay === prevDay(today) ? before.streak + 1 : 1) : before.streak;
  const state: GameState = {
    ...before,
    xp: before.xp + xp,
    streak,
    bestStreak: Math.max(before.bestStreak, streak),
    lastDay: today,
    todayCount: before.todayCount + 1,
  };
  try {
    localStorage.setItem(key(uid), JSON.stringify(state));
    const log = loadActivity(uid);
    log[today] = (log[today] ?? 0) + 1;
    localStorage.setItem(activityKey(uid), JSON.stringify(log));
  } catch {
    /* noop */
  }
  return {
    state,
    gained: xp,
    goalJustReached: before.todayCount < DAILY_GOAL && state.todayCount >= DAILY_GOAL,
    streakUp,
  };
}

const activityKey = (uid: string) => `dailyopic:activity:${uid}`;

/** 날짜(KST)별 학습 활동 횟수. 활동 잔디(GitHub 스트릭 같은 달력)가 읽는다. */
export function loadActivity(uid: string): Record<string, number> {
  try {
    return (JSON.parse(localStorage.getItem(activityKey(uid)) ?? "{}") as Record<string, number>) ?? {};
  } catch {
    return {};
  }
}

/** 오늘(KST)까지 weeks주를 월요일 시작 열로 채운 날짜 목록(앞쪽은 null로 맞춤) */
export function heatmapDays(today: string, weeks: number): (string | null)[] {
  const t = Date.parse(`${today}T00:00:00Z`);
  const dow = (new Date(t).getUTCDay() + 6) % 7; // 월=0
  const start = t - (dow + (weeks - 1) * 7) * 86_400_000;
  return Array.from({ length: weeks * 7 }, (_, i) => {
    const d = start + i * 86_400_000;
    return d > t ? null : new Date(d).toISOString().slice(0, 10);
  });
}

// 자체 점검: node -e 로 돌릴 수 있도록 순수 함수만 썼다.
export function _selfCheck() {
  console.assert(prevDay("2026-03-01") === "2026-02-28", "prevDay month boundary");
  console.assert(kstDay(new Date("2026-11-14T15:30:00Z")) === "2026-11-15", "KST rolls over at 15:00 UTC");
  const days = heatmapDays("2026-11-21", 2); // 토요일
  console.assert(days.length === 14 && days[0] === "2026-11-09" && days[12] === "2026-11-21" && days[13] === null, "heatmap grid");
}
