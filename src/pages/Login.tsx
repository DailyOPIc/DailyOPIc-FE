import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Marquee } from "../components/Bits";
import { LogoBuild } from "../components/Demos";
import { signInWithGoogle, useAuth } from "../lib/auth";

export function Login() {
  const { user, ready } = useAuth();
  const location = useLocation();
  // 같은 사이트 안의 경로만 허용(외부 주소로 튕기는 오픈 리다이렉트 방지)
  const rawNext = new URLSearchParams(location.search).get("next") || "/study";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/study";
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (ready && user) return <Navigate to={next} replace />;

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      const code = (e as { code?: string }).code ?? "";
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        const messages: Record<string, string> = {
          "auth/operation-not-allowed": "이 로그인 방식은 아직 준비 중이에요.",
          "auth/unauthorized-domain": "이 주소에서는 아직 로그인을 열지 않았어요.",
          "auth/popup-blocked": "팝업이 차단됐어요. 브라우저에서 팝업을 허용해 주세요.",
          "auth/network-request-failed": "네트워크 연결을 확인해 주세요.",
        };
        // 원인 코드를 함께 보여 줘야 문의가 왔을 때 바로 찾는다.
        setError(`${messages[code] ?? "로그인하지 못했어요. 다시 시도해 주세요."} (${code || "unknown"})`);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <Marquee label="" speed={70} className="login-backdrop">
        {["SPEAK", "EVERY", "DAY", "DailyOPIc"].map((w) => (
          <span key={w}>{w}</span>
        ))}
      </Marquee>
      <LogoBuild className="login-logo" />
      <Link to="/" className="login-home" aria-label="데일리오픽 홈">
        <img src="/images/logo-mark.png" alt="" width={32} height={32} />
        데일리오픽
      </Link>

      <div className="login-inner">
        {next.includes("vs=") && <p className="login-challenge">친구가 보낸 도전장이 기다리고 있어요! 로그인하고 바로 대결해요</p>}
        <p className="login-kicker">매일 말하는 연습이 등급을 만드는</p>
        <h1 className="login-title">
          AI 스피킹 루틴 <span>데일리오픽</span>
        </h1>
        <p className="login-offer">
          로그인만 하면 <mark>오늘의 문제와 AI 분석</mark>을 바로 시작해요
        </p>
        <ul className="login-checks">
          <li>매일 14문항 실전 세트</li>
          <li>예상 등급 · 5개 영역 분석</li>
          <li>잘한 점 · 개선할 점 피드백</li>
        </ul>

        <button className="login-primary" disabled={busy} onClick={() => run(signInWithGoogle)}>
          <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
            </svg>
          Google로 계속하기
        </button>

        {/* ponytail: Apple 로그인은 베타 동안 숨김. 다시 열 때 signInWithApple(lib/auth) 버튼을 되살린다. */}
        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <div className="login-links">
          <Link to="/help">로그인에 어려움이 있나요?</Link>
          <Link to="/terms">이용약관</Link>
          <Link to="/privacy">개인정보처리방침</Link>
        </div>
        <p className="login-note">iPhone 앱의 기존 기록은 아직 웹과 연결되지 않아요.</p>
      </div>
    </div>
  );
}
