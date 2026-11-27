// 레벨 곡선(메이플식, 상한 없음). 서버 DailyOPIc-BE app/services/progress.py 와 같아야 한다.
// 1→2: 60, 2→3: 153, 10→11: 1,343, 50→51: 11,797

export function xpToNext(level: number) {
  return Math.round(60 * level ** 1.35);
}

export function levelFromXp(total: number): { level: number; levelXp: number; levelNeed: number } {
  let level = 1;
  let rest = Math.max(0, Math.floor(total));
  while (rest >= xpToNext(level)) {
    rest -= xpToNext(level);
    level += 1;
  }
  return { level, levelXp: rest, levelNeed: xpToNext(level) };
}

// 개발 중 확인용: 서버 테스트(test_level_curve_grows_and_matches_web)와 같은 값
export function _selfCheck() {
  const ok = [1, 2, 10, 50].map(xpToNext).join() === "60,153,1343,11797" && levelFromXp(60 + 153 + 5).level === 3;
  if (!ok) throw new Error("level curve mismatch with server");
}
