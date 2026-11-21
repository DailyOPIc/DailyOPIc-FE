import { auth, appCheckToken } from "./firebase";

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
  const h = await headers(init.idempotencyKey);
  if (init.json !== undefined) h["Content-Type"] = "application/json";
  const response = await fetch(BASE_URL + path, {
    method: init.method ?? "GET",
    headers: h,
    body: init.form ?? (init.json !== undefined ? JSON.stringify(init.json) : undefined),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail = typeof body.detail === "object" && body.detail ? body.detail : {};
    throw new ApiError(response.status, detail.code, detail.message ?? messageFor(response.status));
  }
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
  wallet: () => request<Wallet>("/v1/web-payments/wallet"),
  createOrder: (productId: string) =>
    request<WebOrder>("/v1/web-payments/orders", { method: "POST", json: { productId } }),
  confirmPayment: (body: { paymentKey: string; orderId: string; amount: number }) =>
    request<Wallet>("/v1/web-payments/confirm", { method: "POST", json: body }),
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
    if (args.audio) form.append("audio", args.audio, "answer.webm");
    return request<Evaluation>("/v2/evaluations/practice", { method: "POST", form, idempotencyKey: key });
  },
};
