import { TileState } from "@/components/HintTile";
import wordsAlphaText from "./words_alpha.txt?raw";
import { filterModernEnglish } from "./wordFilters";
import { isPuzzleSolvable, calculateMinDistance } from "./puzzleValidator";
import { CURATED_4L_PUZZLES } from "./curatedPuzzles4L";
import { CURATED_5L_PUZZLES } from "./curatedPuzzles5L";
import { CURATED_6L_PUZZLES } from "./curatedPuzzles6L";
import { markPuzzleAsUsed, getCurrentPuzzleIndex } from "./puzzleTracking";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";
import { startOfDay, differenceInDays } from "date-fns";

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
  puzzleIndex?: number;
}

export const getDailyPuzzle = (wordLength: 4 | 5 | 6 = 4): Puzzle & { puzzleIndex: number } => {
  const timezone = "America/New_York";
  
  // Get current date in NY timezone
  const nowNY = toZonedTime(new Date(), timezone);
  const todayNY = startOfDay(nowNY);
  const today = formatInTimeZone(nowNY, timezone, "yyyy-MM-dd");
  
  // Get appropriate word set
  const wordSet = wordLength === 4 ? VALID_WORDS_4 : wordLength === 5 ? VALID_WORDS_5 : VALID_WORDS_6;
  
  // Use curated pairs with tracking for all word lengths
  const curatedPuzzles = wordLength === 4 ? CURATED_4L_PUZZLES : 
                         wordLength === 5 ? CURATED_5L_PUZZLES : 
                         CURATED_6L_PUZZLES;
  
  // Launch date: October 6, 2025 (NY time) is Puzzle #1
  const launchDateNY = startOfDay(toZonedTime(new Date('2025-10-06T00:00:00'), timezone));
  const daysSinceStart = differenceInDays(todayNY, launchDateNY);
  const puzzleIndex = daysSinceStart % curatedPuzzles.length;
  const candidatePuzzle = curatedPuzzles[puzzleIndex];
  
  // Use pre-calculated minDist (fallback to runtime calculation if missing)
  const minDist = candidatePuzzle.minDist || 
    calculateMinDistance(candidatePuzzle.start, candidatePuzzle.goal, wordSet) || 
    (wordLength === 4 ? 4 : wordLength === 5 ? 5 : 6);
  
  // Mark this puzzle as used
  markPuzzleAsUsed(candidatePuzzle.start, candidatePuzzle.goal, puzzleIndex, today, wordLength);
  
  // Move cap formulas per recommendations:
  // 4L/5L: clamp(minDistance + 4, 10..14)
  // 6L: clamp(minDistance + 5, 10..14) (denser graph due to Δ≤2)
  const moveBonus = wordLength === 6 ? 5 : 4;
  const maxMoves = Math.min(14, Math.max(10, minDist + moveBonus));
  
  return {
    date: today,
    startWord: candidatePuzzle.start,
    goalWord: candidatePuzzle.goal,
    wordLength,
    maxMoves,
    minDistance: minDist,
    puzzleIndex,
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

export const hasValidNextMove = (
  word: string, 
  usedWords: Set<string>, 
  wordLength: number,
  allowTwoLetters: boolean = false
): boolean => {
  const wordSet = wordLength === 4 ? VALID_WORDS_4 : wordLength === 5 ? VALID_WORDS_5 : VALID_WORDS_6;
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  
  // Check one-letter changes
  for (let i = 0; i < word.length; i++) {
    for (const letter of letters) {
      if (letter === word[i]) continue;
      const newWord = word.substring(0, i) + letter + word.substring(i + 1);
      if (wordSet.has(newWord) && !usedWords.has(newWord)) {
        return true;
      }
    }
  }
  
  // Check two-letter changes if allowed
  if (allowTwoLetters) {
    for (let i = 0; i < word.length; i++) {
      for (let j = i + 1; j < word.length; j++) {
        for (const letter1 of letters) {
          if (letter1 === word[i]) continue;
          for (const letter2 of letters) {
            if (letter2 === word[j]) continue;
            const newWord = 
              word.substring(0, i) + 
              letter1 + 
              word.substring(i + 1, j) + 
              letter2 + 
              word.substring(j + 1);
            if (wordSet.has(newWord) && !usedWords.has(newWord)) {
              return true;
            }
          }
        }
      }
    }
  }
  
  return false;
};

export const generateShareText = (
  date: string,
  movesUsed: number,
  won: boolean,
  wordLength: number,
  sampleHints: TileState[][],
  maxMoves: number,
  puzzleIndex: number
): string => {
  const emojiMap: Record<TileState, string> = {
    match: "🟩",
    present: "🟧",
    miss: "⬛",
  };
  
  // Format date as "October 6, 2025" in NY timezone
  const timezone = "America/New_York";
  const formattedDate = formatInTimeZone(new Date(), timezone, 'MMMM d, yyyy');
  
  // Build the result line with boxes
  let resultLine = "";
  if (won) {
    // Show green boxes equal to word length
    resultLine = "🟩".repeat(wordLength) + ` ${movesUsed}`;
  } else {
    // Show the final attempt's hint pattern
    const finalHints = sampleHints[sampleHints.length - 1] || [];
    resultLine = finalHints.map((h) => emojiMap[h]).join("");
  }
  
  return `Puzzle #${puzzleIndex + 1} - ${formattedDate} - ${maxMoves} Max Attempts
${wordLength}L ${resultLine}
https://play.morphchain.app`;
};
