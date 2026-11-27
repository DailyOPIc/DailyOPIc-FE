// 레벨 · XP · 스트릭은 서버(/v1/me/profile)가 기준이다. 화면은 활동 뒤 프로필을 다시 읽어
// 이전 값과 비교해 "+XP · 연속 · 목표 · 레벨업"을 보여 준다.
import { api, type Profile } from "./api";
import { DAILY_GOAL, kstDay, type GameState, type Recorded } from "./game";

export type Gain = Recorded & { leveledUp: boolean; level: number };

export const LEVEL_UP_EVENT = "dailyopic:levelup";

export function toGameState(p: Profile): GameState {
  return { xp: p.progress.xp, streak: p.streak, bestStreak: p.bestStreak, lastDay: null, today: kstDay(), todayCount: p.todayCount };
}

export function diffProfiles(before: Profile | null, after: Profile): Gain {
  const goal = after.dailyGoal || DAILY_GOAL;
  const gain: Gain = {
    state: toGameState(after),
    gained: Math.max(0, after.progress.xp - (before?.progress.xp ?? after.progress.xp)),
    goalJustReached: (before?.todayCount ?? 0) < goal && after.todayCount >= goal,
    streakUp: after.streak > (before?.streak ?? after.streak),
    leveledUp: after.progress.level > (before?.progress.level ?? after.progress.level),
    level: after.progress.level,
  };
  if (gain.leveledUp) window.dispatchEvent(new CustomEvent(LEVEL_UP_EVENT, { detail: gain.level }));
  return gain;
}

/** 브라우저에만 있던 예전 XP · 스트릭을 서버로 한 번 옮긴다(서버가 상한 · 1회를 지킨다). */
export async function importLegacyOnce(uid: string): Promise<Profile | null> {
  const flag = `dailyopic:game-imported:${uid}`;
  try {
    if (localStorage.getItem(flag)) return null;
    const raw = localStorage.getItem(`dailyopic:game:${uid}`);
    localStorage.setItem(flag, "1");
    if (!raw) return null;
    const g = JSON.parse(raw) as Partial<GameState>;
    if (!g.xp && !g.streak) return null;
    return await api.importProgress({
      xp: Math.floor(g.xp ?? 0),
      streak: g.streak ?? 0,
      bestStreak: g.bestStreak ?? 0,
      lastDay: g.lastDay ? g.lastDay.replaceAll("-", "") : null,
    });
  } catch {
    return null;
  }
}
