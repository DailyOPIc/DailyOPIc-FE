import { api } from "./api";
import { callNative, inApp, REFRESH_EVENT } from "./native";
import { play } from "./sfx";

// 토큰 보상: 활동(보물상자 · 게임 · 하루 목표)과 iOS 앱의 보상형 광고.
// 보너스 토큰은 서버가 하루 한도 안에서 주고(그날 자정에 사라짐), 여기서는 알림만 띄운다.

/** 받은 토큰 알림(TokenToast가 띄운다). detail = 어디서 받았는지 */
export const TOKEN_EVENT = "dailyopic:token";

export function announce(label: string) {
  play("coin");
  window.dispatchEvent(new CustomEvent(TOKEN_EVENT, { detail: label }));
  window.dispatchEvent(new Event(REFRESH_EVENT)); // 상단 토큰 수 다시 읽기
}

/** 활동 보상. 오늘 한도를 다 받았으면 조용히 지나간다. */
export async function claimActivityToken(kind: "chest" | "game" | "goal", label: string) {
  try {
    const r = await api.activityReward(kind);
    if (r.granted) announce(label);
  } catch {
    /* 보상은 덤이라 실패해도 학습 흐름은 그대로 */
  }
}

/** 보상형 광고는 iOS 앱의 무료 플랜에서만(웹에는 광고가 없고, 유료 플랜은 광고 보너스가 없다) */
export const canWatchAd = (plan: string) => inApp && plan === "free";

export async function watchAdForToken(): Promise<boolean> {
  try {
    await callNative("watchAd");
    announce("광고 보상");
    return true;
  } catch (e) {
    window.alert((e as Error).message || "광고를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
    return false;
  }
}
