// Puzzle pair selection guardrails for Morph Chain
// Implements quality gates and variety mechanisms

interface PuzzlePair {
  start: string;
  goal: string;
  minDistance: number;
}

interface PuzzleMetadata {
  pair: PuzzlePair;
  lastUsed?: string; // ISO date string
  usageCount: number;
  wordLength: 4 | 5 | 6;
}

const PAIR_COOLDOWN_DAYS = 730; // 24 months
const WORD_COOLDOWN_DAYS = 60; // 60 days for start/goal words
const DIVERSITY_WINDOW_DAYS = 14;
const MAX_SAME_LETTER_IN_WINDOW = 3;

/**
 * Check if a puzzle pair meets distance requirements
 */
export const meetsDistanceRequirements = (
  minDistance: number,
  wordLength: 4 | 5 | 6
): boolean => {
  const requirements = {
    4: { min: 4, max: 7 },
    5: { min: 5, max: 8 },
    6: { min: 5, max: 9 },
  };
  
  const range = requirements[wordLength];
  return minDistance >= range.min && minDistance <= range.max;
};

/**
 * Calculate dynamic move cap based on minDistance
 */
export const calculateMoveCap = (minDistance: number): number => {
  return Math.min(14, Math.max(10, minDistance + 4));
};

/**
 * Check if a word has valid letter composition
 */
export const hasValidLetterComposition = (word: string): boolean => {
  const upper = word.toUpperCase();
  const letters = upper.split('');
  
  // No 3-of-a-kind letters
  const letterCounts = new Map<string, number>();
  for (const letter of letters) {
    letterCounts.set(letter, (letterCounts.get(letter) || 0) + 1);
    if (letterCounts.get(letter)! >= 3) {
      return false;
    }
  }
  
  // At least two distinct vowels + consonants combined
  const vowels = new Set(['A', 'E', 'I', 'O', 'U']);
  const uniqueVowels = new Set(letters.filter(l => vowels.has(l)));
  const uniqueConsonants = new Set(letters.filter(l => !vowels.has(l)));
  
  return uniqueVowels.size >= 1 && uniqueConsonants.size >= 1;
};

/**
 * Check if a puzzle pair meets all quality criteria
 */
export const meetsQualityCriteria = (
  pair: PuzzlePair,
  wordLength: 4 | 5 | 6
): boolean => {
  // Distance requirements
  if (!meetsDistanceRequirements(pair.minDistance, wordLength)) {
    return false;
  }
  
  // Letter composition
  if (!hasValidLetterComposition(pair.start) || !hasValidLetterComposition(pair.goal)) {
    return false;
  }
  
  return true;
};

/**
 * Check if a word can be used (not in cooldown)
 */
export const canUseWord = (
  word: string,
  wordLength: 4 | 5 | 6,
  currentDate: Date,
  wordUsageHistory: Map<string, string>
): boolean => {
  const key = `${word}_${wordLength}`;
  const lastUsed = wordUsageHistory.get(key);
  
  if (!lastUsed) {
    return true; // Never used
  }
  
  const lastUsedDate = new Date(lastUsed);
  const daysSinceUse = Math.floor(
    (currentDate.getTime() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return daysSinceUse >= WORD_COOLDOWN_DAYS;
};

/**
 * Check if a pair can be used (not in cooldown)
 */
export const canUsePair = (
  pair: PuzzlePair,
  currentDate: Date,
  pairUsageHistory: Map<string, string>
): boolean => {
  const pairKey = `${pair.start}_${pair.goal}`;
  const lastUsed = pairUsageHistory.get(pairKey);
  
  if (!lastUsed) {
    return true; // Never used
  }
  
  const lastUsedDate = new Date(lastUsed);
  const daysSinceUse = Math.floor(
    (currentDate.getTime() - lastUsedDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return daysSinceUse >= PAIR_COOLDOWN_DAYS;
};

/**
 * Check diversity constraints for recent puzzles
 */
export const meetsDiversityRequirements = (
  startWord: string,
  goalWord: string,
  recentPuzzles: Array<{ start: string; goal: string; date: string }>,
  currentDate: Date
): boolean => {
  // Filter puzzles from the last 14 days
  const windowStart = new Date(currentDate);
  windowStart.setDate(windowStart.getDate() - DIVERSITY_WINDOW_DAYS);
  
  const recentInWindow = recentPuzzles.filter(p => {
    const puzzleDate = new Date(p.date);
    return puzzleDate >= windowStart && puzzleDate <= currentDate;
  });
  
  if (recentInWindow.length === 0) {
    return true; // No recent puzzles to compare
  }
  
  // Count same start letter
  const startLetter = startWord[0];
  const sameStartLetter = recentInWindow.filter(p => p.start[0] === startLetter).length;
  
  // Count same goal letter
  const goalLetter = goalWord[0];
  const sameGoalLetter = recentInWindow.filter(p => p.goal[0] === goalLetter).length;
  
  return sameStartLetter < MAX_SAME_LETTER_IN_WINDOW && 
         sameGoalLetter < MAX_SAME_LETTER_IN_WINDOW;
};

/**
 * Calculate hint count based on word length
 */
export const getHintCount = (wordLength: 4 | 5 | 6): number => {
  return wordLength === 6 ? 2 : 1;
};
