import { useEffect, useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppStoreButton } from "../components/Bits";
import { api, type Wallet } from "../lib/api";
import { useAuth } from "../lib/auth";
import { PASS_PRODUCTS, startCheckout, TOKEN_PRODUCTS, tokenPacksEnabled, webPaymentsOpenFor, won } from "../lib/payments";
import { CONTACT_EMAIL, PLANS } from "../site";

const RANK: Record<string, number> = { free: 0, basic: 1, plus: 2, pro: 3 };
const PLAN_NAME: Record<string, string> = { free: "무료", basic: "베이직", plus: "플러스", pro: "프로" };

const COMPARISON: { title: string; values: string[] }[] = [
  { title: "데일리 토큰", values: ["1 (+광고 1)", "3", "10", "20"] },
  { title: "AI 결과 분석", values: ["요약", "전체", "전체", "전체"] },
  { title: "모의고사", values: ["1회 체험", "매일 1회", "하루 3회", "하루 5회"] },
  { title: "학습 일정 자동화", values: ["기본 캘린더", "자동 재조정", "평가 반영 · 시험일 역산", "평가 반영 · 시험일 역산"] },
  { title: "광고", values: ["있음", "없음", "없음", "없음"] },
];

export function Membership() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const enabled = webPaymentsOpenFor(user?.email);

  useEffect(() => {
    if (user && enabled) api.wallet().then(setWallet).catch(() => {});
  }, [user, enabled]);

  const buy = async (productId: string) => {
    if (!user) return navigate(`/login?next=${encodeURIComponent("/membership")}`);
    setBusy(productId);
    setError(null);
    try {
      await startCheckout(productId);
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code !== "USER_CANCEL") setError((e as Error).message || "결제창을 열지 못했어요. 다시 시도해 주세요.");
    } finally {
      setBusy(null);
    }
  };

  // 더 높은 플랜 이용권이 남아 있으면 낮은 플랜은 사지 못하게 한다(남은 기간이 사라지지 않게).
  const activePass = wallet?.webPass ?? null;
  const blocked = (plan: string) => activePass !== null && RANK[plan] < RANK[activePass.plan];

  return (
    <div className="page">
      <section className="page-head container" data-reveal>
        <p className="eyebrow">요금제</p>
        <h1>필요한 만큼만, 가볍게</h1>
        <p className="lead">
          무료로 시작하고, 더 많이 연습하고 싶을 때 플랜을 고르세요.{" "}
          {enabled
            ? "웹은 자동 결제 없는 30일 이용권, iPhone 앱은 월 구독이에요."
            : "모든 유료 플랜은 월 구독이에요."}
        </p>
        {wallet && (activePass || wallet.purchasedTokens > 0) && (
          <p className="wallet-bar">
            {activePass && (
              <span>
                {PLAN_NAME[activePass.plan]} 이용권 ·{" "}
                {new Date(activePass.expiresAt).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}까지
              </span>
            )}
            {wallet.purchasedTokens > 0 && <span>보유 토큰 {wallet.purchasedTokens}개</span>}
          </p>
        )}
        {error && (
          <p className="pay-error" role="alert">
            {error}
          </p>
        )}
      </section>

      <section className="container plans">
        {PLANS.map((plan, i) => (
          <article
            key={plan.id}
            className={`plan${plan.featured ? " plan-featured" : ""}`}
            data-reveal
            style={{ "--reveal-delay": `${i * 80}ms` } as CSSProperties}
          >
            {plan.featured && <p className="badge">추천</p>}
            <h2>{plan.name}</h2>
            <p className="plan-tagline">{plan.tagline}</p>
            <p className="plan-price">
              <strong>{plan.price}</strong>
              {plan.id !== "free" && <span>/월</span>}
            </p>
            <ul>
              {plan.benefits.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            {enabled && plan.id !== "free" && (
              <button
                className={`chunky ${plan.featured ? "chunky-primary" : "chunky-ghost"} plan-buy`}
                disabled={busy !== null || blocked(plan.id)}
                onClick={() => buy(PASS_PRODUCTS[plan.id as "basic" | "plus" | "pro"].id)}
              >
                {blocked(plan.id)
                  ? "더 높은 이용권 사용 중"
                  : `${activePass?.plan === plan.id ? "30일 연장" : "30일 이용권"} · ${won(PASS_PRODUCTS[plan.id as "basic" | "plus" | "pro"].price)}`}
              </button>
            )}
          </article>
        ))}
      </section>

      {enabled && tokenPacksEnabled && (
        <section className="container token-packs" id="tokens">
          <h2 className="section-title">토큰만 더 필요할 때</h2>
          <p className="lead">하루 토큰을 다 쓰면 보유 토큰에서 하나씩 써요. 매일 사라지지 않아요.</p>
          <div className="token-grid">
            {TOKEN_PRODUCTS.map((t) => (
              <article key={t.id} className="token-card">
                <strong>{t.name}</strong>
                <button className="chunky chunky-ghost" disabled={busy !== null} onClick={() => buy(t.id)}>
                  {won(t.price)}
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="container notice-box">
        {enabled ? (
          <>
            <h2>iPhone 앱에서는 월 구독으로</h2>
            <p>앱의 프리미엄 화면에서 App Store 결제로 구독할 수 있어요. 앱 구독은 앱에서, 웹 이용권은 웹에서 관리해요.</p>
          </>
        ) : (
          <>
            <h2>지금은 앱에서 구독할 수 있어요</h2>
            <p>웹 결제는 준비 중이에요. 구독은 iPhone 앱의 프리미엄 화면에서 App Store 결제로 진행돼요.</p>
          </>
        )}
        <AppStoreButton />
      </section>

      <section className="container">
        <h2 className="section-title">플랜 비교</h2>
        <div className="table-wrap" tabIndex={0}>
          <table className="compare">
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">항목</span>
                </th>
                {PLANS.map((p) => (
                  <th key={p.id} scope="col">
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.title}>
                  <th scope="row">{row.title}</th>
                  {row.values.map((v, i) => (
                    <td key={i}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="container prose">
        <h2 className="section-title">데일리 토큰이란?</h2>
        <ul>
          <li>오늘의 문제 세트는 매일 무료로 받아요.</li>
          <li>AI 분석 1회, 또는 새 문제 세트로 바꾸기 1회에 토큰 1개를 써요.</li>
          <li>녹음, 다시 녹음, 이미 받은 결과를 다시 보는 것은 토큰을 쓰지 않아요.</li>
          <li>토큰은 매일 자정(한국 시간)에 다시 채워져요. 모의고사는 토큰과 별개로 플랜별 횟수가 있어요.</li>
        </ul>
        <h2 className="section-title">구독 · 환불 안내</h2>
        <ul>
          {enabled && (
            <>
              <li>웹 이용권과 토큰은 한 번만 결제되는 상품이에요. 자동으로 다시 결제되지 않아요.</li>
              <li>
                웹 결제 환불은 <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>로 요청해 주세요. 7일 이내 미사용은
                전액, 사용을 시작한 이용권은 남은 일수만큼 환불돼요.
              </li>
            </>
          )}
          <li>구독은 매월 자동 갱신되며, 다음 결제일 24시간 전까지 언제든 해지할 수 있어요.</li>
          <li>
            App Store에서 결제한 구독의 해지와 환불은 Apple 정책을 따라요. iPhone의 설정 → Apple ID → 구독에서 관리할 수
            있어요.
          </li>
          <li>
            자세한 기준은 <Link to="/refund">환불 규정</Link>에서 확인할 수 있어요.
          </li>
        </ul>
      </section>
    </div>
  );
}
