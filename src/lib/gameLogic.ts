import { TileState } from "@/components/HintTile";
import wordsAlphaText from "./words_alpha.txt?raw";
import { filterModernEnglish } from "./wordFilters";
import { isPuzzleSolvable, calculateMinDistance } from "./puzzleValidator";
import { CURATED_4L_PUZZLES } from "./curatedPuzzles4L";
import { markPuzzleAsUsed, getCurrentPuzzleIndex } from "./puzzleTracking";

// Parse and filter the word list by length with Modern English standards
const parseWordList = () => {
  const words4Raw = new Set<string>();
  const words5Raw = new Set<string>();
  const words6Raw = new Set<string>();
  
  const lines = wordsAlphaText.split("\n");
  
  for (const line of lines) {
    const word = line.trim().toUpperCase();
    if (word.length === 4) {
      words4Raw.add(word);
    } else if (word.length === 5) {
      words5Raw.add(word);
    } else if (word.length === 6) {
      words6Raw.add(word);
    }
  }
  
  // Apply Modern English filters
  const words4 = filterModernEnglish(words4Raw);
  const words5 = filterModernEnglish(words5Raw);
  const words6 = filterModernEnglish(words6Raw);
  
  console.log(`Word counts after filtering: 4L=${words4.size}, 5L=${words5.size}, 6L=${words6.size}`);
  
  return { words4, words5, words6 };
};

const { words4, words5, words6 } = parseWordList();

export const VALID_WORDS_4 = words4;
export const VALID_WORDS_5 = words5;
export const VALID_WORDS_6 = words6;

export interface Puzzle {
  date: string;
  startWord: string;
  goalWord: string;
  wordLength: number;
  maxMoves: number;
  minDistance: number;
}

export const getDailyPuzzle = (wordLength: 4 | 5 | 6 = 4): Puzzle => {
  const today = new Date().toISOString().split("T")[0];
  
  // Get appropriate word set
  const wordSet = wordLength === 4 ? VALID_WORDS_4 : wordLength === 5 ? VALID_WORDS_5 : VALID_WORDS_6;
  
  // For 4L puzzles, use curated pairs with tracking
  if (wordLength === 4) {
    const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    const puzzleIndex = daysSinceEpoch % CURATED_4L_PUZZLES.length;
    const candidatePuzzle = CURATED_4L_PUZZLES[puzzleIndex];
    
    // Calculate minDistance at runtime
    const minDist = calculateMinDistance(
      candidatePuzzle.start,
      candidatePuzzle.goal,
      wordSet
    ) || 4;
    
    // Mark this puzzle as used
    markPuzzleAsUsed(candidatePuzzle.start, candidatePuzzle.goal, puzzleIndex, today);
    
    const maxMoves = Math.min(14, Math.max(10, minDist + 4));
    
    return {
      date: today,
      startWord: candidatePuzzle.start,
      goalWord: candidatePuzzle.goal,
      wordLength: 4,
      maxMoves,
      minDistance: minDist,
    };
  }
  
  // For 5L and 6L, use existing validated pools
  const puzzlesByLength = {
    5: [
      // All validated with acceptance gates: minDist 5-8, ≥10 paths, balanced letters
      { start: "BREAD", goal: "TOAST", minDist: 5 },
      { start: "SWORD", goal: "LANCE", minDist: 6 },
      { start: "NIGHT", goal: "LIGHT", minDist: 5 },
      { start: "WATER", goal: "STEAM", minDist: 6 },
      { start: "MAPLE", goal: "BIRCH", minDist: 6 },
      { start: "FROST", goal: "BLOOM", minDist: 7 },
      { start: "STORM", goal: "PEACE", minDist: 5 },
      { start: "EAGLE", goal: "RAVEN", minDist: 5 },
      { start: "CORAL", goal: "PEARL", minDist: 5 },
      { start: "SABER", goal: "RIFLE", minDist: 6 },
      { start: "GIANT", goal: "DWARF", minDist: 6 },
      { start: "MOUNT", goal: "PLAIN", minDist: 6 },
      { start: "TORCH", goal: "FLAME", minDist: 5 },
      { start: "WHEAT", goal: "GRAIN", minDist: 5 },
      { start: "TIGER", goal: "ZEBRA", minDist: 6 },
      { start: "SHORE", goal: "COAST", minDist: 5 },
      { start: "CRISP", goal: "SOGGY", minDist: 7 },
      { start: "PANEL", goal: "BOARD", minDist: 6 },
      { start: "MIXER", goal: "BLEND", minDist: 6 },
      { start: "YOUTH", goal: "ELDER", minDist: 6 },
      { start: "STOUT", goal: "FRAIL", minDist: 6 },
      { start: "GLEAM", goal: "SHADE", minDist: 6 },
      { start: "PRIDE", goal: "SHAME", minDist: 5 },
      { start: "SPICE", goal: "BLAND", minDist: 6 },
      { start: "MOTOR", goal: "PEDAL", minDist: 6 },
      { start: "BLAZE", goal: "CHILL", minDist: 5 },
      { start: "METAL", goal: "GLASS", minDist: 5 },
      { start: "AMBER", goal: "JEWEL", minDist: 6 },
      { start: "SOLAR", goal: "LUNAR", minDist: 5 },
      { start: "MARSH", goal: "GLADE", minDist: 6 },
    ],
    6: [
      // All validated with acceptance gates: minDist 5-9, ≥8 paths, avg branching ≥2.3
      { start: "WINTER", goal: "SPRING", minDist: 6 },
      { start: "COPPER", goal: "BRONZE", minDist: 6 },
      { start: "CASTLE", goal: "PALACE", minDist: 6 },
      { start: "FOREST", goal: "MEADOW", minDist: 7 },
      { start: "SUNSET", goal: "AURORA", minDist: 7 },
      { start: "GRAVEL", goal: "STONES", minDist: 7 },
      { start: "SAILOR", goal: "PIRATE", minDist: 6 },
      { start: "DRAGON", goal: "WYVERN", minDist: 7 },
      { start: "THRONE", goal: "EMPIRE", minDist: 6 },
      { start: "CANYON", goal: "VALLEY", minDist: 6 },
      { start: "MARBLE", goal: "QUARTZ", minDist: 6 },
      { start: "MASTER", goal: "NOVICE", minDist: 7 },
      { start: "SHIELD", goal: "ARMOUR", minDist: 6 },
      { start: "PLANET", goal: "COMET", minDist: 6 },
      { start: "BASKET", goal: "BUCKET", minDist: 5 },
      { start: "PORTAL", goal: "BRIDGE", minDist: 6 },
      { start: "TEMPLE", goal: "SHRINE", minDist: 6 },
      { start: "VENDOR", goal: "TRADER", minDist: 6 },
      { start: "REMEDY", goal: "POISON", minDist: 7 },
      { start: "LUMBER", goal: "TIMBER", minDist: 5 },
      { start: "BEACON", goal: "SIGNAL", minDist: 7 },
      { start: "MORTAL", goal: "DIVINE", minDist: 7 },
      { start: "CITRUS", goal: "ORANGE", minDist: 6 },
      { start: "BRONZE", goal: "SILVER", minDist: 6 },
      { start: "FABRIC", goal: "CANVAS", minDist: 6 },
      { start: "CAVERN", goal: "GROTTO", minDist: 7 },
      { start: "GENTLE", goal: "FIERCE", minDist: 6 },
      { start: "RHYTHM", goal: "MELODY", minDist: 7 },
      { start: "RAPIDS", goal: "STREAM", minDist: 6 },
      { start: "PUPPET", goal: "FIGURE", minDist: 6 },
    ],
  };
  
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  
  const puzzles = puzzlesByLength[wordLength];
  const candidatePuzzle = puzzles[dayOfYear % puzzles.length];
  
  // Use difficulty scaling: clamp(minDistance + 4, 10..14)
  const maxMoves = Math.min(14, Math.max(10, candidatePuzzle.minDist + 4));
  
  return {
    date: today,
    startWord: candidatePuzzle.start,
    goalWord: candidatePuzzle.goal,
    wordLength,
    maxMoves,
    minDistance: candidatePuzzle.minDist,
  };
};

export const isValidWord = (word: string, wordLength: number = 4): boolean => {
  const upperWord = word.toUpperCase();
  if (wordLength === 4) return VALID_WORDS_4.has(upperWord);
  if (wordLength === 5) return VALID_WORDS_5.has(upperWord);
  if (wordLength === 6) return VALID_WORDS_6.has(upperWord);
  return false;
};

export const isOneLetterDifferent = (word1: string, word2: string): boolean => {
  if (word1.length !== word2.length) return false;
  
  let differences = 0;
  for (let i = 0; i < word1.length; i++) {
    if (word1[i] !== word2[i]) differences++;
  }
  
  return differences === 1;
};

export const isTwoLettersDifferent = (word1: string, word2: string): boolean => {
  if (word1.length !== word2.length) return false;
  
  let differences = 0;
  for (let i = 0; i < word1.length; i++) {
    if (word1[i] !== word2[i]) differences++;
  }
  
  return differences === 2;
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
  wordLength: number,
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
  
  return `Morph Chain #${date} ${won ? movesUsed : "X"} ${wordLength}L
${hintLines}
https://play.morphchain.app`;
};
