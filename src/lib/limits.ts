// 무료 일일 한도. 매일 자정(한국 시간)에 다시 채워지고, 유료 플랜(베이직 이상)은 무제한.
// AI 분석 · 새 세트는 서버의 데일리 토큰이 따로 막는다(여기는 토큰 없는 무료 놀이만).
// ponytail: 기기 로컬 카운트 — 기기를 바꾸거나 저장소를 지우면 우회된다.
//           악용이 보이면 서버(dailyUsage)에 같은 카운트를 두고 응답으로 강제한다.

import { kstDay } from "./game";

export type LimitKind = "speak" | "games";

/** 무료 하루 한도(한곳에서만 바꾼다) */
export const FREE_DAILY: Record<LimitKind, number> = {
  speak: 5, // 랜덤 스피킹 문제 수
  games: 5, // 단어 게임 판 수(오늘의 챌린지 포함, 받은 도전장 수락은 제외)
};

export const LIMIT_LABEL: Record<LimitKind, string> = { speak: "랜덤 스피킹", games: "단어 게임" };

const isPaid = (plan: string) => plan !== "free";
const key = (uid: string, day: string) => `dailyopic:limits:${uid}:${day}`;

function read(uid: string, day = kstDay()): Record<LimitKind, number> {
  try {
    return { speak: 0, games: 0, ...JSON.parse(localStorage.getItem(key(uid, day)) ?? "{}") };
  } catch {
    return { speak: 0, games: 0 };
  }
}

export function used(uid: string, kind: LimitKind): number {
  return read(uid)[kind];
}

/** 남은 횟수. 유료는 Infinity */
export function remaining(uid: string, plan: string, kind: LimitKind): number {
  if (isPaid(plan)) return Infinity;
  return Math.max(0, FREE_DAILY[kind] - used(uid, kind));
}

/** 한 번 쓴다. 남은 게 없으면 false(시작하지 않는다). */
export function consume(uid: string, plan: string, kind: LimitKind): boolean {
  if (isPaid(plan)) return true;
  const day = kstDay();
  const now = read(uid, day);
  if (now[kind] >= FREE_DAILY[kind]) return false;
  now[kind] += 1;
  try {
    localStorage.setItem(key(uid, day), JSON.stringify(now));
    // 어제 기록은 지운다(저장소가 쌓이지 않게)
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith(`dailyopic:limits:${uid}:`) && !k.endsWith(day)) localStorage.removeItem(k);
    }
  } catch {
    /* 저장이 막힌 브라우저는 이번 세션만 */
  }
  return true;
}

/** 다음 초기화(한국 자정)까지 남은 밀리초 */
export function msUntilReset(now = Date.now()): number {
  const kstNow = now + 9 * 3600_000;
  const nextKstMidnight = Math.floor(kstNow / 86_400_000 + 1) * 86_400_000;
  return nextKstMidnight - kstNow;
}

// 자체 점검: esbuild로 묶어 node에서 실행(localStorage 흉내)
export function _selfCheck() {
  const store = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
  } as Storage;
  for (let i = 0; i < FREE_DAILY.speak; i++) console.assert(consume("u", "free", "speak"), `free use ${i + 1} allowed`);
  console.assert(!consume("u", "free", "speak"), "free limit blocks after quota");
  console.assert(remaining("u", "free", "speak") === 0, "remaining hits 0");
  console.assert(remaining("u", "free", "games") === FREE_DAILY.games, "kinds are independent");
  console.assert(consume("u", "basic", "speak") && remaining("u", "pro", "speak") === Infinity, "paid is unlimited");
  // 2026-11-14 23:30 KST = 14:30 UTC → 30분 남음
  console.assert(Math.round(msUntilReset(Date.parse("2026-11-14T14:30:00Z")) / 60000) === 30, "reset at KST midnight");
}
