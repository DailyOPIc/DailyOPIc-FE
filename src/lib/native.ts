// iOS 앱(WKWebView) 안에서 실행될 때의 연결부.
// 앱이 문서 시작 시 window.DailyOPIcNative = { uid } 를 넣어 주고, 요청은
// webkit.messageHandlers.dailyopic.postMessage({ action, ... }) 로 보낸다(WKScriptMessageHandlerWithReply라 Promise로 답이 온다).
// 로그인 · 결제(인앱결제) · 계정 연결/삭제는 앱이 맡고, 웹은 화면만 그린다.

type NativeInfo = { uid: string; speech?: boolean };
type Bridge = { postMessage(body: { action: string; [key: string]: unknown }): Promise<unknown> };

const w = window as unknown as {
  DailyOPIcNative?: NativeInfo;
  webkit?: { messageHandlers?: { dailyopic?: Bridge } };
};

export const nativeApp: NativeInfo | null = w.DailyOPIcNative ?? null;
export const inApp = nativeApp !== null;
/** 앱이 녹음 · 전사를 맡는지(2.3.1부터). 웹 음성 인식은 WKWebView에서 실행마다 마이크 허용을 따로 묻는다. */
export const nativeSpeech = nativeApp?.speech === true;
/** 앱이 인식 중인 문장을 보내는 이벤트(detail: 지금까지의 전사) */
export const SPEECH_EVENT = "dailyopic:speech";

export function callNative<T = unknown>(action: string, args: Record<string, unknown> = {}): Promise<T> {
  const bridge = w.webkit?.messageHandlers?.dailyopic;
  if (!bridge) return Promise.reject(new Error("앱 연결을 찾지 못했어요. 앱을 다시 열어 주세요."));
  return bridge.postMessage({ action, ...args }) as Promise<T>;
}

/** 서버 요청 인증 헤더(앱의 Firebase ID 토큰 · App Check 토큰) */
export const nativeHeaders = () => callNative<{ authorization: string; appCheck: string }>("headers");

/** 앱이 결제 · 계정 화면을 닫은 뒤 웹이 플랜 · 토큰을 다시 읽도록 보내는 이벤트 */
export const REFRESH_EVENT = "dailyopic:refresh";
