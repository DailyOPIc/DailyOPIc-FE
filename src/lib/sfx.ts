// 효과음: 파일 없이 Web Audio로 짧게 합성한다. 끄기 설정은 기기에 저장.
let ctx: AudioContext | null = null;
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

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.12) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, ctx.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + dur + 0.02);
}

function play(notes: [number, number, number, OscillatorType?][]) {
  if (isMuted()) return;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  for (const [f, s, d, t] of notes) tone(f, s, d, t);
}

export const sfx = {
  tap: () => play([[660, 0, 0.06, "triangle"]]),
  start: () => play([[523, 0, 0.08], [784, 0.08, 0.12]]),
  stop: () => play([[784, 0, 0.08], [523, 0.08, 0.12]]),
  success: () => play([[523, 0, 0.12], [659, 0.1, 0.12], [784, 0.2, 0.22]]),
  goal: () => play([[523, 0, 0.1], [659, 0.1, 0.1], [784, 0.2, 0.1], [1047, 0.3, 0.35]]),
  error: () => play([[220, 0, 0.18, "square"]]),
};
