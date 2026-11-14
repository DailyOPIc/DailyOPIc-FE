import { StrictMode, useEffect, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { Membership } from "./pages/Membership";
import { Help } from "./pages/Help";
import { Privacy } from "./pages/Privacy";
import { NotFound } from "./pages/NotFound";
import { Login } from "./pages/Login";
import { StudyApp } from "./app/StudyApp";
import { DevPreview } from "./app/DevPreview";
import { AuthProvider } from "./lib/auth";
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
const PUBLIC_PATHS = ["/", "/membership", "/help", "/privacy"];

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
  const app = /^\/(study|login|dev)/.test(pathname);
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
      <SiteChrome>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/help" element={<Help />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/login" element={<Login />} />
          <Route path="/study" element={<StudyApp />} />
          {import.meta.env.DEV && <Route path="/dev/study" element={<DevPreview />} />}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </SiteChrome>
    </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);
