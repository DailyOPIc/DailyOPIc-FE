import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../../assets/Icon";
import { Mascot } from "../../assets/Mascot";
import type { Expression } from "../../data/expressions";
import { rng, seededShuffle } from "../../lib/challenge";
import { freshFirst, gameExpressions } from "../../lib/gamePool";
import { speak } from "../../lib/recorder";
import { play } from "../../lib/sfx";
import { clean, GameTop, type GameProps } from "./common";

/* ───────── 1. 타자 연습 ───────── */

export function Typing({ seed, onExit, onDone }: GameProps) {
  const items = useMemo(() => freshFirst(gameExpressions(), seed).slice(0, 8), [seed]);
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState("");
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [flash, setFlash] = useState<"ok" | null>(null);
  const keys = useRef({ ok: 0, total: 0, chars: 0, started: 0 });
  const input = useRef<HTMLInputElement>(null);
  const target = items[i].en;

  useEffect(() => input.current?.focus(), [i]);

  const cpm = () => {
    const mins = (Date.now() - keys.current.started) / 60000;
    return mins > 0 ? Math.round(keys.current.chars / mins) : 0;
  };

  const onChange = (value: string) => {
    if (!keys.current.started) keys.current.started = Date.now();
    if (value.length > typed.length) {
      const ch = value[value.length - 1];
      const ok = target[value.length - 1]?.toLowerCase() === ch.toLowerCase();
      keys.current.total++;
      if (ok) keys.current.ok++;
      play(ok ? "key" : "wrong", { volume: ok ? 0.35 : 0.25, rate: ok ? 0.9 + Math.random() * 0.2 : 1.4 });
    }
    setTyped(value);
    if (value.toLowerCase() === target.toLowerCase()) {
      keys.current.chars += target.length;
      const c = combo + 1;
      setCombo(c);
      setBestCombo((b) => Math.max(b, c));
      play("combo", { rate: 1 + Math.min(c, 8) * 0.06 });
      setFlash("ok");
      window.setTimeout(() => {
        setFlash(null);
        setTyped("");
        if (i + 1 >= items.length) {
          const acc = keys.current.total ? keys.current.ok / keys.current.total : 0;
          onDone({ mode: "typing", seed, correct: Math.round(acc * items.length), total: items.length, score: cpm(), bestCombo: Math.max(bestCombo, c), extra: `${Math.round(acc * 100)}% 정확도` });
        } else setI(i + 1);
      }, 550);
    }
  };

  const acc = keys.current.total ? Math.round((keys.current.ok / keys.current.total) * 100) : 100;
  return (
    <div className="lesson">
      <GameTop onExit={onExit} progress={i / items.length} combo={combo} />
      <main className="lesson-body" onClick={() => input.current?.focus()}>
        <div className="typing-stats">
          <span>
            <b>{cpm()}</b>타/분
          </span>
          <span>
            <b>{acc}</b>% 정확도
          </span>
          <span>
            <b>
              {i + 1}/{items.length}
            </b>
          </span>
        </div>
        <div className={`type-target${flash === "ok" ? " ok" : ""}`} aria-label={target}>
          {target.split("").map((ch, n) => {
            const t = typed[n];
            const state = t === undefined ? (n === typed.length ? "cursor" : "") : t.toLowerCase() === ch.toLowerCase() ? "hit" : "miss";
            return (
              <span key={n} className={`tc ${state}${ch === " " ? " sp" : ""}`}>
                {ch}
              </span>
            );
          })}
        </div>
        <p className={`type-meaning${flash ? " show" : ""}`}>{items[i].ko}</p>
        <input
          ref={input}
          className="type-input"
          value={typed}
          onChange={(e) => onChange(e.target.value)}
          maxLength={target.length}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="next"
          placeholder="여기에 그대로 입력"
          aria-label="따라 입력"
        />
        <p className="type-hint">대소문자는 상관없어요 · 틀린 글자는 지우고 다시</p>
      </main>
    </div>
  );
}

/* ───────── 2. 뜻 맞추기 ───────── */

const QUIZ_SECONDS = 12;

export function Meaning({ seed, onExit, onDone }: GameProps) {
  const pool = useMemo(gameExpressions, []);
  const items = useMemo(() => freshFirst(pool, seed).slice(0, 10), [pool, seed]);
  const [i, setI] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [left, setLeft] = useState(QUIZ_SECONDS);
  const reverse = i % 2 === 1; // 홀수 문제는 한국어 → 영어
  const item = items[i];

  const options = useMemo(() => {
    const r = rng(seed + i * 7919);
    const others = seededShuffle(pool.filter((e) => e !== item), r).slice(0, 3);
    return seededShuffle([item, ...others], r);
  }, [item, seed, i]);
  const answer = options.indexOf(item);

  const advance = useCallback(
    (nextHearts: number, nextCorrect: number, nextBest: number) => {
      window.setTimeout(() => {
        if (nextHearts <= 0 || i + 1 >= items.length) {
          onDone({ mode: "meaning", seed, correct: nextCorrect, total: items.length, score: nextCorrect * 100 + nextBest * 20, bestCombo: nextBest, extra: nextHearts <= 0 ? "하트 소진" : undefined });
        } else {
          setI(i + 1);
          setPicked(null);
          setLeft(QUIZ_SECONDS);
        }
      }, 900);
    },
    [i, items.length, onDone],
  );

  const choose = useCallback(
    (n: number) => {
      if (picked !== null) return;
      setPicked(n);
      if (n === answer) {
        const c = combo + 1;
        const best = Math.max(bestCombo, c);
        setCombo(c);
        setBestCombo(best);
        setCorrect(correct + 1);
        play(c >= 3 ? "combo" : "correct", { rate: 1 + Math.min(c, 8) * 0.05 });
        advance(hearts, correct + 1, best);
      } else {
        setCombo(0);
        setHearts(hearts - 1);
        play("lose");
        advance(hearts - 1, correct, bestCombo);
      }
    },
    [picked, answer, combo, bestCombo, correct, hearts, advance],
  );

  // 시간 제한
  useEffect(() => {
    if (picked !== null) return;
    if (left <= 0) {
      choose(-1);
      return;
    }
    const id = window.setTimeout(() => setLeft((v) => v - 0.1), 100);
    return () => clearTimeout(id);
  }, [left, picked, choose]);

  // PC 숫자키 1~4
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
      <GameTop onExit={onExit} progress={i / items.length} hearts={hearts} combo={combo} />
      <main className="lesson-body" key={i}>
        <div className="timer-bar" aria-hidden="true">
          <span style={{ transform: `scaleX(${Math.max(0, left / QUIZ_SECONDS)})` }} className={left < 4 ? "hurry" : undefined} />
        </div>
        <p className="quiz-kind">{reverse ? "이 뜻의 영어 표현은?" : "이 표현의 뜻은?"}</p>
        <button className="quiz-word" onClick={() => !reverse && speak(item.en)} disabled={reverse}>
          {reverse ? item.ko : item.en}
          {!reverse && <Icon name="soundOn" size={26} />}
        </button>
        <div className="quiz-options">
          {options.map((o, n) => {
            const state = picked === null ? "" : n === answer ? " right" : n === picked ? " wrong" : " dim";
            return (
              <button key={o.en} className={`quiz-opt${state}`} onClick={() => choose(n)} style={{ animationDelay: `${n * 60}ms` }}>
                <kbd>{n + 1}</kbd>
                {reverse ? o.en : o.ko}
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}

/* ───────── 3. 받아쓰기 ───────── */

export function Dictation({ seed, onExit, onDone }: GameProps) {
  const items = useMemo(() => freshFirst(gameExpressions().filter((e) => e.en.split(" ").length <= 6), seed).slice(0, 8), [seed]);
  const [i, setI] = useState(0);
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState<null | boolean>(null);
  const [hint, setHint] = useState(false);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [correct, setCorrect] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const item = items[i];

  useEffect(() => {
    const t = window.setTimeout(() => speak(item.en), 350);
    input.current?.focus();
    return () => clearTimeout(t);
  }, [item]);

  const submit = () => {
    if (checked !== null) {
      if (i + 1 >= items.length) {
        onDone({ mode: "dictation", seed, correct, total: items.length, score: correct * 100 + bestCombo * 20, bestCombo });
      } else {
        setI(i + 1);
        setValue("");
        setChecked(null);
        setHint(false);
      }
      return;
    }
    if (!value.trim()) return;
    const ok = clean(value) === clean(item.en);
    setChecked(ok);
    if (ok) {
      const c = combo + (hint ? 0 : 1);
      setCombo(c);
      setBestCombo((b) => Math.max(b, c));
      setCorrect(correct + 1);
      play("correct", { rate: 1 + Math.min(c, 8) * 0.05 });
    } else {
      setCombo(0);
      play("wrong", { volume: 0.5 });
    }
  };

  const hintText = item.en
    .split(" ")
    .map((w) => w[0] + w.slice(1).replace(/[a-z]/gi, "·"))
    .join(" ");

  return (
    <div className="lesson">
      <GameTop onExit={onExit} progress={i / items.length} combo={combo} />
      <main className="lesson-body" key={i}>
        <div className="talk-row">
          <Mascot mood={checked === null ? "listen" : checked ? "happy" : "sad"} size={92} />
          <p className="talk-bubble">{checked === null ? "잘 듣고 그대로 입력해 보세요" : checked ? "정답! 귀가 좋은데요?" : "아까워요! 정답을 확인해 봐요"}</p>
        </div>
        <div className="listen-buttons">
          <button className="speak-btn" onClick={() => speak(item.en)} aria-label="다시 듣기">
            <Icon name="speaker" size={32} />
          </button>
          <button
            className="speak-btn slow"
            onClick={() => speak(item.en, { rate: 0.6 })}
            aria-label="천천히 듣기"
          >
            <span className="slow-label">0.6×</span>
          </button>
          <button className="btn btn-ghost" onClick={() => setHint(true)} disabled={hint || checked !== null}>
            힌트
          </button>
        </div>
        {hint && <p className="hint-text">{hintText}</p>}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            ref={input}
            className={`type-input${checked === true ? " ok" : checked === false ? " bad" : ""}`}
            value={value}
            onChange={(e) => checked === null && setValue(e.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="done"
            placeholder="들은 표현을 입력"
            aria-label="받아쓰기 입력"
          />
        </form>
        {checked !== null && (
          <div className={`answer-reveal${checked ? " ok" : ""}`}>
            <b>{item.en}</b>
            <span>{item.ko}</span>
            {item.tip && <small>{item.tip}</small>}
          </div>
        )}
      </main>
      <footer className="lesson-bar">
        <span className="bar-note">
          {i + 1} / {items.length}
        </span>
        <button className="btn btn-primary" onClick={submit} disabled={checked === null && !value.trim()}>
          {checked === null ? "확인" : i + 1 >= items.length ? "결과 보기" : "다음"}
        </button>
      </footer>
    </div>
  );
}

/* ───────── 4. 단어 비 ───────── */

type Drop = { id: number; e: Expression; x: number; y: number; speed: number; popped?: number };

export function Rain({ seed, onExit, onDone }: GameProps) {
  const words = useMemo(() => gameExpressions().filter((e) => e.en.length <= 18), []);
  const [, setTick] = useState(0);
  const [value, setValue] = useState("");
  const [hearts, setHearts] = useState(3);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const state = useRef({ rand: rng(seed), drops: [] as Drop[], nextId: 1, last: 0, spawnIn: 0, elapsed: 0, popped: 0, bestCombo: 0, over: false });
  const input = useRef<HTMLInputElement>(null);
  const field = useRef<HTMLDivElement>(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    input.current?.focus();
    // 개발 모드(StrictMode)는 효과를 두 번 실행한다: 정리 때 세운 종료 표시를 다시 내려야 루프가 돈다.
    state.current.over = false;
    state.current.last = 0;
    state.current.rand = rng(seed);
    let raf = 0;
    const loop = (t: number) => {
      const s = state.current;
      if (s.over) return;
      const dt = s.last ? Math.min(0.05, (t - s.last) / 1000) : 0;
      s.last = t;
      s.elapsed += dt;
      s.spawnIn -= dt;
      const level = 1 + s.elapsed / 25; // 25초마다 한 단계씩 빨라짐
      if (s.spawnIn <= 0) {
        // 같은 시드면 같은 표현이 같은 자리 · 같은 속도로 떨어진다
        const e = words[Math.floor(s.rand() * words.length)];
        s.drops.push({ id: s.nextId++, e, x: 6 + s.rand() * 62, y: -8, speed: (7 + s.rand() * 4) * level });
        s.spawnIn = Math.max(0.9, 2.6 / level);
      }
      let lost = 0;
      s.drops = s.drops.filter((d) => {
        if (d.popped !== undefined) return (d.popped += dt) < 0.35; // 터지는 효과 0.35초
        d.y += d.speed * dt;
        if (d.y > 92) {
          lost++;
          return false;
        }
        return true;
      });
      if (lost) {
        play("lose");
        setCombo(0);
        setHearts((h) => {
          const next = h - lost;
          if (next <= 0 && !s.over) {
            s.over = true;
            doneRef.current({ mode: "rain", seed, correct: s.popped, total: s.popped + 3, score: s.popped * 100 + s.bestCombo * 30, bestCombo: s.bestCombo, extra: `${Math.round(s.elapsed)}초 생존` });
          }
          return next;
        });
      }
      setTick((v) => v + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      state.current.over = true;
      cancelAnimationFrame(raf);
    };
  }, [words]);

  const onInput = (v: string) => {
    setValue(v);
    const s = state.current;
    const hit = s.drops.find((d) => d.popped === undefined && clean(d.e.en) === clean(v));
    if (hit) {
      hit.popped = 0;
      s.popped++;
      setValue("");
      setScore((x) => x + 100 + combo * 10);
      setCombo((c) => {
        const n = c + 1;
        s.bestCombo = Math.max(s.bestCombo, n);
        play("combo", { rate: 1 + Math.min(n, 10) * 0.05 });
        return n;
      });
    } else if (v.length) play("key", { volume: 0.25, rate: 0.9 + Math.random() * 0.2 });
  };

  const s = state.current;
  return (
    <div className="lesson rain-game">
      <GameTop onExit={onExit} progress={Math.min(1, s.elapsed / 120)} hearts={hearts} combo={combo} />
      <div className="rain-bar">
        <input
          ref={input}
          className="type-input rain-input"
          value={value}
          onChange={(e) => onInput(e.target.value)}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          placeholder="떨어지는 표현을 입력"
          aria-label="단어 비 입력"
        />
        <span className="rain-score">
          <Icon name="bolt" size={22} /> {score}
        </span>
      </div>
      <div className="rain-field" ref={field} onClick={() => input.current?.focus()}>
        {s.drops.map((d) => (
          <span
            key={d.id}
            className={`raindrop${d.popped !== undefined ? " popped" : value && clean(d.e.en).startsWith(clean(value)) ? " targeted" : ""}`}
            style={{ left: `${d.x}%`, top: `${d.y}%` }}
          >
            {d.e.en}
          </span>
        ))}
        <div className="rain-ground" />
      </div>
    </div>
  );
}
