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
