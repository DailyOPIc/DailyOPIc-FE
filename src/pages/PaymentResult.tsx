import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Mascot } from "../assets/Mascot";
import { api, ApiError, type Wallet } from "../lib/api";
import { useAuth } from "../lib/auth";
import { play } from "../lib/sfx";

const PLAN_NAME: Record<string, string> = { free: "무료", basic: "베이직", plus: "플러스", pro: "프로" };

const date = (iso: string) =>
  new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

/** 토스 결제창에서 돌아오는 곳. 성공이면 서버에 승인을 요청하고(재시도 안전) 받은 혜택을 보여 준다. */
export function PaymentResult({ ok }: { ok: boolean }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [error, setError] = useState<string | null>(ok ? null : params.get("message") || "결제가 완료되지 않았어요.");
  const started = useRef(false);

  useEffect(() => {
    if (!ok || !user || started.current) return;
    started.current = true;
    const paymentKey = params.get("paymentKey") ?? "";
    const orderId = params.get("orderId") ?? "";
    const amount = Number(params.get("amount"));
    api
      .confirmPayment({ paymentKey, orderId, amount })
      .then((w) => {
        setWallet(w);
        play("fanfare");
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "결제를 확인하지 못했어요. 고객센터로 문의해 주세요."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ok, user]);

  if (!ready) return null;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;

  const pending = ok && !wallet && !error;
  return (
    <div className="pay-result">
      <Mascot mood={pending ? "think" : error ? "sad" : "cheer"} size={140} />
      {pending && <h1>결제를 확인하고 있어요…</h1>}
      {error && (
        <>
          <h1>결제가 완료되지 않았어요</h1>
          <p className="lead">{error}</p>
          <p className="pay-note">결제 금액이 빠져나갔는데 이 화면이 보이면 고객센터로 알려 주세요. 확인 후 바로 처리해 드려요.</p>
        </>
      )}
      {wallet && (
        <>
          <h1>결제가 완료됐어요!</h1>
          <ul className="pay-summary">
            <li>
              <span>지금 플랜</span>
              <b>{PLAN_NAME[wallet.plan] ?? wallet.plan}</b>
            </li>
            {wallet.webPass && (
              <li>
                <span>이용권 만료</span>
                <b>{date(wallet.webPass.expiresAt)}</b>
              </li>
            )}
            <li>
              <span>보유 토큰</span>
              <b>{wallet.purchasedTokens}개</b>
            </li>
          </ul>
        </>
      )}
      {!pending && (
        <div className="row-actions">
          <Link to="/membership" className="chunky chunky-ghost">
            요금제
          </Link>
          <Link to="/study" className="chunky chunky-primary">
            학습하러 가기
          </Link>
        </div>
      )}
    </div>
  );
}
