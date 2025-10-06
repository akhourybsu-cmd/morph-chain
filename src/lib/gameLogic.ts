import { TileState } from "@/components/HintTile";
import wordsAlphaText from "./words_alpha.txt?raw";
import { filterModernEnglish } from "./wordFilters";
import { isPuzzleSolvable, calculateMinDistance } from "./puzzleValidator";
import { CURATED_4L_PUZZLES } from "./curatedPuzzles4L";
import { CURATED_5L_PUZZLES } from "./curatedPuzzles5L";
import { CURATED_6L_PUZZLES } from "./curatedPuzzles6L";
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
  
  // Use curated pairs with tracking for all word lengths
  const curatedPuzzles = wordLength === 4 ? CURATED_4L_PUZZLES : 
                         wordLength === 5 ? CURATED_5L_PUZZLES : 
                         CURATED_6L_PUZZLES;
  
  const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  const puzzleIndex = daysSinceEpoch % curatedPuzzles.length;
  const candidatePuzzle = curatedPuzzles[puzzleIndex];
  
  // Calculate minDistance at runtime
  const minDist = calculateMinDistance(
    candidatePuzzle.start,
    candidatePuzzle.goal,
    wordSet
  ) || (wordLength === 4 ? 4 : wordLength === 5 ? 5 : 6);
  
  // Mark this puzzle as used
  markPuzzleAsUsed(candidatePuzzle.start, candidatePuzzle.goal, puzzleIndex, today, wordLength);
  
  const maxMoves = Math.min(14, Math.max(10, minDist + 4));
  
  return {
    date: today,
    startWord: candidatePuzzle.start,
    goalWord: candidatePuzzle.goal,
    wordLength,
    maxMoves,
    minDistance: minDist,
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
