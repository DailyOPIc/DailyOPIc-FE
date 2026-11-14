import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../../assets/Icon";
import { Mascot } from "../../assets/Mascot";
import { EXPRESSIONS } from "../../data/expressions";
import { SENTENCES } from "../../data/sentences";
import { rng, seededShuffle } from "../../lib/challenge";
import { speak } from "../../lib/recorder";
import { play } from "../../lib/sfx";
import { GameTop, type GameProps } from "./common";

/* ───────── 60초 스피드: 시간 안에 최대한 많이 ───────── */

const SPEED_SECONDS = 60;

export function Speed({ seed, onExit, onDone }: GameProps) {
  // 시드로 섞은 순서를 계속 돌린다(60초 안에 다 풀면 처음부터 다시)
  const order = useMemo(() => seededShuffle(EXPRESSIONS, rng(seed)), [seed]);
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(SPEED_SECONDS);
  const [correct, setCorrect] = useState(0);
  const [tried, setTried] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [flash, setFlash] = useState<"ok" | "no" | null>(null);
  const [popup, setPopup] = useState<{ id: number; text: string } | null>(null);
  const done = useRef(false);
  const item = order[i % order.length];

  const options = useMemo(() => {
    const r = rng(seed + i * 104729);
    return seededShuffle([item, ...seededShuffle(EXPRESSIONS.filter((e) => e !== item), r).slice(0, 3)], r);
  }, [item, seed, i]);

  useEffect(() => {
    if (left <= 0) {
      if (!done.current) {
        done.current = true;
        play("fanfare");
        onDone({ mode: "speed", seed, correct, total: Math.max(tried, 1), score, bestCombo, extra: `${tried}문제 풀이` });
      }
      return;
    }
    const id = window.setTimeout(() => setLeft((v) => Math.max(0, v - 0.1)), 100);
    if (left < 10.05 && left > 9.95) play("key", { rate: 0.6 });
    return () => clearTimeout(id);
  }, [left, correct, tried, score, bestCombo, seed, onDone]);

  const choose = useCallback(
    (n: number) => {
      if (left <= 0 || flash) return;
      setTried((t) => t + 1);
      if (options[n] === item) {
        const c = combo + 1;
        const gained = 100 + Math.min(c, 10) * 10;
        setCombo(c);
        setBestCombo((b) => Math.max(b, c));
        setCorrect((v) => v + 1);
        setScore((v) => v + gained);
        setPopup({ id: Date.now(), text: `+${gained}` });
        play("combo", { rate: 1 + Math.min(c, 10) * 0.05 });
        setFlash("ok");
      } else {
        setCombo(0);
        setLeft((v) => Math.max(0, v - 3)); // 오답은 3초 감점
        setPopup({ id: Date.now(), text: "-3초" });
        play("wrong", { volume: 0.5 });
        setFlash("no");
      }
      window.setTimeout(() => {
        setFlash(null);
        setI((v) => v + 1);
      }, 260);
    },
    [left, flash, options, item, combo],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key) - 1;
      if (n >= 0 && n < 4) choose(n);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choose]);

  return (
    <div className="lesson">
      <GameTop
        onExit={onExit}
        progress={left / SPEED_SECONDS}
        combo={combo}
        right={
          <span className={`clock${left < 10 ? " hurry" : ""}`}>
            <Icon name="timer" size={22} /> {Math.ceil(left)}
          </span>
        }
      />
      <main className="lesson-body">
        <div className="speed-score">
          <span>
            <Icon name="bolt" size={26} /> {score}
          </span>
          {popup && (
            <em key={popup.id} className={popup.text.startsWith("-") ? "minus" : undefined}>
              {popup.text}
            </em>
          )}
        </div>
        <button className={`quiz-word speed${flash === "ok" ? " ok" : flash === "no" ? " no" : ""}`} key={i} onClick={() => speak(item.en)}>
          {item.en}
        </button>
        <div className="quiz-options">
          {options.map((o, n) => (
            <button key={o.en + i} className="quiz-opt" onClick={() => choose(n)} style={{ animationDelay: `${n * 40}ms` }}>
              <kbd>{n + 1}</kbd>
              {o.ko}
            </button>
          ))}
        </div>
        <p className="type-hint">맞히면 +100 · 콤보 보너스, 틀리면 -3초</p>
      </main>
    </div>
  );
}

/* ───────── 문장 조립: 블록을 순서대로 눌러 문장 완성 ───────── */

type Tile = { id: number; w: string };

export function Build({ seed, onExit, onDone }: GameProps) {
  const items = useMemo(() => seededShuffle(SENTENCES, rng(seed)).slice(0, 6), [seed]);
  const [i, setI] = useState(0);
  const [placed, setPlaced] = useState<Tile[]>([]);
  const [checked, setChecked] = useState<null | boolean>(null);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [correct, setCorrect] = useState(0);
  const item = items[i];
  const words = useMemo(() => item.en.split(" "), [item]);
  const bank = useMemo(() => seededShuffle(words.map((w, id) => ({ id, w })), rng(seed + i * 31)), [words, seed, i]);
  const placedIds = new Set(placed.map((t) => t.id));

  const put = (t: Tile) => {
    if (checked !== null) return;
    play("key", { volume: 0.5, rate: 0.9 + placed.length * 0.03 });
    setPlaced((p) => [...p, t]);
  };
  const take = (t: Tile) => {
    if (checked !== null) return;
    play("tap", { volume: 0.4 });
    setPlaced((p) => p.filter((x) => x.id !== t.id));
  };

  const submit = () => {
    if (checked !== null) {
      if (i + 1 >= items.length) {
        onDone({ mode: "build", seed, correct, total: items.length, score: correct * 150 + bestCombo * 30, bestCombo });
      } else {
        setI(i + 1);
        setPlaced([]);
        setChecked(null);
      }
      return;
    }
    // 같은 단어가 두 번 나오는 문장도 있으니 위치가 아닌 '글자'로 비교
    const ok = placed.map((t) => t.w).join(" ") === item.en;
    setChecked(ok);
    if (ok) {
      const c = combo + 1;
      setCombo(c);
      setBestCombo((b) => Math.max(b, c));
      setCorrect((v) => v + 1);
      play("correct", { rate: 1 + Math.min(c, 8) * 0.05 });
      speak(item.en);
    } else {
      setCombo(0);
      play("wrong", { volume: 0.5 });
    }
  };

  return (
    <div className="lesson">
      <GameTop onExit={onExit} progress={i / items.length} combo={combo} />
      <main className="lesson-body" key={i}>
        <div className="talk-row">
          <Mascot mood={checked === null ? "think" : checked ? "happy" : "sad"} size={84} />
          <p className="talk-bubble">{item.ko}</p>
        </div>
        <div className={`build-line${checked === true ? " ok" : checked === false ? " bad" : ""}`} aria-label="내가 만든 문장">
          {placed.length === 0 && <span className="build-placeholder">아래 블록을 순서대로 눌러 문장을 만들어요</span>}
          {placed.map((t) => (
            <button key={t.id} className="tile in" onClick={() => take(t)}>
              {t.w}
            </button>
          ))}
        </div>
        <div className="build-bank">
          {bank.map((t, n) => (
            <button
              key={t.id}
              className={`tile${placedIds.has(t.id) ? " used" : ""}`}
              disabled={placedIds.has(t.id) || checked !== null}
              onClick={() => put(t)}
              style={{ animationDelay: `${n * 30}ms` }}
            >
              {t.w}
            </button>
          ))}
        </div>
        {checked === false && (
          <div className="answer-reveal">
            <b>{item.en}</b>
          </div>
        )}
      </main>
      <footer className="lesson-bar">
        <button className="btn btn-ghost" onClick={() => setPlaced([])} disabled={checked !== null || placed.length === 0}>
          다시 놓기
        </button>
        <button className="btn btn-primary" onClick={submit} disabled={checked === null && placed.length < words.length}>
          {checked === null ? "확인" : i + 1 >= items.length ? "결과 보기" : "다음"}
        </button>
      </footer>
    </div>
  );
}

/* ───────── 빈칸 채우기: 문장에 맞는 연결어 고르기 ───────── */

export function Fill({ seed, onExit, onDone }: GameProps) {
  const items = useMemo(() => seededShuffle(SENTENCES, rng(seed)).slice(0, 10), [seed]);
  const [i, setI] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [picked, setPicked] = useState<string | null>(null);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [correct, setCorrect] = useState(0);
  const item = items[i];
  const options = useMemo(() => seededShuffle([item.blank, ...item.options], rng(seed + i * 97)), [item, seed, i]);
  const [before, after] = useMemo(() => {
    const at = item.en.indexOf(item.blank);
    return [item.en.slice(0, at), item.en.slice(at + item.blank.length)];
  }, [item]);

  const choose = useCallback(
    (o: string) => {
      if (picked) return;
      setPicked(o);
      const ok = o === item.blank;
      const nh = ok ? hearts : hearts - 1;
      const nc = ok ? correct + 1 : correct;
      const c = ok ? combo + 1 : 0;
      const best = Math.max(bestCombo, c);
      setCombo(c);
      setBestCombo(best);
      setCorrect(nc);
      setHearts(nh);
      if (ok) {
        play(c >= 3 ? "combo" : "correct", { rate: 1 + Math.min(c, 8) * 0.05 });
        speak(item.en);
      } else play("lose");
      window.setTimeout(() => {
        if (nh <= 0 || i + 1 >= items.length) {
          onDone({ mode: "fill", seed, correct: nc, total: items.length, score: nc * 100 + best * 20, bestCombo: best, extra: nh <= 0 ? "하트 소진" : undefined });
        } else {
          setI(i + 1);
          setPicked(null);
        }
      }, ok ? 1100 : 1500);
    },
    [picked, item, hearts, correct, combo, bestCombo, i, items.length, seed, onDone],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key) - 1;
      if (n >= 0 && n < 4) choose(options[n]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choose, options]);

  return (
    <div className="lesson">
      <GameTop onExit={onExit} progress={i / items.length} hearts={hearts} combo={combo} />
      <main className="lesson-body" key={i}>
        <p className="quiz-kind">빈칸에 들어갈 표현은?</p>
        <p className="fill-sentence">
          {before}
          <span className={`blank${picked ? (picked === item.blank ? " ok" : " no") : ""}`}>{picked ? item.blank : " ".repeat(8)}</span>
          {after}
        </p>
        <p className="fill-ko">{item.ko}</p>
        <div className="quiz-options">
          {options.map((o, n) => {
            const state = !picked ? "" : o === item.blank ? " right" : o === picked ? " wrong" : " dim";
            return (
              <button key={o} className={`quiz-opt${state}`} onClick={() => choose(o)} style={{ animationDelay: `${n * 60}ms` }}>
                <kbd>{n + 1}</kbd>
                {o}
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}
