// Puzzle acceptance gates to ensure fair difficulty across all word lengths

import { buildWordGraph, findAllShortestPaths, calculateAverageBranching } from "./puzzleValidator";

export interface PuzzleCandidate {
  start: string;
  goal: string;
  wordLength: 4 | 5 | 6;
}

// Gate 1: Minimum distance bands by word length
const MIN_DISTANCE_BANDS = {
  4: { min: 4, max: 7 },
  5: { min: 5, max: 8 },
  6: { min: 5, max: 9 },
};

// Gate 3: Robustness requirements
const ROBUSTNESS_REQUIREMENTS = {
  4: { minPaths: 10, minBranching: 0 }, // No branching requirement for 4L
  5: { minPaths: 10, minBranching: 0 }, // No branching requirement for 5L
  6: { minPaths: 8, minBranching: 2.3 },
};

/**
 * Gate 1: Check if words are same length and in largest component
 */
const passesComponentCheck = (start: string, goal: string, words: Set<string>): boolean => {
  if (start.length !== goal.length) return false;
  if (!words.has(start) || !words.has(goal)) return false;
  
  // Both must be in the word set (which is the largest component after filtering)
  return true;
};

/**
 * Gate 2: Check if minimum distance is within acceptable band
 */
const passesDistanceCheck = (
  minDistance: number,
  wordLength: 4 | 5 | 6
): boolean => {
  const band = MIN_DISTANCE_BANDS[wordLength];
  return minDistance >= band.min && minDistance <= band.max;
};

/**
 * Gate 3: Check robustness - multiple paths and branching
 */
const passesRobustnessCheck = (
  start: string,
  goal: string,
  words: Set<string>,
  wordLength: 4 | 5 | 6
): boolean => {
  const requirements = ROBUSTNESS_REQUIREMENTS[wordLength];
  const allPaths = findAllShortestPaths(start, goal, words);
  
  if (allPaths.length < requirements.minPaths) {
    return false;
  }
  
  // For 6L, also check average branching
  if (wordLength === 6 && requirements.minBranching > 0) {
    const avgBranching = calculateAverageBranching(start, goal, words);
    if (avgBranching < requirements.minBranching) {
      return false;
    }
  }
  
  return true;
};

/**
 * Gate 4: Letter sanity checks
 */
const passesLetterSanityCheck = (start: string, goal: string): boolean => {
  // Check for letter repeats (3+ times)
  const hasExcessiveRepeats = (word: string): boolean => {
    const letterCounts = new Map<string, number>();
    for (const letter of word) {
      letterCounts.set(letter, (letterCounts.get(letter) || 0) + 1);
      if (letterCounts.get(letter)! >= 3) return true;
    }
    return false;
  };
  
  if (hasExcessiveRepeats(start) || hasExcessiveRepeats(goal)) {
    return false;
  }
  
  // Check for at least two distinct vowels/consonants combined
  const hasBalancedComposition = (word: string): boolean => {
    const vowels = new Set(['A', 'E', 'I', 'O', 'U']);
    const uniqueVowels = new Set<string>();
    const uniqueConsonants = new Set<string>();
    
    for (const letter of word) {
      if (vowels.has(letter)) {
        uniqueVowels.add(letter);
      } else {
        uniqueConsonants.add(letter);
      }
    }
    
    // Need at least 2 total unique vowels + consonants combined
    return (uniqueVowels.size + uniqueConsonants.size) >= 2;
  };
  
  return hasBalancedComposition(start) && hasBalancedComposition(goal);
};

/**
 * Gate 5: At least one shortest path uses only modern/common words
 * (Already handled by filtering word list with Modern English criteria)
 */
const passesModernPathCheck = (
  start: string,
  goal: string,
  words: Set<string>
): boolean => {
  // If we can find any shortest path in our filtered word set, it's valid
  const allPaths = findAllShortestPaths(start, goal, words);
  return allPaths.length > 0;
};

/**
 * Master acceptance gate - checks all criteria
 */
export const meetsAcceptanceGates = (
  candidate: PuzzleCandidate,
  words: Set<string>,
  minDistance: number
): boolean => {
  const { start, goal, wordLength } = candidate;
  
  // Gate 1: Component check
  if (!passesComponentCheck(start, goal, words)) {
    return false;
  }
  
  // Gate 2: Distance band
  if (!passesDistanceCheck(minDistance, wordLength)) {
    return false;
  }
  
  // Gate 3: Robustness
  if (!passesRobustnessCheck(start, goal, words, wordLength)) {
    return false;
  }
  
  // Gate 4: Letter sanity
  if (!passesLetterSanityCheck(start, goal)) {
    return false;
  }
  
  // Gate 5: Modern path exists
  if (!passesModernPathCheck(start, goal, words)) {
    return false;
  }
  
  return true;
};

/**
 * Calculate move cap based on minimum distance
 * Formula: clamp(minDistance + 4, 10..14)
 */
export const calculateMoveCap = (minDistance: number): number => {
  const cap = minDistance + 4;
  return Math.min(14, Math.max(10, cap));
};

/**
 * Get hint count by word length
 */
export const getHintCount = (wordLength: 4 | 5 | 6): number => {
  return wordLength === 6 ? 2 : 1;
};
