import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * MORPH CHAIN: ARCADE (single-file implementation)
 * - Route: /arcade
 * - Modes: 4L / 5L / 6L
 * - Loop: 60s timed run, earn score with valid one-letter morphs
 * - Power-ups: doubleSwap (2 letters next move), timePulse (+10s), hint (suggested position)
 * - Dictionary: server /api/validate authoritative; client has safe fallbacks
 *
 * Tailwind is assumed. Replace colors to match your tokens if needed.
 */

/* ----------------------------- TYPES & CONSTANTS ---------------------------- */

type LengthMode = 4 | 5 | 6;
type PowerupType = "doubleSwap" | "timePulse" | "hint";
type ArcadeState = "idle" | "countdown" | "running" | "paused" | "results";

const TIMER_BY_LEN: Record<LengthMode, number> = { 4: 60, 5: 60, 6: 60 };
const HINT_FLASH_MS = 1200;

const cyan = "#00E6E6";

/* --------------------------------- HELPERS --------------------------------- */

const isAlphaLower = (s: string) => /^[a-z]+$/.test(s);
const sameLength = (a: string, b: string) => a.length === b.length;
const hammingDistance = (a: string, b: string) =>
  a.split("").reduce((d, ch, i) => d + (ch !== b[i] ? 1 : 0), 0);

/** Client-side "maybe" check. Still call the server to be authoritative. */
async function validateWordServer(word: string, len: LengthMode, game: "arcade" | "chain" = "arcade") {
  try {
    const res = await fetch("/api/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, len, game }),
    });
    if (!res.ok) throw new Error("validate failed");
    return (await res.json()) as { ok: boolean; reason?: string };
  } catch {
    // Safe fallback: allow only alpha/len; final enforcement can be added server-side
    return { ok: isAlphaLower(word) && word.length === len };
  }
}

/** Fetch a good starting word from server or use local fallback. */
async function getStartWord(len: LengthMode): Promise<string> {
  try {
    const res = await fetch(`/api/arcade/start?len=${len}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.word && data.word.length === len) return data.word.toLowerCase();
    }
  } catch {}
  // Fallback pools (safe, common words per length)
  const pool4 = ["cold", "warm", "time", "ring", "melt", "bold", "farm", "moth"];
  const pool5 = ["crane", "flint", "spoil", "panel", "plain", "shell", "trick", "grain"];
  const pool6 = ["cinder", "velvet", "pollen", "napkin", "credit", "fabric", "museum", "radius"];
  const pools: Record<LengthMode, string[]> = { 4: pool4, 5: pool5, 6: pool6 };
  const list = pools[len];
  return list[Math.floor(Math.random() * list.length)];
}

/** Optional hint endpoint; returns index to change and suggested letter. */
async function getHint(word: string, len: LengthMode): Promise<{ index: number; letter: string } | null> {
  try {
    const res = await fetch("/api/arcade/hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, len }),
    });
    if (res.ok) return await res.json();
  } catch {}
  // Safe fallback: suggest a random position with a random letter (UX-only)
  const index = Math.floor(Math.random() * len);
  const letter = String.fromCharCode(97 + Math.floor(Math.random() * 26));
  return { index, letter };
}

/* ------------------------------ UI SUBCOMPONENTS --------------------------- */

function LengthToggleSimple({
  value,
  onChange,
}: {
  value: LengthMode;
  onChange: (v: LengthMode) => void;
}) {
  const Button = ({ v }: { v: LengthMode }) => (
    <button
      onClick={() => onChange(v)}
      className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${
        value === v ? "bg-cyan-400 text-slate-900" : "bg-slate-800 text-slate-200"
      }`}
      aria-pressed={value === v}
    >
      {v}L
    </button>
  );
  return (
    <div className="w-full max-w-xs mx-auto flex gap-2" role="tablist" aria-label="Word length">
      <Button v={4} />
      <Button v={5} />
      <Button v={6} />
    </div>
  );
}

function ArcadeHUD({
  length,
  timeLeft,
  score,
  streak,
  powerups,
  onUse,
}: {
  length: LengthMode;
  timeLeft: number;
  score: number;
  streak: number;
  powerups: Partial<Record<PowerupType, number>>;
  onUse: (t: PowerupType) => void;
}) {
  const Slot = ({ t, label, icon }: { t: PowerupType; label: string; icon: string }) => {
    const count = powerups[t] || 0;
    return (
      <button
        onClick={() => count > 0 && onUse(t)}
        className={`relative w-10 h-10 rounded-md flex items-center justify-center ${
          count > 0 ? "bg-cyan-400/20 ring-1 ring-cyan-400 text-cyan-200" : "bg-slate-800 text-slate-500"
        }`}
        title={`${label}${count ? ` (${count})` : ""}`}
      >
        <span className="text-lg">{icon}</span>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 text-[10px] bg-cyan-400 text-slate-900 px-1 py-[1px] rounded">
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="w-full max-w-sm mx-auto grid grid-cols-3 items-center gap-3 mb-4">
      <div className="text-left">
        <div className="text-xs text-slate-400">Score</div>
        <div className="text-xl font-bold text-slate-100">{score}</div>
      </div>
      <div className="text-center">
        <div className="text-xs text-slate-400">Time</div>
        <div className="text-xl font-bold text-slate-100">
          {String(Math.max(0, Math.floor(timeLeft))).padStart(2, "0")}
        </div>
        <div className="h-1 mt-1 bg-slate-800 rounded">
          <div
            className="h-1 rounded bg-cyan-400 transition-[width]"
            style={{ width: `${(timeLeft / TIMER_BY_LEN[length]) * 100}%` }}
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Slot t="doubleSwap" label="Double Swap" icon="🔄" />
        <Slot t="timePulse" label="Time Pulse" icon="⏱️" />
        <Slot t="hint" label="Hint" icon="💡" />
      </div>
      <div className="col-span-3 text-center text-xs text-slate-400 mt-1">
        Streak: <span className="text-cyan-300 font-semibold">{streak}</span>
      </div>
    </div>
  );
}

function CountdownOverlay({ state }: { state: ArcadeState }) {
  const [n, setN] = useState(3);
  useEffect(() => {
    if (state !== "countdown") return;
    setN(3);
    const id = setInterval(() => setN((x) => (x > 1 ? x - 1 : 0)), 700);
    return () => clearInterval(id);
  }, [state]);
  if (state !== "countdown") return null;
  return (
    <div className="fixed inset-0 grid place-items-center bg-black/50 z-30">
      <div className="text-6xl font-black text-cyan-300 animate-pulse">{n || "GO"}</div>
    </div>
  );
}

function ResultsModalArcade({
  open,
  onClose,
  score,
  words,
  streakMax,
  powerUsed,
  length,
}: {
  open: boolean;
  onClose: () => void;
  score: number;
  words: string[];
  streakMax: number;
  powerUsed: Partial<Record<PowerupType, number>>;
  length: LengthMode;
}) {
  if (!open) return null;
  const usedCount =
    (powerUsed.doubleSwap || 0) + (powerUsed.timePulse || 0) + (powerUsed.hint || 0);

  const share = async () => {
    const text = `Morph Chain: Arcade — ${length}L\nScore ${score} • ${words.length} links • ${usedCount} power-ups\nmorphchaingame.com`;
    try {
      await navigator.share?.({ text });
    } catch {
      await navigator.clipboard.writeText(text);
      alert("Copied results to clipboard!");
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/60 grid place-items-center p-4">
      <div className="w-full max-w-sm bg-slate-900 rounded-xl p-5 ring-1 ring-slate-700">
        <div className="text-xl font-bold text-slate-100 mb-1">Run Complete</div>
        <div className="text-slate-300 text-sm mb-3">
          Words: <b>{words.length}</b> • Max streak: <b>{streakMax}</b>
        </div>
        <div className="bg-slate-800 rounded p-3 mb-3">
          <div className="text-4xl font-black text-cyan-300">{score}</div>
          <div className="text-slate-400 text-xs">Score</div>
        </div>
        <div className="text-slate-300 text-sm mb-4">
          Power-ups used:{" "}
          <b>{usedCount}</b>{" "}
          <span className="text-slate-500">
            (🔄{powerUsed.doubleSwap || 0} ⏱️{powerUsed.timePulse || 0} 💡
            {powerUsed.hint || 0})
          </span>
        </div>
        <div className="flex gap-2">
          <button
            className="flex-1 py-2 rounded-md bg-cyan-400 text-slate-900 font-semibold"
            onClick={share}
          >
            Share
          </button>
          <button
            className="flex-1 py-2 rounded-md bg-slate-800 text-slate-200"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="mt-4 text-xs text-slate-500 line-clamp-2">
          {words.join(" → ")}
        </div>
      </div>
    </div>
  );
}

function Board({
  word,
  hintIndex,
  onChangeAt,
  lockedIndex,
}: {
  word: string;
  hintIndex: number | null;
  onChangeAt: (i: number, ch: string) => void;
  lockedIndex?: number | null;
}) {
  return (
    <div className="flex justify-center gap-2 my-4">
      {word.split("").map((ch, i) => {
        const locked = lockedIndex === i;
        const hinted = hintIndex === i;
        return (
          <button
            key={i}
            className={`w-12 h-12 rounded-md grid place-items-center text-xl font-bold
              ${locked ? "bg-slate-700 text-slate-400 ring-1 ring-slate-600" : "bg-slate-800 text-slate-100"}
              ${hinted ? "outline outline-2 outline-cyan-400" : ""}`}
            onClick={() => {
              if (locked) return;
              const next = prompt("Replace with letter a-z:", ch);
              if (!next) return;
              const c = next.trim().toLowerCase();
              if (/^[a-z]$/.test(c)) onChangeAt(i, c);
            }}
            title={locked ? "Locked this turn" : "Tap to change letter"}
          >
            {ch.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------- MAIN PAGE -------------------------------- */

export default function ArcadePage() {
  const [length, setLength] = useState<LengthMode>(4);
  const [state, setState] = useState<ArcadeState>("idle");
  const [timeLeft, setTimeLeft] = useState(TIMER_BY_LEN[4]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [streakMax, setStreakMax] = useState(0);
  const [current, setCurrent] = useState<string>("----");
  const [allowDoubleSwapOnce, setAllowDoubleSwapOnce] = useState(false);
  const [hintIndex, setHintIndex] = useState<number | null>(null);
  const [lockedIndex, setLockedIndex] = useState<number | null>(null);
  const [usedWords, setUsedWords] = useState<string[]>([]);
  const [powerups, setPowerups] = useState<Partial<Record<PowerupType, number>>>({});
  const [powerUsed, setPowerUsed] = useState<Partial<Record<PowerupType, number>>>({});
  const [resultsOpen, setResultsOpen] = useState(false);

  const tickRef = useRef<number | null>(null);
  const lastSubmitAt = useRef<number>(Date.now());

  // Reset when length changes (until running)
  useEffect(() => {
    if (state === "running" || state === "countdown") return;
    setTimeLeft(TIMER_BY_LEN[length]);
    (async () => setCurrent(await getStartWord(length)))();
    setUsedWords([]);
    setScore(0);
    setStreak(0);
    setStreakMax(0);
    setPowerups({});
    setPowerUsed({});
    setHintIndex(null);
    setAllowDoubleSwapOnce(false);
  }, [length, state]);

  // Timer
  useEffect(() => {
    if (state !== "running") return;
    if (tickRef.current) cancelAnimationFrame(tickRef.current);
    const start = performance.now();
    let last = start;
    const loop = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      setTimeLeft((prev) => {
        const next = prev - dt;
        if (next <= 0) {
          setState("results");
          setResultsOpen(true);
          return 0;
        }
        return next;
      });
      tickRef.current = requestAnimationFrame(loop);
    };
    tickRef.current = requestAnimationFrame(loop);
    return () => {
      if (tickRef.current) cancelAnimationFrame(tickRef.current);
      tickRef.current = null;
    };
  }, [state]);

  const canSubmit = useMemo(() => {
    return isAlphaLower(current) && current.length === length;
  }, [current, length]);

  const startRun = async () => {
    setState("countdown");
    setTimeout(() => setState("running"), 2200);
  };

  const addPower = (t: PowerupType) =>
    setPowerups((p) => ({ ...p, [t]: (p[t] || 0) + 1 }));

  const earnOnStreak = () => {
    // every 3 valid morphs under 5s → give random power-up
    const now = Date.now();
    const elapsed = (now - lastSubmitAt.current) / 1000;
    lastSubmitAt.current = now;

    setStreak((s) => {
      const next = s + 1;
      setStreakMax((m) => Math.max(m, next));
      if (next % 3 === 0 && elapsed <= 5) {
        const pool: PowerupType[] = ["doubleSwap", "timePulse", "hint"];
        const t = pool[Math.floor(Math.random() * pool.length)];
        addPower(t);
      }
      return next;
    });
  };

  const spendPower = (t: PowerupType) => {
    setPowerups((p) => {
      const n = (p[t] || 0) - 1;
      return { ...p, [t]: Math.max(0, n) };
    });
    setPowerUsed((u) => ({ ...u, [t]: (u[t] || 0) + 1 }));
  };

  const usePowerup = async (t: PowerupType) => {
    if ((powerups[t] || 0) <= 0) return;
    switch (t) {
      case "doubleSwap":
        setAllowDoubleSwapOnce(true);
        spendPower(t);
        break;
      case "timePulse":
        setTimeLeft((s) => Math.min(s + 10, TIMER_BY_LEN[length] + 20));
        spendPower(t);
        break;
      case "hint":
        const h = await getHint(current, length);
        if (h) {
          setHintIndex(h.index);
          setTimeout(() => setHintIndex(null), HINT_FLASH_MS);
        }
        spendPower(t);
        break;
    }
  };

  /** Called when a tile is edited via Board */
  const handleChangeAt = (i: number, ch: string) => {
    setCurrent((w) => {
      const arr = w.split("");
      arr[i] = ch;
      return arr.join("");
    });
  };

  /** Submit: validate, enforce one-letter change (or two if powerup active), score, next word */
  const handleSubmit = async () => {
    if (state !== "running") return;
    const prev = usedWords.length ? usedWords[usedWords.length - 1] : current;
    const base = usedWords.length ? usedWords[0] : current;
    const lastWord = usedWords.length ? usedWords[usedWords.length - 1] : current;
    const dist = sameLength(current, lastWord) ? hammingDistance(current, lastWord) : length;

    const allowed = allowDoubleSwapOnce ? dist <= 2 : dist === 1;
    if (!allowed) {
      setScore((s) => s - 5);
      setStreak(0);
      return;
    }

    // Validate dictionary
    const v = await validateWordServer(current, length, "arcade");
    if (!v.ok || usedWords.includes(current)) {
      setScore((s) => s - 5);
      setStreak(0);
      return;
    }

    // Accept
    setUsedWords((arr) => [...arr, current]);
    setScore((s) => s + 10);
    earnOnStreak();

    // Clear one-time double swap flag after it's consumed
    if (allowDoubleSwapOnce) setAllowDoubleSwapOnce(false);
  };

  const handleUndo = () => {
    if (!usedWords.length) return;
    const next = [...usedWords];
    next.pop();
    setUsedWords(next);
    setStreak(0);
    setScore((s) => Math.max(0, s - 5));
  };

  // Initial seed when page mounts / state idle
  useEffect(() => {
    if (state !== "idle") return;
    (async () => setCurrent(await getStartWord(length)))();
  }, [state, length]);

  const resetAll = () => {
    setState("idle");
    setTimeLeft(TIMER_BY_LEN[length]);
    setScore(0);
    setStreak(0);
    setStreakMax(0);
    setUsedWords([]);
    setPowerups({});
    setPowerUsed({});
    setHintIndex(null);
    setAllowDoubleSwapOnce(false);
    setResultsOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0B1E26] text-slate-100">
      <header className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="font-black tracking-wide">MORPH CHAIN: ARCADE</div>
        <a className="text-sm text-cyan-300 hover:text-cyan-200" href="/">Classic</a>
      </header>

      <main className="mx-auto max-w-screen-sm px-4 py-6">
        <ArcadeHUD
          length={length}
          timeLeft={timeLeft}
          score={score}
          streak={streak}
          powerups={powerups}
          onUse={usePowerup}
        />

        <div className="mb-4 flex items-center justify-center">
          <LengthToggleSimple
            value={length}
            onChange={(v) => {
              setLength(v);
              resetAll();
            }}
          />
        </div>

        <div className="text-center text-xs text-slate-400 mb-2">
          Change one letter per move. Use power-ups to push your streak. 60 seconds—go!
        </div>

        <Board
          word={current}
          hintIndex={hintIndex}
          lockedIndex={lockedIndex}
          onChangeAt={handleChangeAt}
        />

        <div className="flex gap-2 justify-center">
          {state !== "running" ? (
            <button
              className="px-5 py-2 rounded-md bg-cyan-400 text-slate-900 font-semibold"
              onClick={startRun}
              disabled={state === "countdown"}
            >
              {state === "idle" ? "Start" : state === "countdown" ? "Get Ready..." : "Resume"}
            </button>
          ) : (
            <>
              <button
                className="px-5 py-2 rounded-md bg-cyan-400 text-slate-900 font-semibold"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                Submit
              </button>
              <button
                className="px-5 py-2 rounded-md bg-slate-800 text-slate-100"
                onClick={handleUndo}
              >
                Undo
              </button>
            </>
          )}

          {state === "running" && (
            <button
              className="px-5 py-2 rounded-md bg-slate-800 text-slate-100"
              onClick={() => setState("paused")}
            >
              Pause
            </button>
          )}
          {state === "paused" && (
            <button
              className="px-5 py-2 rounded-md bg-cyan-400 text-slate-900 font-semibold"
              onClick={() => setState("running")}
            >
              Resume
            </button>
          )}
          {(state === "results" || resultsOpen) && (
            <button
              className="px-5 py-2 rounded-md bg-slate-800 text-slate-100"
              onClick={resetAll}
            >
              Play Again
            </button>
          )}
        </div>
      </main>

      <CountdownOverlay state={state} />

      <ResultsModalArcade
        open={resultsOpen}
        onClose={() => {
          setResultsOpen(false);
          setState("idle");
        }}
        score={score}
        words={usedWords}
        streakMax={streakMax}
        powerUsed={powerUsed}
        length={length}
      />
    </div>
  );
}
