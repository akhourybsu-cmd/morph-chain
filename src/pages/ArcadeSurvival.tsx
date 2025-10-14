import React, { useEffect, useMemo, useState } from "react";
import { GlobalHeader } from "@/components/layout/GlobalHeader";
import { SideMenu } from "@/components/layout/SideMenu";

type LengthMode = 4 | 5 | 6;
type PowerupType = "doubleSwap" | "insight" | "repair" | "wildcard";
type GameState = "idle" | "running" | "paused" | "results";

const isAlphaLower = (s: string) => /^[a-z]+$/.test(s);

async function validateWordServer(word: string, len: LengthMode) {
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

const hamming = (a: string, b: string) =>
  a.split("").reduce((d, ch, i) => d + (ch !== b[i] ? 1 : 0), 0);

async function getStartWord(len: LengthMode): Promise<string> {
  try {
    const res = await fetch(`/api/arcade/start?len=${len}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.word && data.word.length === len) return data.word.toLowerCase();
    }
  } catch {}
  const pool4 = ["cold", "ring", "melt", "farm", "moth", "sand", "tide", "lamp"];
  const pool5 = ["crane", "flint", "panel", "plain", "trick", "grain", "spoil", "shell"];
  const pool6 = ["cinder", "velvet", "pollen", "napkin", "credit", "fabric", "museum", "radius"];
  const pools: Record<LengthMode, string[]> = { 4: pool4, 5: pool5, 6: pool6 };
  const list = pools[len];
  return list[Math.floor(Math.random() * list.length)];
}

function HowToPlayModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card rounded-xl p-5 ring-1 ring-border">
        <div className="text-xl font-bold text-foreground mb-1">How to Play — Arcade (Survival)</div>
        <div className="text-muted-foreground text-sm space-y-3 max-h-[65vh] overflow-auto">
          <p><b>Objective:</b> Build the longest chain before your <i>Chain Stability</i> reaches 0.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Change <b>one letter</b> per move to make a new valid word.</li>
            <li>Every move <b>costs</b> stability. Smart morphs can restore it.</li>
            <li>Power-ups <b>cost</b> stability—use them wisely.</li>
            <li>No repeats; all words must be modern U.S. English.</li>
          </ul>
          <p className="mt-2"><b>Power-ups:</b></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>🔄 <b>Double Swap</b> (−10 stability): next move may change 2 letters.</li>
            <li>💡 <b>Insight</b> (−8 stability): highlights 3 viable letter positions.</li>
            <li>⚙️ <b>Repair</b> (−15 stability): restore +20 stability (rare).</li>
            <li>🎲 <b>Wildcard</b> (free, rare): auto-injects a valid random letter change.</li>
          </ul>
          <p><b>Tip:</b> Aim for letters with good connectivity, keep a small buffer of stability, and don't hoard power-ups.</p>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-semibold">
            Got it
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
        value === v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
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
      <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
        <span>Chain Stability</span>
        <span>{Math.max(0, Math.floor(value))}/{max}</span>
      </div>
      <div className="h-2 rounded bg-muted overflow-hidden">
        <div
          className="h-2 bg-primary transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
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
          count > 0 ? "bg-primary/20 ring-1 ring-primary text-primary" : "bg-muted text-muted-foreground"
        }`}
        title={`${label}${count ? ` (${count})` : ""}`}
      >
        <span className="text-lg">{icon}</span>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 text-[10px] bg-primary text-primary-foreground px-1 py-[1px] rounded">
            {count}
          </span>
        )}
      </button>
    );
  };
  return (
    <div className="w-full max-w-sm mx-auto flex items-center justify-between">
      <div className="text-left">
        <div className="text-xs text-muted-foreground">Longest Chain</div>
        <div className="text-xl font-bold text-foreground">Survive</div>
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
  lockIndex,
  flashIndices,
  onChangeAt,
}: {
  word: string;
  lockIndex?: number | null;
  flashIndices?: number[];
  onChangeAt: (i: number, ch: string) => void;
}) {
  return (
    <div className="flex justify-center gap-2 my-4">
      {word.split("").map((ch, i) => {
        const locked = lockIndex === i;
        const hinted = flashIndices?.includes(i);
        return (
          <button
            key={i}
            className={`w-12 h-12 rounded-md grid place-items-center text-xl font-bold
              ${locked ? "bg-muted text-muted-foreground ring-1 ring-border" : "bg-muted text-foreground"}
              ${hinted ? "outline outline-2 outline-primary" : ""}`}
            onClick={() => {
              if (locked) return;
              const next = prompt("Replace with letter a–z:", ch);
              if (!next) return;
              const c = next.trim().toLowerCase();
              if (/^[a-z]$/.test(c)) onChangeAt(i, c);
            }}
            title={locked ? "Locked" : "Tap to change letter"}
          >
            {ch.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

export default function ArcadeSurvivalPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const [length, setLength] = useState<LengthMode>(4);
  const [state, setState] = useState<GameState>("idle");

  const MAX_STAB = 100;
  const [stability, setStability] = useState(MAX_STAB);

  const [current, setCurrent] = useState("----");
  const [accepted, setAccepted] = useState<string[]>([]);
  const [flash, setFlash] = useState<number[]>([]);
  const [doubleSwapActive, setDoubleSwapActive] = useState(false);

  const [power, setPower] = useState<Partial<Record<PowerupType, number>>>({
    doubleSwap: 0,
    insight: 0,
    repair: 0,
    wildcard: 0,
  });

  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [resultsOpen, setResultsOpen] = useState(false);

  useEffect(() => {
    if (state === "running") return;
    (async () => setCurrent(await getStartWord(length)))();
    setAccepted([]);
    setStability(MAX_STAB);
    setStreak(0);
    setBestStreak(0);
    setPower({ doubleSwap: 0, insight: 0, repair: 0, wildcard: 0 });
    setFlash([]);
    setDoubleSwapActive(false);
  }, [length, state]);

  const canSubmit = useMemo(() => isAlphaLower(current) && current.length === length, [current, length]);

  const start = () => setState("running");

  const randomChance = (p: number) => Math.random() < p;

  const tryEarnPower = () => {
    setStreak((s) => {
      const next = s + 1;
      setBestStreak((b) => Math.max(b, next));
      if (next % 4 === 0) {
        giveRandomPower();
      } else if (randomChance(0.12)) {
        giveRandomPower();
      }
      return next;
    });
  };

  const giveRandomPower = () => {
    const pool: PowerupType[] = ["doubleSwap", "insight", "repair", "wildcard"];
    const t = pool[Math.floor(Math.random() * pool.length)];
    setPower((p) => ({ ...p, [t]: (p[t] || 0) + 1 }));
  };

  const spendPower = (t: PowerupType) =>
    setPower((p) => ({ ...p, [t]: Math.max(0, (p[t] || 0) - 1) }));

  const adjustStability = (delta: number) =>
    setStability((s) => {
      const next = Math.max(0, Math.min(MAX_STAB, s + delta));
      if (next === 0) {
        setState("results");
        setResultsOpen(true);
      }
      return next;
    });

  const handleUsePower = (t: PowerupType) => {
    if ((power[t] || 0) <= 0 || state !== "running") return;

    switch (t) {
      case "doubleSwap":
        adjustStability(-10);
        setDoubleSwapActive(true);
        spendPower("doubleSwap");
        break;

      case "insight":
        adjustStability(-8);
        const picks = new Set<number>();
        while (picks.size < Math.min(3, length)) picks.add(Math.floor(Math.random() * length));
        setFlash(Array.from(picks));
        setTimeout(() => setFlash([]), 1200);
        spendPower("insight");
        break;

      case "repair":
        adjustStability(-15);
        setTimeout(() => adjustStability(+20), 50);
        spendPower("repair");
        break;

      case "wildcard":
        if (!current || current.length !== length) return;
        const idx = Math.floor(Math.random() * length);
        const letter = String.fromCharCode(97 + Math.floor(Math.random() * 26));
        setCurrent((w) => w.substring(0, idx) + letter + w.substring(idx + 1));
        spendPower("wildcard");
        break;
    }
  };

  const handleChangeAt = (i: number, ch: string) => {
    setCurrent((w) => {
      const arr = w.split("");
      arr[i] = ch;
      return arr.join("");
    });
  };

  const submit = async () => {
    if (state !== "running" || !canSubmit) return;

    const lastWord = accepted.length ? accepted[accepted.length - 1] : current;
    const dist = accepted.length ? hamming(current, lastWord) : 1;

    const allowed = doubleSwapActive ? dist <= 2 : dist === 1;
    if (!allowed) {
      adjustStability(-12);
      setStreak(0);
      setDoubleSwapActive(false);
      return;
    }

    const v = await validateWordServer(current, length);
    if (!v.ok || accepted.includes(current)) {
      adjustStability(-12);
      setStreak(0);
      setDoubleSwapActive(false);
      return;
    }

    adjustStability(-5);

    if (randomChance(0.25)) adjustStability(+6);

    setAccepted((arr) => [...arr, current]);
    tryEarnPower();

    if (doubleSwapActive) setDoubleSwapActive(false);
  };

  const undo = () => {
    if (!accepted.length) return;
    const next = [...accepted];
    next.pop();
    setAccepted(next);
    setStreak(0);
    adjustStability(-5);
  };

  useEffect(() => {
    if (state !== "idle") return;
    (async () => setCurrent(await getStartWord(length)))();
  }, [state, length]);

  const reset = () => {
    setState("idle");
    setStability(MAX_STAB);
    setAccepted([]);
    setStreak(0);
    setBestStreak(0);
    setPower({ doubleSwap: 0, insight: 0, repair: 0, wildcard: 0 });
    setFlash([]);
    setDoubleSwapActive(false);
  };

  const share = async () => {
    const text = `Morph Chain — Arcade (Survival) ${length}L
Longest chain: ${accepted.length}
Best streak: ${bestStreak}
morphchaingame.com`;
    try {
      await navigator.share?.({ text });
    } catch {
      await navigator.clipboard.writeText(text);
      alert("Copied results to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <GlobalHeader onOpenMenu={() => setMenuOpen(true)} onOpenHelp={() => setHelpOpen(true)} />
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <HowToPlayModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      <main className="max-w-screen-sm mx-auto px-4 py-6">
        <div className="mb-3">
          <ChainBar value={stability} max={MAX_STAB} />
        </div>

        <div className="mb-3">
          <PowerHUD power={power} onUse={handleUsePower} />
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

        <div className="text-center text-xs text-muted-foreground mb-2">
          Change one letter per move. Every move costs stability. Survive as long as possible.
        </div>

        <Tiles word={current} onChangeAt={handleChangeAt} lockIndex={null} flashIndices={flash} />

        <div className="flex gap-2 justify-center">
          {state !== "running" ? (
            <button
              className="px-5 py-2 rounded-md bg-primary text-primary-foreground font-semibold"
              onClick={start}
            >
              {state === "idle" ? "Start" : "Resume"}
            </button>
          ) : (
            <>
              <button
                className="px-5 py-2 rounded-md bg-primary text-primary-foreground font-semibold"
                onClick={submit}
              >
                Submit
              </button>
              <button
                className="px-5 py-2 rounded-md bg-muted text-foreground"
                onClick={undo}
              >
                Undo
              </button>
              <button
                className="px-5 py-2 rounded-md bg-muted text-foreground"
                onClick={() => setState("paused")}
              >
                Pause
              </button>
            </>
          )}
          {(state === "results") && (
            <button className="px-5 py-2 rounded-md bg-muted text-foreground" onClick={reset}>
              Play Again
            </button>
          )}
        </div>

        {state === "results" && (
          <div className="fixed inset-0 z-40 bg-black/60 grid place-items-center p-4">
            <div className="w-full max-w-sm bg-card rounded-xl p-5 ring-1 ring-border">
              <div className="text-xl font-bold text-foreground mb-1">Chain Broken</div>
              <div className="text-muted-foreground text-sm mb-3">
                Longest chain: <b>{accepted.length}</b> • Best streak: <b>{bestStreak}</b>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-2 rounded-md bg-primary text-primary-foreground font-semibold" onClick={share}>
                  Share
                </button>
                <button className="flex-1 py-2 rounded-md bg-muted text-foreground" onClick={reset}>
                  Play Again
                </button>
              </div>
              <div className="mt-4 text-xs text-muted-foreground line-clamp-2">
                {accepted.join(" → ")}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
