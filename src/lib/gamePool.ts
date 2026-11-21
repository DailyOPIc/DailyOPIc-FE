import { EXPRESSIONS, type Expression } from "../data/expressions";
import { SENTENCES, type Sentence } from "../data/sentences";
import { api } from "./api";
import { rng, seededShuffle } from "./challenge";
import { kstDay } from "./game";

// 오픽게임 문제: 서버가 매일 AI로 만든 5세트(모든 사용자 공용)를 판마다 돌려 쓴다.
// 세트를 못 받으면(오프라인 · 서버 오류) 기본 문제(data/)로 그대로 논다.
// 친구 도전장 · 오늘의 챌린지는 모두 같은 문제여야 해서 기본 문제만 쓴다(setActiveGameSet(null)).

export type GameSet = { expressions: Expression[]; sentences: Sentence[] };

let active: GameSet | null = null;
let freshEn = new Set<string>();

export function setActiveGameSet(set: GameSet | null) {
  active = set;
  freshEn = new Set(set ? [...set.expressions, ...set.sentences].map((x) => x.en) : []);
}

const merge = <T extends { en: string }>(fresh: T[], base: T[]) => {
  const seen = new Set(fresh.map((f) => f.en));
  return [...fresh, ...base.filter((b) => !seen.has(b.en))];
};

/** 이번 판에서 쓸 수 있는 표현 · 문장(오늘 세트 + 기본 문제) */
export const gameExpressions = () => merge(active?.expressions ?? [], EXPRESSIONS);
export const gameSentences = () => merge(active?.sentences ?? [], SENTENCES);

/** 오늘 세트 문제를 먼저(섞어서), 모자라면 기본 문제(섞어서)로 채운 순서 */
export function freshFirst<T extends { en: string }>(list: T[], seed: number): T[] {
  return [
    ...seededShuffle(list.filter((x) => freshEn.has(x.en)), rng(seed)),
    ...seededShuffle(list.filter((x) => !freshEn.has(x.en)), rng(seed + 1)),
  ];
}

const cacheKey = (day: string) => `dailyopic:gamesets:${day}`;
const NEXT_KEY = "dailyopic:gameset-next";

/** 오늘 세트를 받아 둔다(하루 한 번 서버에서, 그다음은 이 기기 캐시). 실패하면 null */
export async function loadGameSets(): Promise<GameSet[] | null> {
  const day = kstDay();
  try {
    const cached = localStorage.getItem(cacheKey(day));
    if (cached) return JSON.parse(cached) as GameSet[];
  } catch {
    /* 캐시 없이 진행 */
  }
  try {
    const { sets } = await api.gameSets();
    if (!sets?.length) return null;
    try {
      localStorage.setItem(cacheKey(day), JSON.stringify(sets));
    } catch {
      /* noop */
    }
    return sets;
  } catch {
    return null;
  }
}

/** 판마다 다음 세트(접속 · 판이 바뀔 때마다 다른 문제) */
export function nextGameSet(sets: GameSet[]): GameSet {
  let n = 0;
  try {
    n = Number(localStorage.getItem(NEXT_KEY) ?? 0) || 0;
    localStorage.setItem(NEXT_KEY, String(n + 1));
  } catch {
    n = Math.floor(Math.random() * sets.length);
  }
  return sets[n % sets.length];
}

export function _selfCheck() {
  setActiveGameSet({ expressions: [{ en: "Fresh one", ko: "새 표현", group: "start" }], sentences: [] });
  const order = freshFirst(gameExpressions(), 7);
  console.assert(order[0].en === "Fresh one", "fresh item comes first");
  console.assert(order.length === EXPRESSIONS.length + 1, "base questions fill the rest");
  setActiveGameSet(null);
  console.assert(gameExpressions().length === EXPRESSIONS.length, "no set → base only");
}
