// 웹 결제(토스페이먼츠 일반결제): 30일 이용권 · 토큰 팩을 한 번씩 결제한다(자동갱신 없음).
// 가격의 기준은 서버(DailyOPIc-BE app/services/web_payments.py)다. 여기 값은 화면 표시용이라 같이 맞춘다.
import { ANONYMOUS, loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { api } from "./api";

const CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY as string | undefined;

// 웹 결제를 열 이메일(쉼표 구분). 비어 있으면 모두에게 열린다. 통신판매업 신고 전에는 토스 심사용 계정만.
// 서버(WEB_PAYMENTS_ALLOWLIST)도 같은 목록으로 주문을 막는다 — 여기는 버튼 표시용.
const ALLOWLIST = ((import.meta.env.VITE_WEB_PAYMENTS_ALLOWLIST as string | undefined) ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

/** 토큰 팩 판매 스위치(퀵오픈 심사 확정 전에는 끈다). 서버는 WEB_TOKEN_PACKS_ENABLED. */
export const tokenPacksEnabled = import.meta.env.VITE_TOKEN_PACKS === "on";

/** 클라이언트 키가 없거나 허용 목록에 없는 사람에게는 구매 버튼을 숨기고 앱 구독 안내만 보여 준다. */
export function webPaymentsOpenFor(email: string | null | undefined): boolean {
  if (!CLIENT_KEY) return false;
  return ALLOWLIST.length === 0 || ALLOWLIST.includes((email ?? "").toLowerCase());
}

export type WebProduct = { id: string; name: string; price: number };

export const PASS_PRODUCTS: Record<"basic" | "plus" | "pro", WebProduct> = {
  basic: { id: "pass_basic_30d", name: "베이직 30일 이용권", price: 3900 },
  plus: { id: "pass_plus_30d", name: "플러스 30일 이용권", price: 6900 },
  pro: { id: "pass_pro_30d", name: "프로 30일 이용권", price: 9900 },
};

export const TOKEN_PRODUCTS: WebProduct[] = [
  { id: "tokens_10", name: "데일리 토큰 10개", price: 2900 },
  { id: "tokens_30", name: "데일리 토큰 30개", price: 6900 },
];

export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

/** 서버에 주문을 만들고 토스 결제창(카드 · 간편결제 통합)을 연다. 결제 후 /payments/success로 돌아온다. */
export async function startCheckout(productId: string) {
  if (!CLIENT_KEY) throw new Error("결제가 아직 준비되지 않았어요.");
  const order = await api.createOrder(productId);
  const toss = await loadTossPayments(CLIENT_KEY);
  await toss.payment({ customerKey: ANONYMOUS }).requestPayment({
    method: "CARD",
    amount: { currency: "KRW", value: order.amount },
    orderId: order.orderId,
    orderName: order.orderName,
    successUrl: `${window.location.origin}/payments/success`,
    failUrl: `${window.location.origin}/payments/fail`,
    card: { flowMode: "DEFAULT", useEscrow: false, useCardPoint: false, useAppCardOnly: false },
  });
}
