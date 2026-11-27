import { StrictMode, useEffect, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { Membership } from "./pages/Membership";
import { PaymentResult } from "./pages/PaymentResult";
import { Help } from "./pages/Help";
import { Privacy } from "./pages/Privacy";
import { Refund } from "./pages/Refund";
import { Terms } from "./pages/Terms";
import { NotFound } from "./pages/NotFound";
import { Login } from "./pages/Login";
import { StudyApp } from "./app/StudyApp";
import { DevPreview } from "./app/DevPreview";
import { DevAssets } from "./app/DevAssets";
import { AuthProvider } from "./lib/auth";
import { inApp } from "./lib/native";
import { AppPaywall } from "./app/AppPaywall";
import { AppSplash } from "./app/AppSplash";
import { TokenToast } from "./app/TokenToast";
import "./styles.css";

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

// 검색에 공개하는 페이지(public/sitemap.xml과 같은 목록). 정식 주소는 www.
const SITE = "https://www.dailyopic.link";
const PUBLIC_PATHS = ["/", "/membership", "/help", "/privacy", "/refund", "/terms"];

// 페이지별 제목 · 설명(검색 결과와 브라우저 탭에 보인다)
const BRAND = "데일리오픽";
const PAGES: Record<string, { title: string; description?: string }> = {
  "/": {
    title: "데일리오픽 · 매일 말하며 준비하는 OPIc",
    description: "매일 받는 OPIc 문제에 직접 말하고, AI가 예상 등급과 개선점을 바로 알려주는 스피킹 학습 서비스.",
  },
  "/membership": {
    title: `요금제 · ${BRAND}`,
    description: "무료 · 베이직 · 플러스 · 프로. 데일리 토큰과 AI 분석, 모의고사 횟수를 비교해 보세요.",
  },
  "/help": { title: `고객센터 · ${BRAND}`, description: "데일리 토큰, 구독 해지 · 환불, 녹음 문제 등 자주 묻는 질문과 문의 방법." },
  "/privacy": { title: `개인정보처리방침 · ${BRAND}`, description: "데일리오픽이 처리하는 정보와 이용 목적, 보관 · 파기, 이용자 권리 안내." },
  "/refund": { title: `환불 규정 · ${BRAND}`, description: "데일리오픽 웹 이용권과 App Store 구독의 청약철회 · 환불 기준과 신청 방법." },
  "/terms": { title: `이용약관 · ${BRAND}`, description: "데일리오픽 서비스 이용 조건, 유료 서비스 · 결제, 이용자 의무와 책임을 안내합니다." },
  "/login": { title: `로그인 · ${BRAND}` },
  "/study": { title: `오늘의 학습 · ${BRAND}` },
  "/study/words": { title: `오픽게임 · ${BRAND}` },
  "/study/mock": { title: `모의고사 · ${BRAND}` },
  "/study/me": { title: `마이 · ${BRAND}` },
  "/payments/success": { title: `결제 확인 · ${BRAND}` },
  "/payments/fail": { title: `결제 실패 · ${BRAND}` },
};

function setHead(selector: string, create: () => HTMLElement, attr: string, value: string | null) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (value === null) return el?.remove();
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

/** 경로마다 canonical을 맞추고, 공개 페이지가 아니면(로그인 · 학습 · 없는 주소) noindex. */
function SeoTags() {
  const { pathname } = useLocation();
  useEffect(() => {
    const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : "/";
    const isPublic = PUBLIC_PATHS.includes(path);
    const page = PAGES[path];
    document.title = page?.title ?? `페이지를 찾을 수 없어요 · ${BRAND}`;
    setHead(
      'meta[name="description"]',
      () => Object.assign(document.createElement("meta"), { name: "description" }),
      "content",
      page?.description ?? PAGES["/"].description!,
    );
    setHead(
      'link[rel="canonical"]',
      () => Object.assign(document.createElement("link"), { rel: "canonical" }),
      "href",
      isPublic ? SITE + (path === "/" ? "/" : path) : null,
    );
    setHead(
      'meta[name="robots"]',
      () => Object.assign(document.createElement("meta"), { name: "robots" }),
      "content",
      isPublic ? null : "noindex",
    );
  }, [pathname]);
  return null;
}

/** [data-reveal] 요소가 화면에 들어오면 is-visible을 붙인다(한 번만). */
function RevealOnScroll() {
  const { pathname } = useLocation();
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.15 },
    );
    document.querySelectorAll("[data-reveal]:not(.is-visible)").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);
  return null;
}

/** 서비스 화면(/login, /study)은 사이트 헤더 · 푸터 없이 꽉 채운다. */
function SiteChrome({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const app = /^\/(study|login|dev|payments)/.test(pathname);
  if (app) return <>{children}</>;
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
    <BrowserRouter>
      <ScrollToTop />
      <RevealOnScroll />
      <SeoTags />
      {inApp && <AppSplash />}
      <TokenToast />
      <SiteChrome>
        <Routes>
          {/* iOS 앱 안: 랜딩 · 로그인은 건너뛰고, 요금제는 앱의 인앱결제 화면을 띄운다(토스 결제는 앱에서 숨김) */}
          <Route path="/" element={inApp ? <Navigate to="/study" replace /> : <Home />} />
          <Route path="/membership" element={inApp ? <AppPaywall /> : <Membership />} />
          <Route path="/help" element={<Help />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/refund" element={<Refund />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/login" element={inApp ? <Navigate to="/study" replace /> : <Login />} />
          <Route path="/study/*" element={<StudyApp />} />
          <Route path="/payments/success" element={<PaymentResult ok />} />
          <Route path="/payments/fail" element={<PaymentResult ok={false} />} />
          {import.meta.env.DEV && <Route path="/dev/study" element={<DevPreview />} />}
          {import.meta.env.DEV && <Route path="/dev/assets" element={<DevAssets />} />}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </SiteChrome>
    </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);
