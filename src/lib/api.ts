import { auth, appCheckToken } from "./firebase";
import type { GameSet } from "./gamePool";
import { inApp, nativeHeaders } from "./native";

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "https://dailyopic-api-992368032252.asia-northeast3.run.app";

// ── 서버 계약(DailyOPIc-BE app/models/api.py와 같은 모양) ──────────────────
export type OPIcLevel = "NL" | "NM" | "NH" | "IL" | "IM1" | "IM2" | "IM3" | "IH" | "AL";

export type Survey = {
  status: string;
  residence: string;
  leisure: string[];
  hobbies: string[];
  sports: string[];
  travel: string[];
};

export type Question = {
  number: number;
  examSection: string;
  topic: string;
  prompt: string;
  difficulty: OPIcLevel;
  questionStyle?: string | null;
};

export type QuestionSet = {
  setId: string;
  questions: Question[];
  expectedTargetLevel: OPIcLevel;
  initialLevel: number;
};

export type Usage = {
  freeRemaining: number;
  bonusRemaining: number;
  /** 웹에서 산 보유 토큰(매일 사라지지 않음). 하루 토큰을 다 쓰면 여기서 쓴다. */
  purchasedTokens?: number;
  resetsAt?: string | null;
  mockAvailable?: boolean | null;
  mockRemaining?: number | null;
  mockSessionStage?: MockStage | null;
  /** 광고 보고 토큰 받기(무료 앱): 오늘 본 횟수 / 하루 최대 */
  adRewardsUsed?: number;
  adRewardsMax?: number;
  /** 오픽게임 게임별 오늘 플레이 수 · 하루 한도 */
  gamePlays?: Record<string, number>;
  gamePlaysLimit?: number;
};

/** 학습 경로: 10단계 묶음 하나. 지금 단계(done+1)를 AI 분석까지 끝내야 다음이 열린다. */
export type PathState = {
  chapter: number;
  set: QuestionSet;
  done: number;
  steps: number;
  chestSlots: number[];
  claimedChests: number[];
  /** 오늘 새 묶음 한도에 걸림(무료: 하루 10단계) */
  nextLocked: boolean;
};

export type LevelProgress = { level: number; xp: number; levelXp: number; levelNeed: number };

export type Profile = {
  nickname: string | null;
  progress: LevelProgress;
  streak: number;
  bestStreak: number;
  todayCount: number;
  todayXp: number;
  dailyGoal: number;
};

export type ActivityDay = { date: string; total: number; xp: number; counts: Record<string, number> };

export type XpGain = { gained: number; progress: LevelProgress; leveledUp: boolean; streak: number };

export type MockStage =
  | "awaiting_start_ad"
  | "generating_front"
  | "answering_front"
  | "awaiting_adjustment_ad"
  | "generating_tail"
  | "answering_tail"
  | "awaiting_result_ad"
  | "evaluating"
  | "completed";

export type MockSession = {
  sessionId: string;
  sessionHash: string;
  stage: MockStage;
  setId?: string | null;
  adjustment?: "easier" | "same" | "harder" | null;
  questionSet?: (QuestionSet & { requiresAdjustmentAfter?: number | null; questions: Question[] }) | null;
};

export type MockEvaluation = {
  predictedLevel: OPIcLevel;
  confidence: string;
  scores: Evaluation["scores"];
  strengths: string[];
  improvements: string[];
  targetGap: string;
  overallFeedback: string;
  perQuestion: { number: number; feedback: string; sampleAnswer: string }[];
  disclaimer: string;
  warnings: string[];
};

export type Wallet = {
  plan: string;
  webPass: { plan: string; expiresAt: string } | null;
  purchasedTokens: number;
};

export type WebOrder = { orderId: string; orderName: string; amount: number };

export type Capabilities = { plan: string };

export type Rubric = { dimension: string; band: string; evidence: string; nextAction: string };

export type Evaluation = {
  predictedLevel: OPIcLevel;
  confidence: string;
  scores: Record<"taskFulfillment" | "grammar" | "vocabulary" | "discourse" | "fluency", number>;
  strengths: string[];
  improvements: string[];
  correctedAnswer?: string | null;
  targetGap?: string | null;
  sampleAnswer?: string | null;
  disclaimer: string;
  rubrics: Rubric[];
  warnings: string[];
  answerQuality: "gradable" | "low_evidence" | "insufficient";
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string | undefined,
    message: string,
  ) {
    super(message);
  }
  get isQuotaExhausted() {
    return this.status === 402 && this.code === "practice_quota_exhausted";
  }
}

async function headers(idempotencyKey?: string): Promise<Record<string, string>> {
  if (inApp) {
    // iOS 앱 안: 앱의 로그인 · App Check 토큰을 그대로 쓴다(서버는 iOS 앱 요청으로 본다).
    const n = await nativeHeaders();
    const result: Record<string, string> = { Authorization: n.authorization, "X-Firebase-AppCheck": n.appCheck, "X-DailyOPIc-Client": "ios-app" };
    if (idempotencyKey) result["Idempotency-Key"] = idempotencyKey;
    return result;
  }
  const user = auth.currentUser;
  if (!user) throw new ApiError(401, "signed_out", "로그인이 필요해요.");
  const [idToken, appCheck] = await Promise.all([user.getIdToken(), appCheckToken()]);
  const result: Record<string, string> = { Authorization: `Bearer ${idToken}` };
  if (appCheck) result["X-Firebase-AppCheck"] = appCheck;
  if (idempotencyKey) result["Idempotency-Key"] = idempotencyKey;
  return result;
}

async function request<T>(
  path: string,
  init: { method?: string; json?: unknown; form?: FormData; idempotencyKey?: string } = {},
): Promise<T> {
  let response: Response;
  // 같은 작업이 서버에서 아직 처리 중이면(409 request_processing: 새로고침 · 두 기기 · 중복 요청)
  // 오류로 끝내지 않고 Retry-After만큼 기다렸다가 다시 묻는다(최대 약 1분).
  for (let attempt = 0; ; attempt++) {
    const h = await headers(init.idempotencyKey);
    if (init.json !== undefined) h["Content-Type"] = "application/json";
    response = await fetch(BASE_URL + path, {
      method: init.method ?? "GET",
      headers: h,
      body: init.form ?? (init.json !== undefined ? JSON.stringify(init.json) : undefined),
    });
    if (response.status !== 409 || attempt >= 30) break;
    const peek = await response.clone().json().catch(() => ({}));
    if (peek?.detail?.code !== "request_processing") break;
    await new Promise((r) => setTimeout(r, (Number(response.headers.get("Retry-After")) || 2) * 1000));
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail = typeof body.detail === "object" && body.detail ? body.detail : {};
    throw new ApiError(response.status, detail.code, detail.message ?? messageFor(response.status));
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function messageFor(status: number) {
  if (status === 403) return "보안 확인에 실패했어요. 새로고침 후 다시 시도해 주세요.";
  if (status === 401) return "다시 로그인해 주세요.";
  if (status === 429) return "요청이 많아요. 잠시 후 다시 시도해 주세요.";
  return "잠시 연결에 문제가 있어요. 다시 시도해 주세요.";
}

export const api = {
  capabilities: () => request<Capabilities>("/v1/capabilities"),
  usage: () => request<Usage>("/v1/usage"),
  /** 계정 삭제: 서버의 학습 기록 · 사용량 · 웹 이용권 · 토큰과 로그인 계정을 지운다(결제 기록은 보존). */
  deleteAccount: () => request<void>("/v1/users/me", { method: "DELETE" }),
  wallet: () => request<Wallet>("/v1/web-payments/wallet"),
  /** 오픽게임 하루 세트(서버가 AI로 하루 5세트, 모든 사용자 공용) */
  gameSets: () => request<{ dateKey: string; sets: GameSet[] }>("/v1/games/daily-sets"),
  /** 활동 보상: 하루 한도 안에서 보너스 토큰 1개(보물상자 2 · 게임 1 · 하루 목표 1) */
  activityReward: (kind: "chest" | "game" | "goal") =>
    request<{ granted: boolean; bonusRemaining: number }>("/v1/activity-rewards", { method: "POST", json: { kind } }),
  // 모의고사: 회차 생성(진행 중이면 이어서) → 시작 → 7번 뒤 난이도 조정 → 15문항 채점
  mockCreate: (body: { initialLevel: number; survey: Survey }, key: string) =>
    request<MockSession>("/v1/mock-exams/sessions", { method: "POST", json: { ...body, background: {} }, idempotencyKey: key }),
  mockCurrent: () => request<MockSession>("/v1/mock-exams/current"),
  mockStart: (sessionId: string, rewardNonce: string, key: string) =>
    request<MockSession>(`/v1/mock-exams/${sessionId}/start`, { method: "POST", json: { rewardNonce }, idempotencyKey: key }),
  mockAdjust: (sessionId: string, adjustment: "easier" | "same" | "harder", rewardNonce: string, key: string) =>
    request<MockSession>(`/v1/mock-exams/${sessionId}/adjustment`, {
      method: "POST",
      json: { adjustment, rewardNonce },
      idempotencyKey: key,
    }),
  mockAbandon: (sessionId: string) => request<MockSession>(`/v1/mock-exams/${sessionId}/abandon`, { method: "POST" }),
  mockEvaluate: (
    args: { sessionId: string; setId: string; targetLevel: OPIcLevel; rewardNonce: string; answers: { number: number; transcript: string; audio: Blob }[] },
    key: string,
  ) => {
    const form = new FormData();
    const sorted = [...args.answers].sort((a, b) => a.number - b.number);
    form.append(
      "manifest",
      JSON.stringify({
        targetLevel: args.targetLevel,
        setId: args.setId,
        rewardNonce: args.rewardNonce,
        answers: sorted.map((a) => ({ number: a.number, transcript: a.transcript })),
      }),
    );
    for (const a of sorted) form.append("audioFiles", a.audio, `answer-${a.number}.${a.audio.type.includes("mp4") ? "m4a" : "webm"}`);
    return request<MockEvaluation>(`/v1/mock-exams/${args.sessionId}/evaluate`, { method: "POST", form, idempotencyKey: key });
  },
  /** 모의고사 게이트 통과 증표. 웹은 광고 없이 바로 verified로 나온다. */
  rewardIntent: (purpose: "mock_start" | "mock_adjustment" | "mock_result", sessionHash: string) =>
    request<{ nonce: string; status: string }>("/v1/ad-rewards/intents", { method: "POST", json: { purpose, sessionHash } }),
  createOrder: (productId: string) =>
    request<WebOrder>("/v1/web-payments/orders", { method: "POST", json: { productId } }),
  confirmPayment: (body: { paymentKey: string; orderId: string; amount: number }) =>
    request<Wallet>("/v1/web-payments/confirm", { method: "POST", json: body }),
  path: (body: { initialLevel: number; survey: Survey }) =>
    request<PathState>("/v1/path", { method: "POST", json: { ...body, background: {} } }),
  nextChapter: (body: { initialLevel: number; survey: Survey }) =>
    request<PathState>("/v1/path/next-chapter", { method: "POST", json: { ...body, background: {} } }),
  openChest: (slot: number) =>
    request<{ opened: boolean; tokenGranted: boolean; bonusRemaining: number; xp: XpGain | null }>(`/v1/path/chests/${slot}`, { method: "POST" }),
  profile: () => request<Profile>("/v1/me/profile"),
  setNickname: (nickname: string) => request<Profile>("/v1/me/nickname", { method: "PUT", json: { nickname } }),
  activity: (days = 140) => request<{ days: ActivityDay[] }>(`/v1/me/activity?days=${days}`),
  importProgress: (body: { xp: number; streak: number; bestStreak: number; lastDay: string | null }) =>
    request<Profile>("/v1/me/progress/import", { method: "POST", json: body }),
  /** 게임 한 판 시작(게임마다 하루 5판). setIndex = 이번 판에 쓸 오늘의 세트 */
  gamePlay: (game: string) =>
    request<{ game: string; used: number; limit: number; setIndex: number }>("/v1/games/plays", { method: "POST", json: { game } }),
  gameFinish: (game: string, correct: number) =>
    request<XpGain>("/v1/games/plays/finish", { method: "POST", json: { game, correct } }),
  practiceSet: (body: { initialLevel: number; survey: Survey }, key: string) =>
    request<QuestionSet>("/v1/question-sets/practice", {
      method: "POST",
      json: { ...body, background: {} },
      idempotencyKey: key,
    }),
  refreshSet: (body: { initialLevel: number; survey: Survey }, key: string) =>
    request<QuestionSet>("/v1/question-sets/practice/refresh", {
      method: "POST",
      json: { ...body, background: {}, adjustment: "same" },
      idempotencyKey: key,
    }),
  evaluate: (
    args: { set: QuestionSet; number: number; transcript: string; audio: Blob | null },
    key: string,
  ) => {
    const form = new FormData();
    form.append("setId", args.set.setId);
    form.append("questionNumber", String(args.number));
    form.append("transcript", args.transcript);
    form.append("targetLevel", args.set.expectedTargetLevel);
    if (args.audio) form.append("audio", args.audio, `answer.${args.audio.type.includes("mp4") ? "m4a" : "webm"}`);
    return request<Evaluation>("/v2/evaluations/practice", { method: "POST", form, idempotencyKey: key });
  },
};
