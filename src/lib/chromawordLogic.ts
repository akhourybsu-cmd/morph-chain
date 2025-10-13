// Chromaword (Morph Prism) - Word guessing game with spectral color feedback

export interface ChromawordPuzzle {
  id: string;
  length: number;
  target: string;
  dictVersion: string;
  weights: { presence: number; position: number; alpha: number };
  hueMapVersion: string;
  maxGuesses: number;
}

export interface TileColor {
  h: number;
  s: number;
  v: number;
  hex: string;
}

export interface TileMeta {
  present: boolean;
  posMatch: boolean;
  alphaDistance: number;
}

export interface GuessResult {
  valid: boolean;
  reason: string | null;
  win: boolean;
  tiles: TileColor[];
  tileMeta: TileMeta[];
  similarity: number;
  rowsLeft: number;
}

// Letter frequency ranks (approximate - higher rank = more common)
const LETTER_FREQ_RANK: Record<string, number> = {
  E: 1, T: 2, A: 3, O: 4, I: 5, N: 6, S: 7, H: 8, R: 9, D: 10,
  L: 11, C: 12, U: 13, M: 14, W: 15, F: 16, G: 17, Y: 18, P: 19, B: 20,
  V: 21, K: 22, J: 23, X: 24, Q: 25, Z: 26
};

// Get letter index (A=0, B=1, ..., Z=25)
function letterIndex(letter: string): number {
  return letter.charCodeAt(0) - 'A'.charCodeAt(0);
}

// Circular distance between two indices (0-25)
function circularDistance(a: number, b: number): number {
  const diff = Math.abs(a - b);
  return Math.min(diff, 26 - diff);
}

// Get hue for a letter (0-360)
function getLetterHue(letter: string): number {
  const idx = letterIndex(letter);
  return Math.round((idx / 26) * 360);
}

// Get saturation for a letter based on frequency
function getLetterSaturation(letter: string, present: boolean): number {
  const rank = LETTER_FREQ_RANK[letter] || 13;
  const baseSat = Math.max(0.45, Math.min(0.9, 0.45 + 0.35 * (1 - rank / 26)));
  return baseSat * (present ? 1.0 : 0.4);
}

// Linear interpolation
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// HSV to Hex conversion
function hsvToHex(hsv: { h: number; s: number; v: number }): string {
  const h = hsv.h / 360;
  const s = hsv.s;
  const v = hsv.v;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let r = 0, g = 0, b = 0;
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }

  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Score a guess against the target
export function scoreGuess(
  guess: string,
  target: string,
  weights = { presence: 0.5, position: 0.3, alpha: 0.2 },
  currentGuessCount: number,
  maxGuesses: number
): GuessResult {
  const G = guess.toUpperCase().split('');
  const T = target.toUpperCase().split('');

  // Calculate presence (multiset-aware)
  const targetCounts = new Map<string, number>();
  T.forEach(ch => targetCounts.set(ch, (targetCounts.get(ch) || 0) + 1));

  const present: boolean[] = [];
  const tempCounts = new Map(targetCounts);
  
  G.forEach(ch => {
    const count = tempCounts.get(ch) || 0;
    if (count > 0) {
      present.push(true);
      tempCounts.set(ch, count - 1);
    } else {
      present.push(false);
    }
  });

  // Calculate position matches
  const pos = G.map((ch, i) => T[i] === ch);

  // Calculate alpha distances
  const dAlpha = G.map((ch, i) => circularDistance(letterIndex(ch), letterIndex(T[i])) / 13);

  // Calculate per-letter costs
  const perCost = G.map((_, i) =>
    weights.presence * (present[i] ? 0 : 1) +
    weights.position * (pos[i] ? 0 : (present[i] ? 0.5 : 1)) +
    weights.alpha * dAlpha[i]
  );

  const maxCost = weights.presence + weights.position + weights.alpha;
  const similarity = 1 - (perCost.reduce((a, b) => a + b, 0) / (G.length * maxCost));

  // Generate tile colors
  const tiles: TileColor[] = G.map((ch, i) => {
    const guessHue = getLetterHue(ch);
    const targetHue = getLetterHue(T[i]);
    const h = Math.round(lerp(guessHue, targetHue, 1 - dAlpha[i]));
    const s = getLetterSaturation(ch, present[i]);
    const v = pos[i] ? 1.0 : (present[i] ? 0.72 : 0.48);
    return { h, s, v, hex: hsvToHex({ h, s, v }) };
  });

  const tileMeta: TileMeta[] = G.map((_, i) => ({
    present: present[i],
    posMatch: pos[i],
    alphaDistance: dAlpha[i]
  }));

  const win = pos.every(Boolean);

  return {
    valid: true,
    reason: null,
    win,
    tiles,
    tileMeta,
    similarity: Math.round(similarity * 100) / 100,
    rowsLeft: maxGuesses - currentGuessCount - 1
  };
}

// Get today's puzzle
export function getTodaysPuzzle(): ChromawordPuzzle {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];

  // Demo puzzle for now
  return {
    id: `cw_${dateString}`,
    length: 5,
    target: "SHINE",
    dictVersion: "demo5_v1",
    weights: { presence: 0.5, position: 0.3, alpha: 0.2 },
    hueMapVersion: "A2Z_hsv_v1",
    maxGuesses: 6
  };
}
