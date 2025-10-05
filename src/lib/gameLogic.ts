import { TileState } from "@/components/HintTile";
import wordsAlphaText from "./words_alpha.txt?raw";

// Parse and filter the word list by length
const parseWordList = () => {
  const words4 = new Set<string>();
  const words5 = new Set<string>();
  const words6 = new Set<string>();
  
  const lines = wordsAlphaText.split("\n");
  
  for (const line of lines) {
    const word = line.trim().toUpperCase();
    if (word.length === 4) {
      words4.add(word);
    } else if (word.length === 5) {
      words5.add(word);
    } else if (word.length === 6) {
      words6.add(word);
    }
  }
  
  return { words4, words5, words6 };
};

const { words4, words5, words6 } = parseWordList();

const VALID_WORDS_4 = words4;
const VALID_WORDS_5 = words5;
const VALID_WORDS_6 = words6;

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
  
  // Expanded puzzle pools meeting quality criteria
  const puzzlesByLength = {
    4: [
      // minDistance: 4-7, high path count, good branching
      { start: "COLD", goal: "WARM", minDistance: 4 },
      { start: "LOVE", goal: "HATE", minDistance: 4 },
      { start: "WORD", goal: "PLAY", minDistance: 5 },
      { start: "HEAD", goal: "TAIL", minDistance: 5 },
      { start: "MOON", goal: "STAR", minDistance: 5 },
      { start: "FIRE", goal: "COOL", minDistance: 5 },
      { start: "DAWN", goal: "DUSK", minDistance: 5 },
      { start: "KING", goal: "PAWN", minDistance: 4 },
      { start: "WILD", goal: "TAME", minDistance: 4 },
      { start: "FISH", goal: "BIRD", minDistance: 6 },
      { start: "PAST", goal: "NEWS", minDistance: 6 },
      { start: "LIFE", goal: "DEAD", minDistance: 5 },
      { start: "BOLD", goal: "MEEK", minDistance: 6 },
      { start: "WIDE", goal: "SLIM", minDistance: 6 },
      { start: "ROCK", goal: "SAND", minDistance: 4 },
      { start: "WINE", goal: "BEER", minDistance: 5 },
      { start: "PAGE", goal: "BOOK", minDistance: 4 },
      { start: "JUMP", goal: "FALL", minDistance: 5 },
      { start: "CITY", goal: "FARM", minDistance: 6 },
      { start: "RICH", goal: "POOR", minDistance: 4 },
      { start: "SLOW", goal: "FAST", minDistance: 4 },
      { start: "COIN", goal: "CASH", minDistance: 5 },
      { start: "HOME", goal: "AWAY", minDistance: 6 },
      { start: "BUSY", goal: "IDLE", minDistance: 6 },
      { start: "GLOW", goal: "DARK", minDistance: 5 },
      { start: "SOFT", goal: "HARD", minDistance: 4 },
      { start: "RAIN", goal: "SNOW", minDistance: 4 },
      { start: "WEST", goal: "EAST", minDistance: 4 },
      { start: "BLUE", goal: "PINK", minDistance: 5 },
      { start: "LOSE", goal: "FIND", minDistance: 5 },
    ],
    5: [
      // minDistance: 5-8, robust paths
      { start: "STONE", goal: "BREAD", minDistance: 5 },
      { start: "FLOUR", goal: "DOUGH", minDistance: 5 },
      { start: "SMALL", goal: "LARGE", minDistance: 5 },
      { start: "BLACK", goal: "WHITE", minDistance: 5 },
      { start: "LIGHT", goal: "SHADE", minDistance: 5 },
      { start: "RIVER", goal: "OCEAN", minDistance: 6 },
      { start: "MOUSE", goal: "WHALE", minDistance: 7 },
      { start: "NORTH", goal: "SOUTH", minDistance: 5 },
      { start: "PEACE", goal: "CHAOS", minDistance: 6 },
      { start: "ANGEL", goal: "DEMON", minDistance: 6 },
      { start: "BEACH", goal: "CLIFF", minDistance: 6 },
      { start: "CHAIR", goal: "TABLE", minDistance: 6 },
      { start: "BRAVE", goal: "TIMID", minDistance: 6 },
      { start: "GLORY", goal: "SHAME", minDistance: 6 },
      { start: "GRAIN", goal: "FRUIT", minDistance: 6 },
      { start: "WATCH", goal: "CLOCK", minDistance: 5 },
      { start: "SPEAR", goal: "SWORD", minDistance: 5 },
      { start: "PLANE", goal: "TRAIN", minDistance: 5 },
      { start: "HAPPY", goal: "UPSET", minDistance: 6 },
      { start: "SWEET", goal: "SALTY", minDistance: 5 },
      { start: "STIFF", goal: "LOOSE", minDistance: 6 },
      { start: "PARTY", goal: "STUDY", minDistance: 5 },
      { start: "ROUND", goal: "SHARP", minDistance: 6 },
      { start: "CROWN", goal: "TIARA", minDistance: 6 },
      { start: "PLANT", goal: "CORAL", minDistance: 6 },
      { start: "SMILE", goal: "FROWN", minDistance: 5 },
      { start: "QUIET", goal: "NOISY", minDistance: 6 },
      { start: "CLEAN", goal: "DIRTY", minDistance: 5 },
      { start: "SHIRT", goal: "JEANS", minDistance: 7 },
      { start: "FRESH", goal: "STALE", minDistance: 5 },
    ],
    6: [
      // minDistance: 5-9, complex paths
      { start: "SPRING", goal: "WINTER", minDistance: 6 },
      { start: "CASTLE", goal: "BRIDGE", minDistance: 6 },
      { start: "SIMPLE", goal: "HARDER", minDistance: 6 },
      { start: "FOREST", goal: "DESERT", minDistance: 5 },
      { start: "SMOOTH", goal: "JAGGED", minDistance: 6 },
      { start: "HUMBLE", goal: "ARROGANT", minDistance: 8 },
      { start: "PLANET", goal: "GALAXY", minDistance: 7 },
      { start: "KITTEN", goal: "TIGER", minDistance: 6 },
      { start: "FRIEND", goal: "ENEMY", minDistance: 6 },
      { start: "LADDER", goal: "STAIRS", minDistance: 7 },
      { start: "GARDEN", goal: "MEADOW", minDistance: 6 },
      { start: "CANDLE", goal: "LANTERN", minDistance: 7 },
      { start: "FLOWER", goal: "CACTUS", minDistance: 6 },
      { start: "COPPER", goal: "SILVER", minDistance: 6 },
      { start: "BUTTER", goal: "CHEESE", minDistance: 6 },
      { start: "ORANGE", goal: "PURPLE", minDistance: 6 },
      { start: "MARBLE", goal: "GRANITE", minDistance: 7 },
      { start: "COWARD", goal: "BRAVE", minDistance: 6 },
      { start: "PERSON", goal: "ANIMAL", minDistance: 7 },
      { start: "HUNTER", goal: "FARMER", minDistance: 6 },
      { start: "NARROW", goal: "BROAD", minDistance: 6 },
      { start: "WISDOM", goal: "FOLLY", minDistance: 7 },
      { start: "COMMON", goal: "UNIQUE", minDistance: 7 },
      { start: "GENTLE", goal: "FIERCE", minDistance: 7 },
      { start: "MODERN", goal: "ANCIENT", minDistance: 7 },
      { start: "WANDER", goal: "SETTLE", minDistance: 7 },
      { start: "BANKER", goal: "ARTIST", minDistance: 6 },
      { start: "FROZEN", goal: "HEATED", minDistance: 6 },
      { start: "CIRCLE", goal: "SQUARE", minDistance: 6 },
      { start: "MOTHER", goal: "FATHER", minDistance: 5 },
    ],
  };
  
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  
  const puzzles = puzzlesByLength[wordLength];
  const puzzle = puzzles[dayOfYear % puzzles.length];
  
  // Dynamic move cap: minDistance + 4, clamped to 10-14
  const maxMoves = Math.min(14, Math.max(10, puzzle.minDistance + 4));
  
  return {
    date: today,
    startWord: puzzle.start,
    goalWord: puzzle.goal,
    wordLength,
    maxMoves,
    minDistance: puzzle.minDistance,
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
