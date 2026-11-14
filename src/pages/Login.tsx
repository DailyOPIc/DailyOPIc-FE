import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Marquee } from "../components/Bits";
import { LogoBuild } from "../components/Demos";
import { signInWithApple, signInWithGoogle, useAuth } from "../lib/auth";

export function Login() {
  const { user, ready } = useAuth();
  const location = useLocation();
  const next = new URLSearchParams(location.search).get("next") || "/study";
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

      <div className="login-inner">
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

        <div className="login-divider">
          <span>또는</span>
        </div>
        <div className="login-icons">
          <button
            className="login-icon apple"
            disabled={busy}
            onClick={() => run(signInWithApple)}
            aria-label="Apple로 계속하기"
            title="Apple로 계속하기"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="currentColor">
              <path d="M16.37 12.6c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.47.83-.72 0-1.82-.81-2.99-.79-1.54.02-2.96.9-3.75 2.27-1.6 2.78-.41 6.89 1.15 9.14.76 1.1 1.67 2.34 2.86 2.29 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.39-.92-2.4-3.65zM14.1 5.86c.63-.77 1.06-1.83.94-2.89-.91.04-2.01.61-2.66 1.37-.58.67-1.09 1.75-.96 2.79 1.02.08 2.05-.52 2.68-1.27z" />
            </svg>
          </button>
        </div>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <div className="login-links">
          <Link to="/help">로그인에 어려움이 있나요?</Link>
          <Link to="/privacy">개인정보처리방침</Link>
        </div>
        <p className="login-note">iPhone 앱의 기존 기록은 아직 웹과 연결되지 않아요.</p>
      </div>
    </div>
  );
}
