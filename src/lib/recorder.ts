import { useCallback, useEffect, useRef, useState } from "react";
import { callNative, nativeSpeech, SPEECH_EVENT } from "./native";

// 브라우저 내장 음성 인식(Web Speech API). 타입이 표준 lib에 없어 최소한만 선언한다.
type RecognitionEvent = { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start(): void;
  stop(): void;
};
type RecognitionCtor = new () => Recognition;

const Ctor: RecognitionCtor | undefined =
  (window as unknown as { SpeechRecognition?: RecognitionCtor }).SpeechRecognition ??
  (window as unknown as { webkitSpeechRecognition?: RecognitionCtor }).webkitSpeechRecognition;

export const speechSupported = nativeSpeech || Boolean(Ctor && typeof MediaRecorder !== "undefined");

export const MAX_ANSWER_SECONDS = 180;

export type Recording = { transcript: string; audio: Blob | null; seconds: number };

/** 녹음과 실시간 전사를 함께 돌린다. stop()이 최종 전사와 오디오를 돌려준다. */
export function useAnswerRecorder() {
  const [listening, setListening] = useState(false);
  const [liveText, setLiveText] = useState("");
  const [remaining, setRemaining] = useState(MAX_ANSWER_SECONDS);
  const [error, setError] = useState<string | null>(null);

  const finalText = useRef("");
  const recognition = useRef<Recognition | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const active = useRef(false);
  const timer = useRef<number>();
  const pendingStop = useRef<((r: Recording) => void) | null>(null);
  const startedAt = useRef(0);
  const elapsed = () => (startedAt.current ? (Date.now() - startedAt.current) / 1000 : 0);
  // 180초가 끝나 자동으로 멈췄을 때 화면에 결과를 넘기는 통로
  const onAutoStop = useRef<((r: Recording) => void) | null>(null);

  const cleanup = useCallback(() => {
    active.current = false;
    window.clearInterval(timer.current);
    recognition.current?.stop();
    recorder.current?.stream.getTracks().forEach((t) => t.stop());
    window.removeEventListener(SPEECH_EVENT, onNativeText);
    setListening(false);
  }, []);

  useEffect(
    () => () => {
      // 화면을 떠나면 앱 녹음도 버린다(stop으로 결과를 받는 중이 아닐 때만 의미가 있다)
      if (nativeSpeech && active.current) void callNative("speechCancel").catch(() => {});
      cleanup();
    },
    [cleanup],
  );

  const stop = useCallback(
    () =>
      new Promise<Recording>((resolve) => {
        if (!active.current) return resolve({ transcript: finalText.current.trim(), audio: null, seconds: elapsed() });
        if (nativeSpeech) {
          cleanup();
          const seconds = elapsed();
          void callNative<{ transcript: string; audio?: string }>("speechStop")
            .then((r) => resolve({ transcript: r.transcript.trim(), audio: r.audio ? base64Blob(r.audio, "audio/mp4") : null, seconds }))
            .catch(() => resolve({ transcript: finalText.current.trim(), audio: null, seconds }));
          return;
        }
        pendingStop.current = resolve;
        const rec = recorder.current;
        cleanup();
        const seconds = elapsed();
        if (!rec || rec.state === "inactive") {
          resolve({ transcript: finalText.current.trim(), audio: null, seconds });
        } else {
          rec.stop(); // onstop에서 resolve
        }
      }),
    [cleanup],
  );

  const beginTimer = useCallback(() => {
    setRemaining(MAX_ANSWER_SECONDS);
    setListening(true);
    startedAt.current = Date.now();
    timer.current = window.setInterval(() => {
      const left = MAX_ANSWER_SECONDS - Math.floor((Date.now() - startedAt.current) / 1000);
      setRemaining(Math.max(0, left));
      if (left <= 0) void stopRef.current().then((result) => onAutoStop.current?.(result));
    }, 250);
  }, []);
  const stopRef = useRef(stop);
  stopRef.current = stop;

  const start = useCallback(async () => {
    if (nativeSpeech) {
      setError(null);
      setLiveText("");
      finalText.current = "";
      onNativeText = (e: Event) => {
        finalText.current = String((e as CustomEvent).detail ?? "");
        setLiveText(finalText.current);
      };
      window.addEventListener(SPEECH_EVENT, onNativeText);
      try {
        await callNative("speechStart");
      } catch (e) {
        window.removeEventListener(SPEECH_EVENT, onNativeText);
        setError(e instanceof Error && e.message ? e.message : "마이크 · 음성 인식 권한이 필요해요. 설정 앱에서 허용해 주세요.");
        return;
      }
      active.current = true;
      beginTimer();
      return;
    }
    if (!Ctor) {
      setError("이 브라우저는 음성 인식을 지원하지 않아요. Chrome · Safari · Edge에서 이용해 주세요.");
      return;
    }
    setError(null);
    setLiveText("");
    finalText.current = "";
    chunks.current = [];
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("마이크 권한이 필요해요. 브라우저 주소창의 권한 설정에서 마이크를 허용해 주세요.");
      return;
    }
    // 32kbps: 15문항(최대 180초씩)을 모의고사 업로드 한도(30MB) 안에 담는다
    const rec = new MediaRecorder(stream, { audioBitsPerSecond: 32_000 });
    rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    rec.onstop = () => {
      const audio = chunks.current.length ? new Blob(chunks.current, { type: rec.mimeType }) : null;
      pendingStop.current?.({ transcript: finalText.current.trim(), audio, seconds: elapsed() });
      pendingStop.current = null;
    };
    recorder.current = rec;
    rec.start();

    const r = new Ctor();
    r.lang = "en-US";
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let interim = "";
      for (let n = e.resultIndex; n < e.results.length; n++) {
        const res = e.results[n];
        if (res.isFinal) finalText.current += `${res[0].transcript.trim()} `;
        else interim += res[0].transcript;
      }
      setLiveText(`${finalText.current}${interim}`.trim());
    };
    // Safari 등은 침묵 뒤에 인식을 스스로 끝낸다. 녹음 중이면 이어서 다시 듣는다.
    r.onend = () => {
      if (active.current) r.start();
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed") setError("마이크 · 음성 인식 권한이 필요해요.");
    };
    recognition.current = r;
    active.current = true;
    r.start();
    beginTimer();
  }, [beginTimer]);

  return { listening, liveText, remaining, error, start, stop, onAutoStop };
}

// 앱이 보내는 실시간 전사 리스너(한 번에 녹음 하나라 모듈에 하나만 둔다)
let onNativeText: (e: Event) => void = () => {};

function base64Blob(b64: string, type: string): Blob {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

// ── 질문 읽어주기(브라우저 내장 TTS). iOS의 AVSpeechSynthesizer 자리 ──
// 음성을 지정하지 않으면 브라우저가 시스템 기본 음성(맥은 한국어 '유나' 등)으로 영어를 읽어
// 발음이 이상해진다. 자연스러운 미국 영어 음성을 직접 고른다.
const PREFERRED = [
  "Google US English",
  "Microsoft Aria Online",
  "Microsoft Jenny Online",
  "Microsoft Guy Online",
  "Samantha",
  "Ava",
  "Allison",
  "Susan",
  "Alex",
];
// macOS의 장난감 · 효과 음성(로봇 같은 소리)
const NOVELTY = /albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|kathy|grandma|grandpa|eddy|flo|reed|rocko|sandy|shelley/i;

let chosen: SpeechSynthesisVoice | null = null;

export function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const english = voices.filter((v) => /^en[-_]US/i.test(v.lang) && !NOVELTY.test(v.name));
  const score = (v: SpeechSynthesisVoice) => {
    const i = PREFERRED.findIndex((p) => v.name.startsWith(p));
    let s = i === -1 ? 100 : i;
    if (/natural|neural|enhanced|premium|online/i.test(v.name)) s -= 50;
    if (v.localService === false) s -= 5; // 클라우드 음성이 대체로 더 자연스럽다
    return s;
  };
  return english.sort((a, b) => score(a) - score(b))[0] ?? voices.find((v) => /^en/i.test(v.lang)) ?? null;
}

function ensureVoice() {
  if (!("speechSynthesis" in window)) return;
  if (!chosen) chosen = pickVoice(window.speechSynthesis.getVoices());
}
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  // 음성 목록은 비동기로 채워진다(Chrome)
  window.speechSynthesis.addEventListener?.("voiceschanged", () => {
    chosen = pickVoice(window.speechSynthesis.getVoices());
  });
  ensureVoice();
}

export function speak(text: string, { rate = 0.95 } = {}) {
  if (!("speechSynthesis" in window)) return;
  ensureVoice();
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  if (chosen) utterance.voice = chosen;
  utterance.rate = rate;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}
