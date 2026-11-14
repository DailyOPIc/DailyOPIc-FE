// 효과음: public/sfx/*.mp3(scripts/make_sfx.py로 직접 합성)를 Web Audio로 미리 풀어 두고 지연 없이 재생.
const NAMES = ["tap", "select", "correct", "wrong", "coin", "combo", "fanfare", "streak", "rec_start", "rec_stop", "key", "lose", "start"] as const;
export type Sfx = (typeof NAMES)[number];

let ctx: AudioContext | null = null;
const buffers = new Map<Sfx, AudioBuffer>();
let loading: Promise<void> | null = null;
const MUTE_KEY = "dailyopic:muted";

export function isMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* noop */
  }
}

function load() {
  if (loading) return loading;
  ctx ??= new AudioContext();
  const c = ctx;
  loading = Promise.all(
    NAMES.map(async (name) => {
      try {
        const res = await fetch(`/sfx/${name}.mp3`);
        buffers.set(name, await c.decodeAudioData(await res.arrayBuffer()));
      } catch {
        /* 소리 하나 실패해도 앱은 계속 */
      }
    }),
  ).then(() => undefined);
  return loading;
}

/** rate>1이면 음이 높아진다(콤보가 쌓일수록 올라가게). */
export function play(name: Sfx, { rate = 1, volume = 0.7 } = {}) {
  if (isMuted()) return;
  void load();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();
  const buffer = buffers.get(name);
  if (!buffer) return;
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  src.buffer = buffer;
  src.playbackRate.value = rate;
  gain.gain.value = volume;
  src.connect(gain).connect(ctx.destination);
  src.start();
}

/** 첫 사용자 입력 때 불러 두면 이후 재생이 즉시 된다. */
export function warmUp() {
  void load();
}

// 기존 화면 호환(짧은 이름)
export const sfx = {
  tap: () => play("tap", { volume: 0.5 }),
  start: () => play("rec_start"),
  stop: () => play("rec_stop"),
  success: () => play("correct"),
  goal: () => play("fanfare"),
  error: () => play("wrong", { volume: 0.5 }),
};
