// Morph Rush Game Logic
import { VALID_WORDS_4, VALID_WORDS_5, VALID_WORDS_6 } from "./gameLogic";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";
import { startOfDay, differenceInDays } from "date-fns";

export interface RushWord {
  word: string;
  timestamp: Date;
  baseScore: number;
  rarityBonus: number;
  branchBonus: number;
  multiplier: number;
  totalScore: number;
}

export interface RushRun {
  mode: 'daily' | 'practice';
  startWord: string;
  words: RushWord[];
  usedWords: Set<string>;
  score: number;
  multiplierMax: number;
  invalidCount: number;
  scoutUsed: boolean;
  undoUsed: boolean;
  lastValidTime?: number;
  currentMultiplier: number;
  timerStarted: boolean;
  timeRemaining: number;
  isFinished: boolean;
}

// Dictionary validation by length
export const isValidWordByLen = (word: string): boolean => {
  const n = word.length;
  if (n === 4) return VALID_WORDS_4.has(word);
  if (n === 5) return VALID_WORDS_5.has(word);
  if (n === 6) return VALID_WORDS_6.has(word);
  return false;
};

// Get neighbors (words that differ by exactly 1 letter)
export const getNeighbors = (word: string): string[] => {
  const neighbors: string[] = [];
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const wordSet = word.length === 4 ? VALID_WORDS_4 : 
                  word.length === 5 ? VALID_WORDS_5 : 
                  VALID_WORDS_6;
  
  for (let i = 0; i < word.length; i++) {
    for (const letter of letters) {
      if (letter === word[i]) continue;
      const newWord = word.substring(0, i) + letter + word.substring(i + 1);
      if (wordSet.has(newWord)) {
        neighbors.push(newWord);
      }
    }
  }
  
  return neighbors;
};

// Calculate rarity bonus
export const calculateRarityBonus = (word: string): number => {
  const highValue = ['J', 'Q', 'X', 'Z'];
  const medValue = ['K', 'V', 'W', 'Y'];
  let bonus = 0;
  
  for (const letter of word) {
    if (highValue.includes(letter)) bonus += 25;
    else if (medValue.includes(letter)) bonus += 10;
  }
  
  return bonus;
};

// Calculate branch bonus
export const calculateBranchBonus = (word: string, usedWords: Set<string>): number => {
  const neighbors = getNeighbors(word);
  const unusedNeighbors = neighbors.filter(n => !usedWords.has(n));
  return unusedNeighbors.length >= 6 ? 20 : 0;
};

// Calculate flow multiplier
export const calculateFlowMultiplier = (
  currentMultiplier: number,
  lastValidTime: number | undefined,
  currentTime: number
): number => {
  if (!lastValidTime) return 1.0;
  
  const timeSinceLastValid = (currentTime - lastValidTime) / 1000;
  
  if (timeSinceLastValid > 5) {
    return 1.0; // Reset after 5 seconds
  } else {
    return Math.min(3.0, currentMultiplier + 0.1); // Increase by 0.1, cap at 3.0
  }
};

// Calculate word score
export const calculateWordScore = (
  word: string,
  usedWords: Set<string>,
  multiplier: number
): { base: number; rarity: number; branch: number; total: number } => {
  const base = 100;
  const rarity = calculateRarityBonus(word);
  const branch = calculateBranchBonus(word, usedWords);
  const total = Math.round((base + rarity + branch) * multiplier);
  
  return { base, rarity, branch, total };
};

// Calculate end-of-run bonuses
export const calculateEndBonuses = (words: RushWord[], invalidCount: number): {
  cleanRun: number;
  explorer: number;
  total: number;
} => {
  let cleanRun = 0;
  let explorer = 0;
  
  // Clean run: +100 if 0 invalid submissions
  if (invalidCount === 0) {
    cleanRun = 100;
  }
  
  // Explorer: +1% per unique first letter, cap at 26%
  const firstLetters = new Set(words.map(w => w.word[0]));
  const totalScore = words.reduce((sum, w) => sum + w.totalScore, 0);
  explorer = Math.floor(totalScore * firstLetters.size * 0.01);
  
  return {
    cleanRun,
    explorer,
    total: cleanRun + explorer
  };
};

// Get Scout hint (reveals an unused neighbor)
export const getScoutHint = (currentWord: string, usedWords: Set<string>): string | null => {
  const neighbors = getNeighbors(currentWord);
  const unusedNeighbors = neighbors.filter(n => !usedWords.has(n));
  
  if (unusedNeighbors.length === 0) return null;
  
  // Return a random unused neighbor
  return unusedNeighbors[Math.floor(Math.random() * unusedNeighbors.length)];
};

// Get daily puzzle info
export const getRushDailyPuzzle = (): {
  date: string;
  puzzleNumber: number;
  startWord: string;
} => {
  const timezone = "America/New_York";
  const nowNY = toZonedTime(new Date(), timezone);
  const todayNY = startOfDay(nowNY);
  const today = formatInTimeZone(nowNY, timezone, "yyyy-MM-dd");
  
  // Launch date: October 6, 2025 (NY time) is Puzzle #1
  const launchDateNY = startOfDay(toZonedTime(new Date('2025-10-06T00:00:00'), timezone));
  const daysSinceStart = differenceInDays(todayNY, launchDateNY);
  const puzzleNumber = daysSinceStart + 1;
  
  // Curated start words with good connectivity
  const startWords = [
    "CARE", "WORD", "TIME", "MAKE", "FIND", "GIVE", "WALK", "TALK",
    "WORK", "TURN", "CALL", "BACK", "HAND", "PART", "PLAY", "MOVE",
    "LIVE", "SEEM", "KNOW", "TAKE", "COME", "KEEP", "SIDE", "HOLD",
    "HEAR", "SHOW", "MEAN", "FEEL", "WELL", "PAST", "FACT", "FACE",
    "MIND", "LINE", "LONG", "CASE", "RISE", "FORM", "HOME", "NEED",
    "LATE", "HIGH", "HARD", "GOOD", "HELP", "OPEN", "LEAD", "READ"
  ];
  
  const startWord = startWords[puzzleNumber % startWords.length];
  
  return {
    date: today,
    puzzleNumber,
    startWord
  };
};

// Generate share text
export const generateRushShareText = (
  puzzleNumber: number,
  date: string,
  score: number,
  wordsCount: number,
  multiplierMax: number,
  mode: 'daily' | 'practice'
): string => {
  if (mode === 'practice') {
    return `Morph Rush Practice
Score: ${score.toLocaleString()} | ${wordsCount} words
Max Multiplier: ${multiplierMax.toFixed(1)}x
morphchaingame.com`;
  }
  
  const timezone = "America/New_York";
  const formattedDate = formatInTimeZone(new Date(), timezone, 'MMMM d, yyyy');
  
  return `Morph Rush #${puzzleNumber} - ${formattedDate}
🏆 ${score.toLocaleString()} points | ${wordsCount} words
⚡ ${multiplierMax.toFixed(1)}x max
morphchaingame.com`;
};
