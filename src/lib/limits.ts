// 하루 한도의 기준은 서버다(오픽게임: 게임마다 하루 5판, 학습: 무료 하루 10단계).
// 여기는 화면에 보일 "자정까지 남은 시간"만 계산한다.

/** 다음 초기화(한국 자정)까지 남은 밀리초 */
export function msUntilReset(now = Date.now()): number {
  const kstNow = now + 9 * 3600_000;
  const nextKstMidnight = Math.floor(kstNow / 86_400_000 + 1) * 86_400_000;
  return nextKstMidnight - kstNow;
}

// 자체 점검: 2026-11-14 23:30 KST = 14:30 UTC → 30분 남음
export function _selfCheck() {
  console.assert(Math.round(msUntilReset(Date.parse("2026-11-14T14:30:00Z")) / 60000) === 30, "reset at KST midnight");
}
