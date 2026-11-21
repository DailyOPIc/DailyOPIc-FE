import { useEffect, useState } from "react";
import { LogoBuild } from "../components/Demos";

/** iOS 앱에서만: 앱을 열 때 로고가 그려지는 스플래시(웹 화면 위에 잠깐 덮었다가 사라진다).
 *  흰 바탕이라 iOS 실행 화면 · 상태바와 색이 이어진다. */
export function AppSplash() {
  const [phase, setPhase] = useState<"show" | "out" | "gone">("show");
  useEffect(() => {
    const out = window.setTimeout(() => setPhase("out"), 1500);
    const gone = window.setTimeout(() => setPhase("gone"), 1900);
    return () => {
      window.clearTimeout(out);
      window.clearTimeout(gone);
    };
  }, []);
  if (phase === "gone") return null;
  return (
    <div className={`app-splash${phase === "out" ? " out" : ""}`} aria-hidden="true">
      <LogoBuild className="app-splash-logo" />
      <p className="app-splash-name">데일리오픽</p>
    </div>
  );
}
