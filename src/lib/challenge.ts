// 기록 대결: 같은 시드(seed) = 같은 문제 · 같은 순서. 도전장은 링크 하나에 담는다.
// ponytail: 서버 없이 링크에 점수를 담는 1:1 대결 — 링크를 조작하면 점수를 속일 수 있다.
//           공개 랭킹이 필요해지면 점수 제출 API(서버 검증)로 옮긴다.

export type GameMode = "typing" | "meaning" | "dictation" | "rain" | "build" | "fill" | "speed";

export type Challenge = {
  v: 1;
  m: GameMode; // 게임
  s: number; // 시드
  sc: number; // 도전자 점수
  c: number; // 맞힌 수
  t: number; // 전체 문항
  n: string; // 닉네임(실명 아님, 공유할 때 직접 정함)
};

/** 시드가 같으면 늘 같은 수열 */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const newSeed = () => Math.floor(Math.random() * 2 ** 31);

/** 오늘의 챌린지: 한국 날짜가 같으면 모두 같은 시드 */
export function todaySeed(now = new Date()) {
  const day = new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
  let h = 2166136261;
  for (const ch of day) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

const b64url = {
  enc: (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
  dec: (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0))),
};

const MODES: GameMode[] = ["typing", "meaning", "dictation", "rain", "build", "fill", "speed"];

export function encodeChallenge(c: Omit<Challenge, "v">): string {
  return b64url.enc(JSON.stringify({ v: 1, ...c, n: c.n.slice(0, 12) }));
}

/** 받은 링크를 믿지 않는다: 형식이 틀리면 null */
export function decodeChallenge(token: string | null): Challenge | null {
  if (!token || token.length > 400) return null;
  try {
    const c = JSON.parse(b64url.dec(token)) as Challenge;
    const okNum = (x: unknown, max: number) => typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= max;
    if (c.v !== 1 || !MODES.includes(c.m) || !okNum(c.s, 2 ** 32) || !okNum(c.sc, 1e6) || !okNum(c.c, 100) || !okNum(c.t, 100)) return null;
    return { ...c, n: String(c.n ?? "").replace(/[<>]/g, "").slice(0, 12) || "도전자" };
  } catch {
    return null;
  }
}

export function challengeUrl(c: Omit<Challenge, "v">) {
  return `${window.location.origin}/study/words?vs=${encodeChallenge(c)}`;
}

// 자체 점검(esbuild로 묶어 node에서 실행)
export function _selfCheck() {
  const a = rng(42);
  const b = rng(42);
  console.assert([a(), a(), a()].join() === [b(), b(), b()].join(), "same seed same sequence");
  console.assert(seededShuffle([1, 2, 3, 4, 5], rng(7)).join() === seededShuffle([1, 2, 3, 4, 5], rng(7)).join(), "seeded shuffle stable");
  const token = encodeChallenge({ m: "speed", s: 123, sc: 900, c: 9, t: 10, n: "데일리<b>" });
  const back = decodeChallenge(token);
  console.assert(back?.m === "speed" && back.sc === 900 && back.n === "데일리b", "roundtrip + sanitize");
  console.assert(decodeChallenge("garbage") === null, "rejects garbage");
  console.assert(decodeChallenge(encodeChallenge({ m: "speed", s: 1, sc: 9e9, c: 1, t: 1, n: "x" })) === null, "rejects absurd score");
  console.assert(todaySeed(new Date("2026-11-14T14:00:00Z")) !== todaySeed(new Date("2026-11-14T16:00:00Z")), "KST day boundary");
}
