import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MorphArcadeTitle } from "@/components/GameTitles";
import { Menu, Lock } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

/**
 * MORPH CHAIN — ARCADE
 * - No timer; you manage "Chain Stability" (resource)
 * - Goal: build the longest chain before stability hits 0
 * - Modes: 4L / 5L / 6L
 * - Δ rules: 1 letter per move; Δ≤2 only if Double Swap is active for the next submit
 * - Dictionary + no repeats enforced
 */

type LengthMode = 4 | 5 | 6;
type PowerupType = "doubleSwap" | "insight" | "repair" | "wildcard";
type GameState = "idle" | "running" | "paused" | "results";

const MAX_STABILITY = 100;

const isAlphaLower = (s: string) => /^[a-z]+$/.test(s);
const hamming = (a: string, b: string) =>
  a.split("").reduce((d, ch, i) => d + (ch !== b[i] ? 1 : 0), 0);

/* ----------------------- API helpers (server authoritative) ----------------------- */

async function validateWord(word: string, len: LengthMode) {
  try {
    const res = await fetch("/api/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, len, game: "arcade_survival" }),
    });
    if (!res.ok) throw new Error("validate failed");
    return (await res.json()) as { ok: boolean; reason?: string };
  } catch {
    return { ok: isAlphaLower(word) && word.length === len };
  }
}

async function getStartWord(len: LengthMode): Promise<string> {
  try {
    const res = await fetch(`/api/arcade/start?len=${len}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.word && data.word.length === len) return data.word.toLowerCase();
    }
  } catch {}
  const pool4 = ["cold", "sand", "lamp", "tide", "moth", "farm", "ring", "melt"];
  const pool5 = ["crane", "flint", "plain", "panel", "grain", "spoil", "trick", "shelf"];
  const pool6 = ["cinder", "velvet", "pollen", "napkin", "credit", "fabric", "museum", "radius"];
  const pools: Record<LengthMode, string[]> = { 4: pool4, 5: pool5, 6: pool6 };
  const list = pools[len];
  return list[Math.floor(Math.random() * list.length)];
}

/* ----------------------------- Header & Menu ----------------------------- */

function ArcadeHeader({
  onOpenMenu,
  onOpenHelp,
}: {
  onOpenMenu: () => void;
  onOpenHelp: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 bg-[hsl(var(--arcade-bg))]/90 backdrop-blur border-b border-slate-800">
      <div className="max-w-screen-sm mx-auto px-4 h-14 flex items-center justify-between">
        <button
          aria-label="Open menu"
          onClick={onOpenMenu}
          className="p-2 rounded-md text-slate-300 hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        <a href="/" className="flex-1 flex justify-center">
          <MorphArcadeTitle className="text-base sm:text-lg" />
        </a>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenHelp}
            className="p-2 rounded-md text-slate-300 hover:bg-slate-800"
            aria-label="How to Play"
            title="How to Play"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <circle cx="12" cy="17" r="0.5" fill="currentColor"/>
            </svg>
          </button>
          <a
            href="/login"
            className="p-2 rounded-md text-slate-300 hover:bg-slate-800"
            aria-label="Log in"
            title="Log in"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}

function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <aside className="absolute left-0 top-0 h-full w-72 bg-slate-900 border-r border-slate-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="font-bold text-slate-100">Morph Games</div>
          <button onClick={onClose} className="p-2 rounded-md text-slate-300 hover:bg-slate-800">
            ✕
          </button>
        </div>
        <nav className="flex flex-col gap-2 text-slate-200">
          <a className="hover:text-cyan-300" href="/">Morph Chain (Classic)</a>
          <a className="hover:text-cyan-300" href="/arcade-survival">
            <MorphArcadeTitle />
          </a>
          <a className="hover:text-cyan-300" href="/rush">Morph Rush</a>
          <a className="hover:text-cyan-300" href="/prism">Morph Prism</a>
        </nav>
      </aside>
    </div>
  );
}

function HowToPlayModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-slate-900 rounded-xl p-6 ring-1 ring-slate-700 shadow-2xl">
        <div className="text-2xl font-bold text-slate-100 mb-4 text-center">
          <MorphArcadeTitle className="text-xl" />
        </div>
        
        <div className="text-slate-300 text-sm space-y-4 max-h-[70vh] overflow-auto pr-2">
          <section>
            <h3 className="text-lg font-bold text-cyan-400 mb-2">🎯 Objective</h3>
            <p>Build the longest possible word chain before your <b className="text-cyan-300">Chain Stability</b> reaches zero. Unlike other modes, there's no time limit—only your strategic decisions matter!</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-cyan-400 mb-2">⛓️ Chain Stability Explained</h3>
            <p className="mb-2"><b className="text-cyan-300">Chain Stability</b> represents the strength of your word chain. Think of it as your resource that depletes as you play:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><b>Every word costs -5 stability</b> (basic move cost)</li>
              <li><b>Invalid moves cost -12 stability</b> (wrong words, repeats, or changing too many letters)</li>
              <li><b>Smart plays reward you:</b> 25% chance to gain +6 stability on valid moves</li>
              <li><b>Power-ups cost stability</b> to activate (but can help you survive longer)</li>
              <li><b>Game ends</b> when stability reaches 0</li>
            </ul>
            <p className="mt-2 text-cyan-200 italic">💡 Strategy tip: Maintain a stability buffer and use power-ups wisely!</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-cyan-400 mb-2">📜 Basic Rules</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Change <b>exactly one letter</b> per move to create a new valid word</li>
              <li>All words must be valid modern U.S. English dictionary words</li>
              <li><b>No repeating words</b>—each word can only be used once per game</li>
              <li>Choose your word length (4L, 5L, or 6L) before starting</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-cyan-400 mb-2">⚡ Power-Ups</h3>
            <p className="mb-2">Earn power-ups through gameplay (every 4-move streak or randomly ~12% chance). Use them strategically:</p>
            <div className="space-y-2">
              <div className="bg-slate-800 p-2 rounded">
                <p><b>🔄 Double Swap</b> <span className="text-red-400">(costs -10 stability)</span></p>
                <p className="text-xs text-slate-400">Allows your <b>next move</b> to change up to 2 letters instead of 1. Perfect for escaping dead ends!</p>
              </div>
              <div className="bg-slate-800 p-2 rounded">
                <p><b>💡 Insight</b> <span className="text-red-400">(costs -8 stability)</span></p>
                <p className="text-xs text-slate-400">Highlights 3 letter positions you can change to find valid words. Great for when you're stuck!</p>
              </div>
              <div className="bg-slate-800 p-2 rounded">
                <p><b>⚙️ Repair</b> <span className="text-red-400">(costs -15)</span> <span className="text-green-400">(restores +20)</span></p>
                <p className="text-xs text-slate-400">Net gain of +5 stability. Use when your chain is weakening to keep going longer!</p>
              </div>
              <div className="bg-slate-800 p-2 rounded">
                <p><b>🎲 Wildcard</b> <span className="text-green-400">(FREE!)</span></p>
                <p className="text-xs text-slate-400">Randomly changes one letter for you. Rare drop, use wisely for exploration!</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold text-cyan-400 mb-2">🏆 Scoring</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><b>Longest Chain:</b> Total number of valid words in your chain</li>
              <li><b>Best Streak:</b> Consecutive valid moves without errors</li>
            </ul>
          </section>

          <section className="bg-cyan-900/20 p-3 rounded border border-cyan-700/30">
            <h3 className="text-sm font-bold text-cyan-300 mb-1">💎 Pro Tips</h3>
            <ul className="text-xs space-y-1 text-slate-300">
              <li>• Save Double Swap for when you're truly stuck</li>
              <li>• Use Repair before stability gets too low</li>
              <li>• Build streaks to earn more power-ups</li>
              <li>• Longer words (6L) are harder but more rewarding</li>
            </ul>
          </section>
        </div>

        <div className="mt-5 flex justify-center">
          <button onClick={onClose} className="px-6 py-2.5 rounded-lg bg-cyan-400 text-slate-900 font-bold text-base hover:bg-cyan-300 transition">
            Let's Play! 🎮
          </button>
        </div>
      </div>
    </div>
  );
}

function LengthToggle({
  value,
  onChange,
}: {
  value: LengthMode;
  onChange: (v: LengthMode) => void;
}) {
  const Btn = ({ v }: { v: LengthMode }) => (
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
      <Btn v={4} />
      <Btn v={5} />
      <Btn v={6} />
    </div>
  );
}

function ChainBar({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="flex items-center justify-between text-slate-300 text-xs mb-1">
        <span>Chain Stability</span>
        <span>{Math.max(0, Math.floor(value))}/{max}</span>
      </div>
      <div className="h-2 rounded bg-slate-800 overflow-hidden">
        <div className="h-2 bg-cyan-400 transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function PowerHUD({
  power,
  onUse,
}: {
  power: Partial<Record<PowerupType, number>>;
  onUse: (t: PowerupType) => void;
}) {
  const Slot = ({ t, label, icon }: { t: PowerupType; label: string; icon: string }) => {
    const count = power[t] || 0;
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
    <div className="w-full max-w-sm mx-auto flex items-center justify-between">
      <div className="text-left">
        <div className="text-xs text-slate-400">Longest Chain</div>
        <div className="text-xl font-bold text-slate-100">Survive</div>
      </div>
      <div className="flex items-center gap-2">
        <Slot t="doubleSwap" label="Double Swap" icon="🔄" />
        <Slot t="insight" label="Insight" icon="💡" />
        <Slot t="repair" label="Repair" icon="⚙️" />
        <Slot t="wildcard" label="Wildcard" icon="🎲" />
      </div>
    </div>
  );
}

function Tiles({
  word,
  flashIndices,
  onChangeAt,
}: {
  word: string;
  flashIndices?: number[];
  onChangeAt: (i: number, ch: string) => void;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");

  const handleTileClick = (i: number, ch: string) => {
    setEditingIndex(i);
    setInputValue(ch);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase();
    if (val === "" || /^[a-z]$/.test(val)) {
      setInputValue(val);
    }
  };

  const handleInputSubmit = (i: number) => {
    if (/^[a-z]$/.test(inputValue)) {
      onChangeAt(i, inputValue);
    }
    setEditingIndex(null);
    setInputValue("");
  };

  const handleInputBlur = (i: number) => {
    if (inputValue) {
      handleInputSubmit(i);
    } else {
      setEditingIndex(null);
      setInputValue("");
    }
  };

  return (
    <div className="flex justify-center gap-2 my-4">
      {word.split("").map((ch, i) => {
        const hinted = flashIndices?.includes(i);
        const isEditing = editingIndex === i;

        if (isEditing) {
          return (
            <div key={i} className="relative w-12 h-12">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={() => handleInputBlur(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleInputSubmit(i);
                  if (e.key === "Escape") {
                    setEditingIndex(null);
                    setInputValue("");
                  }
                }}
                autoFocus
                maxLength={1}
                className="w-12 h-12 rounded-md text-center text-xl font-bold bg-cyan-400/20 text-slate-100 border-2 border-cyan-400 outline-none"
              />
            </div>
          );
        }

        return (
          <button
            key={i}
            className={`w-12 h-12 rounded-md grid place-items-center text-xl font-bold
              bg-slate-800 text-slate-100 ${hinted ? "outline outline-2 outline-cyan-400" : ""}`}
            onClick={() => handleTileClick(i, ch)}
            title="Tap to change letter"
          >
            {ch.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

export default function ArcadeSurvivalPage() {
  const navigate = useNavigate();
  const { hasBetaAccess, loading } = useUserRole();
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [firstTime, setFirstTime] = useState(true);

  const [length, setLength] = useState<LengthMode>(4);
  const [state, setState] = useState<GameState>("idle");
  
  // Redirect if user doesn't have beta access
  useEffect(() => {
    if (!loading && !hasBetaAccess) {
      navigate("/");
    }
  }, [loading, hasBetaAccess, navigate]);

  const [stability, setStability] = useState<number>(MAX_STABILITY);

  const [current, setCurrent] = useState("----");
  const [history, setHistory] = useState<string[]>([]);
  const [flash, setFlash] = useState<number[]>([]);
  const [doubleSwapOnce, setDoubleSwapOnce] = useState(false);

  const [power, setPower] = useState<Partial<Record<PowerupType, number>>>({
    doubleSwap: 0, insight: 0, repair: 0, wildcard: 0,
  });

  const [streak, setStreak] = useState(0);
  const [streakMax, setStreakMax] = useState(0);

  const [resultsOpen, setResultsOpen] = useState(false);

  useEffect(() => {
    if (state === "running") return;
    (async () => setCurrent(await getStartWord(length)))();
    setHistory([]);
    setStability(MAX_STABILITY);
    setPower({ doubleSwap: 0, insight: 0, repair: 0, wildcard: 0 });
    setFlash([]);
    setDoubleSwapOnce(false);
    setStreak(0);
    setStreakMax(0);
  }, [length, state]);

  const canSubmit = useMemo(
    () => isAlphaLower(current) && current.length === length,
    [current, length]
  );

  const start = () => {
    if (firstTime) {
      setHelpOpen(true);
      setFirstTime(false);
    }
    setState("running");
  };

  const adjustStability = (delta: number) =>
    setStability((s) => {
      const next = Math.max(0, Math.min(MAX_STABILITY, s + delta));
      if (next === 0) {
        setState("results");
        setResultsOpen(true);
      }
      return next;
    });

  const giveRandomPower = () => {
    const pool: PowerupType[] = ["doubleSwap", "insight", "repair", "wildcard"];
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setPower((p) => ({ ...p, [pick]: (p[pick] || 0) + 1 }));
  };

  const earnOnPlay = () => {
    setStreak((s) => {
      const next = s + 1;
      setStreakMax((m) => Math.max(m, next));
      if (next % 4 === 0) giveRandomPower();
      else if (Math.random() < 0.12) giveRandomPower();
      return next;
    });
  };

  const spendPower = (t: PowerupType) =>
    setPower((p) => ({ ...p, [t]: Math.max(0, (p[t] || 0) - 1) }));

  const usePower = (t: PowerupType) => {
    const count = power[t] || 0;
    if (count <= 0 || state !== "running") return;

    spendPower(t);

    switch (t) {
      case "doubleSwap":
        adjustStability(-10);
        setDoubleSwapOnce(true);
        break;
      case "insight": {
        adjustStability(-8);
        const picks = new Set<number>();
        while (picks.size < Math.min(3, length)) picks.add(Math.floor(Math.random() * length));
        setFlash(Array.from(picks));
        setTimeout(() => setFlash([]), 1200);
        break;
      }
      case "repair":
        adjustStability(-15);
        setTimeout(() => adjustStability(+20), 40);
        break;
      case "wildcard": {
        const idx = Math.floor(Math.random() * length);
        const letter = String.fromCharCode(97 + Math.floor(Math.random() * 26));
        setCurrent((w) => w.substring(0, idx) + letter + w.substring(idx + 1));
        break;
      }
    }
  };

  const onChangeAt = (i: number, ch: string) => {
    setCurrent((w) => {
      const arr = w.split("");
      arr[i] = ch;
      return arr.join("");
    });
  };

  const submit = async () => {
    if (state !== "running" || !canSubmit) return;

    const lastWord = history.length ? history[history.length - 1] : current;
    const dist = history.length ? hamming(current, lastWord) : 1;

    const allowed = doubleSwapOnce ? dist <= 2 : dist === 1;
    if (!allowed) {
      adjustStability(-12);
      setStreak(0);
      setDoubleSwapOnce(false);
      return;
    }

    const valid = await validateWord(current, length);
    if (!valid.ok || history.includes(current)) {
      adjustStability(-12);
      setStreak(0);
      setDoubleSwapOnce(false);
      return;
    }

    adjustStability(-5);
    if (Math.random() < 0.25) adjustStability(+6);
    setHistory((h) => [...h, current]);
    earnOnPlay();
    if (doubleSwapOnce) setDoubleSwapOnce(false);
  };

  const undo = () => {
    if (!history.length) return;
    setHistory((h) => {
      const next = [...h]; next.pop(); return next;
    });
    setStreak(0);
    adjustStability(-5);
  };

  const reset = () => {
    setState("idle");
    setStability(MAX_STABILITY);
    setHistory([]);
    setStreak(0);
    setStreakMax(0);
    setPower({ doubleSwap: 0, insight: 0, repair: 0, wildcard: 0 });
    setFlash([]);
    setDoubleSwapOnce(false);
    (async () => setCurrent(await getStartWord(length)))();
    setResultsOpen(false);
  };

  const share = async () => {
    const text = `Morph Chain — Arcade ${length}L
Longest chain: ${history.length}
Best streak: ${streakMax}
morphchaingame.com`;
    try {
      await navigator.share?.({ text });
    } catch {
      await navigator.clipboard.writeText(text);
      alert("Copied results to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(var(--arcade-bg))] via-[hsl(var(--arcade-bg-mid))] to-[hsl(var(--arcade-bg))] text-slate-100">
      <ArcadeHeader
        onOpenMenu={() => setMenuOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
      />
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <HowToPlayModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      {loading ? (
        <main className="max-w-screen-sm mx-auto px-4 py-6 flex items-center justify-center min-h-[50vh]">
          <div className="text-slate-300">Loading...</div>
        </main>
      ) : (
      <main className="max-w-screen-sm mx-auto px-4 py-6">
        <div className="mb-3">
          <ChainBar value={stability} max={MAX_STABILITY} />
        </div>

        <div className="mb-3">
          <PowerHUD power={power} onUse={usePower} />
        </div>

        <div className="mb-4 flex items-center justify-center">
          <LengthToggle
            value={length}
            onChange={(v) => {
              if (state === "running") return;
              setLength(v);
              reset();
            }}
          />
        </div>

        <div className="text-center text-xs text-slate-400 mb-2">
          Change one letter per move (or two with Double Swap). Every move costs stability. Survive as long as possible.
        </div>

        <Tiles word={current} onChangeAt={onChangeAt} flashIndices={flash} />

        <div className="flex gap-2 justify-center">
          {state !== "running" ? (
            <button className="px-5 py-2 rounded-md bg-cyan-400 text-slate-900 font-semibold" onClick={start}>
              {state === "idle" ? "Start" : "Resume"}
            </button>
          ) : (
            <>
              <button className="px-5 py-2 rounded-md bg-cyan-400 text-slate-900 font-semibold" onClick={submit}>
                Submit
              </button>
              <button className="px-5 py-2 rounded-md bg-slate-800 text-slate-100" onClick={undo}>
                Undo
              </button>
              <button className="px-5 py-2 rounded-md bg-slate-800 text-slate-100" onClick={() => setState("paused")}>
                Pause
              </button>
            </>
          )}
        </div>

        {resultsOpen && (
          <div className="fixed inset-0 z-40 bg-black/60 grid place-items-center p-4">
            <div className="w-full max-w-sm bg-slate-900 rounded-xl p-5 ring-1 ring-slate-700">
              <div className="text-xl font-bold text-slate-100 mb-1">Chain Broken</div>
              <div className="text-slate-300 text-sm mb-3">
                Longest chain: <b>{history.length}</b> • Best streak: <b>{streakMax}</b>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-2 rounded-md bg-cyan-400 text-slate-900 font-semibold" onClick={share}>
                  Share
                </button>
                <button className="flex-1 py-2 rounded-md bg-slate-800 text-slate-100" onClick={reset}>
                  Play Again
                </button>
              </div>
              <div className="mt-4 text-xs text-slate-500 line-clamp-2">{history.join(" → ")}</div>
            </div>
          </div>
        )}
      </main>
      )}
    </div>
  );
}
