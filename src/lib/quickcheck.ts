// 무료 간단 체크(AI 아님): 기기에서 전사 · 녹음 시간만으로 말하기 습관을 점수화한다. 토큰을 쓰지 않는다.
import { EXPRESSIONS } from "../data/expressions";

const CONNECTORS = ["because", "so", "also", "but", "and then", "however", "actually", "for example", "after that", "when", "while", "since"];

export type QuickCheck = {
  words: number;
  seconds: number;
  wpm: number;
  sentences: number;
  connectors: string[];
  expressions: string[];
  stars: 0 | 1 | 2 | 3;
  tips: string[];
};

const norm = (s: string) => ` ${s.toLowerCase().replace(/[^a-z' ]+/g, " ").replace(/\s+/g, " ").trim()} `;

export function quickCheck(transcript: string, seconds: number): QuickCheck {
  const text = norm(transcript);
  const words = text.trim() ? text.trim().split(" ").length : 0;
  const sentences = Math.max(1, (transcript.match(/[.!?]+/g) ?? []).length || Math.round(words / 12));
  const connectors = CONNECTORS.filter((c) => text.includes(` ${c} `));
  const expressions = EXPRESSIONS.map((e) => e.en)
    .filter((e) => {
      const k = norm(e).trim();
      return k.split(" ").length >= 2 && text.includes(` ${k} `);
    })
    .slice(0, 5);
  const wpm = seconds > 3 ? Math.round((words / seconds) * 60) : 0;

  let score = 0;
  if (words >= 40) score++;
  if (words >= 90) score++;
  if (connectors.length >= 2) score++;
  if (expressions.length >= 1) score++;
  // 길이가 상한을 정한다: 40단어 미만은 최대 1개, 90단어 미만은 최대 2개.
  const cap = words < 15 ? 0 : words < 40 ? 1 : words < 90 ? 2 : 3;
  const stars = Math.min(cap, Math.max(1, score - (seconds > 0 && seconds < 20 ? 1 : 0))) as QuickCheck["stars"];

  const tips: string[] = [];
  if (words < 40) tips.push("조금 더 길게! 이유나 예시를 2~3문장 더해 보세요.");
  else if (words < 90) tips.push("좋아요. 경험 한 가지를 구체적으로 붙이면 더 높은 등급에 가까워져요.");
  if (connectors.length < 2) tips.push("because, so, also 같은 연결어로 문장을 이어 보세요.");
  if (expressions.length === 0) tips.push("단어 게임에서 익힌 표현(예: To be honest,)을 한 번 써 보세요.");
  if (wpm > 0 && wpm < 70) tips.push("말이 조금 느려요. 멈추는 대신 'Let me see.'로 시간을 벌어 보세요.");
  if (tips.length === 0) tips.push("훌륭해요! 이 흐름 그대로 AI 정밀 분석도 받아 보세요.");

  return { words, seconds: Math.round(seconds), wpm, sentences, connectors, expressions, stars, tips: tips.slice(0, 2) };
}

// 자체 점검: node --experimental-strip-types 로 실행
export function _selfCheck() {
  const short = quickCheck("I like cafe.", 5);
  console.assert(short.stars === 0, "too short gets 0 stars");
  const good = quickCheck(
    "To be honest, I go to a cafe near my house because it is quiet. " +
      "On top of that, the coffee is really good and the staff are kind. ".repeat(4) +
      "So I usually study there for a few hours, and also I meet my friends there on weekends.",
    60,
  );
  console.assert(good.stars >= 2, `good answer gets 2+ stars, got ${good.stars}`);
  console.assert(good.expressions.includes("To be honest,"), "detects expression");
  console.assert(good.connectors.includes("because"), "detects connector");
  const mid = quickCheck("To be honest, I go to a cafe because it is quiet. So I study there.", 20);
  console.assert(mid.stars === 1, `short answer capped at 1 star, got ${mid.stars}`);
}
