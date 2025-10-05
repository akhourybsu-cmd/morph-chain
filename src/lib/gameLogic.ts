import { TileState } from "@/components/HintTile";

// Sample word list for 4-letter words
const VALID_WORDS_4 = new Set([
  "COLD", "CORD", "CARD", "WARD", "WARM",
  "WORD", "WORK", "FORK", "FORM", "WORM",
  "BOLD", "HOLD", "HOLE", "HOPE", "ROPE",
  "ROLE", "POLE", "POLL", "POOL", "COOL",
  "COAL", "COAT", "BOAT", "BEAT", "HEAT",
  "HEAD", "DEAD", "DEAR", "BEAR", "BEER",
  "BEEN", "BEAN", "MEAN", "MEAT", "SEAT",
  "SEAL", "REAL", "READ", "ROAD", "LOAD",
  "LORD", "WORD", "WORE", "MORE", "CORE",
  "CARE", "DARE", "DARK", "PARK", "PART",
  "PORT", "POST", "COST", "CAST", "CASE",
  "CAVE", "SAVE", "WAVE", "WAKE", "MAKE",
  "MALE", "PALE", "PANE", "PINE", "MINE",
  "WINE", "WISE", "RISE", "RICE", "NICE",
  "MICE", "MACE", "RACE", "RATE", "GATE",
  "GALE", "GAME", "SAME", "TAME", "TALE",
  "TILE", "TIME", "TIDE", "HIDE", "SIDE",
  "SITE", "KITE", "BITE", "BIKE", "LIKE",
  "LINE", "FINE", "FIRE", "TIRE", "WIRE",
  "WIPE", "PIPE", "RIPE", "RIDE", "WIDE",
]);

export interface Puzzle {
  date: string;
  startWord: string;
  goalWord: string;
  wordLength: number;
  maxMoves: number;
  minDistance: number;
}

export const getDailyPuzzle = (): Puzzle => {
  const today = new Date().toISOString().split("T")[0];
  
  // For demo, rotate through a few puzzles
  const puzzles = [
    { start: "COLD", goal: "WARM", minDistance: 4 },
    { start: "HEAD", goal: "TAIL", minDistance: 5 },
    { start: "DARK", goal: "FIRE", minDistance: 6 },
  ];
  
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  
  const puzzle = puzzles[dayOfYear % puzzles.length];
  
  return {
    date: today,
    startWord: puzzle.start,
    goalWord: puzzle.goal,
    wordLength: puzzle.start.length,
    maxMoves: 12,
    minDistance: puzzle.minDistance,
  };
};

export const isValidWord = (word: string): boolean => {
  return VALID_WORDS_4.has(word.toUpperCase());
};

export const isOneLetterDifferent = (word1: string, word2: string): boolean => {
  if (word1.length !== word2.length) return false;
  
  let differences = 0;
  for (let i = 0; i < word1.length; i++) {
    if (word1[i] !== word2[i]) differences++;
  }
  
  return differences === 1;
};

export const getHints = (attempt: string, goal: string): TileState[] => {
  const hints: TileState[] = [];
  const goalLetters = goal.split("");
  const attemptLetters = attempt.split("");
  
  for (let i = 0; i < attemptLetters.length; i++) {
    if (attemptLetters[i] === goalLetters[i]) {
      hints.push("match");
    } else if (goalLetters.includes(attemptLetters[i])) {
      hints.push("present");
    } else {
      hints.push("miss");
    }
  }
  
  return hints;
};

export const calculateDistance = (word: string, goal: string): number => {
  // Simple Hamming distance for now
  let distance = 0;
  for (let i = 0; i < word.length; i++) {
    if (word[i] !== goal[i]) distance++;
  }
  return distance;
};

export const generateShareText = (
  date: string,
  movesUsed: number,
  won: boolean,
  sampleHints: TileState[][]
): string => {
  const emojiMap: Record<TileState, string> = {
    match: "🟩",
    present: "🟧",
    miss: "⬛",
  };
  
  const hintLines = sampleHints
    .slice(0, 2)
    .map((hints) => hints.map((h) => emojiMap[h]).join(""))
    .join("\n");
  
  return `Morph Chain #${date} ${won ? movesUsed : "X"}
${hintLines}
https://play.morphchain.app`;
};
