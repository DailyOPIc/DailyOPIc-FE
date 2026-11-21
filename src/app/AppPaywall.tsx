import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mascot } from "../assets/Mascot";
import { callNative, REFRESH_EVENT } from "../lib/native";

/** iOS 앱 안의 /membership: 앱의 인앱결제 화면을 띄우고, 닫히면 이전 화면으로 돌아가 플랜을 다시 읽는다. */
let opening = false; // 개발 모드(StrictMode)의 이중 실행으로 결제창이 두 번 뜨지 않게

export function AppPaywall() {
  const navigate = useNavigate();
  useEffect(() => {
    if (opening) return;
    opening = true;
    callNative("openPaywall")
      .catch(() => {})
      .finally(() => {
        opening = false;
        window.dispatchEvent(new Event(REFRESH_EVENT));
        if (window.history.length > 1) navigate(-1);
        else navigate("/study", { replace: true });
      });
  }, [navigate]);
  return (
    <div className="splash">
      <Mascot mood="think" size={110} />
      <p>요금제를 여는 중…</p>
    </div>
  );
}
