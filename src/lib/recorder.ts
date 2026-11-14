import { useCallback, useEffect, useRef, useState } from "react";

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

export const speechSupported = Boolean(Ctor && typeof MediaRecorder !== "undefined");

export const MAX_ANSWER_SECONDS = 180;

export type Recording = { transcript: string; audio: Blob | null };

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
  // 180초가 끝나 자동으로 멈췄을 때 화면에 결과를 넘기는 통로
  const onAutoStop = useRef<((r: Recording) => void) | null>(null);

  const cleanup = useCallback(() => {
    active.current = false;
    window.clearInterval(timer.current);
    recognition.current?.stop();
    recorder.current?.stream.getTracks().forEach((t) => t.stop());
    setListening(false);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const stop = useCallback(
    () =>
      new Promise<Recording>((resolve) => {
        if (!active.current) return resolve({ transcript: finalText.current.trim(), audio: null });
        pendingStop.current = resolve;
        const rec = recorder.current;
        cleanup();
        if (!rec || rec.state === "inactive") {
          resolve({ transcript: finalText.current.trim(), audio: null });
        } else {
          rec.stop(); // onstop에서 resolve
        }
      }),
    [cleanup],
  );

  const start = useCallback(async () => {
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
    const rec = new MediaRecorder(stream);
    rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    rec.onstop = () => {
      const audio = chunks.current.length ? new Blob(chunks.current, { type: rec.mimeType }) : null;
      pendingStop.current?.({ transcript: finalText.current.trim(), audio });
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

    setRemaining(MAX_ANSWER_SECONDS);
    setListening(true);
    const startedAt = Date.now();
    timer.current = window.setInterval(() => {
      const left = MAX_ANSWER_SECONDS - Math.floor((Date.now() - startedAt) / 1000);
      setRemaining(Math.max(0, left));
      if (left <= 0) void stop().then((result) => onAutoStop.current?.(result));
    }, 250);
  }, [stop]);

  return { listening, liveText, remaining, error, start, stop, onAutoStop };
}

/** 질문 읽어주기(브라우저 내장 TTS). iOS의 AVSpeechSynthesizer 자리. */
export function speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}
