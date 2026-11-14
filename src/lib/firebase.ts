import { initializeApp } from "firebase/app";
import { getToken, initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from "firebase/app-check";
import { getAuth } from "firebase/auth";

// 웹 클라이언트 설정값은 공개용이다(보안은 Auth · App Check · 서버 검증이 맡는다).
const app = initializeApp({
  apiKey: "AIzaSyD6Ni_9F7n0lrA600Ha0YrIUMZ36O_X2cg",
  // 운영에선 로그인 경로(/__/auth)를 우리 도메인으로 프록시(vercel.json)해서
  // Google 로그인 화면에 firebaseapp.com 대신 우리 주소가 보이게 한다.
  // 미리보기 배포 주소는 OAuth 리디렉션 URI에 없으므로 운영 도메인에서만 프록시를 쓴다.
  authDomain:
    window.location.host === "dailyopic.vercel.app" ? "dailyopic.vercel.app" : "opicmobile-45cd5.firebaseapp.com",
  projectId: "opicmobile-45cd5",
  storageBucket: "opicmobile-45cd5.firebasestorage.app",
  messagingSenderId: "992368032252",
  appId: "1:992368032252:web:92707a165d27e2435d9a79",
});

export const auth = getAuth(app);
auth.languageCode = "ko";

const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;

if (import.meta.env.DEV) {
  // 로컬 개발: 콘솔에 찍히는 디버그 토큰을 Firebase App Check에 등록해야 서버를 통과한다.
  (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN: boolean | string }).FIREBASE_APPCHECK_DEBUG_TOKEN =
    (import.meta.env.VITE_APPCHECK_DEBUG_TOKEN as string | undefined) ?? true;
}

// 디버그 모드에선 공급자 키를 쓰지 않으므로 사이트 키가 없어도 초기화한다.
const providerKey = siteKey ?? (import.meta.env.DEV ? "debug-only" : undefined);
const appCheck: AppCheck | null = providerKey
  ? initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(providerKey), isTokenAutoRefreshEnabled: true })
  : null;

export async function appCheckToken(): Promise<string | null> {
  if (!appCheck) return null;
  const { token } = await getToken(appCheck);
  return token;
}
