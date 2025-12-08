// Nightly preflight check for daily puzzles
// Verifies solvability and generates reserve queue

import { validatePuzzlePair, precomputePuzzleData } from './puzzleValidatorV2';
import { VALID_WORDS_4, VALID_WORDS_5 } from './gameLogic';

export interface PreflightResult {
  success: boolean;
  puzzleData?: {
    minDistance: number;
    pathCount: number;
    avgBranching: number;
    moveCap: number;
  };
  errors?: string[];
  warnings?: string[];
}

/**
 * Run preflight check on a scheduled puzzle
 * This is what you run the night before to guarantee the puzzle is good
 */
export const runPreflightCheck = (
  start: string,
  goal: string,
  wordLength: 4 | 5 | 6
): PreflightResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Get appropriate word set (Core spec: only 4L and 5L supported)
  const wordSet = wordLength === 4 ? VALID_WORDS_4 : VALID_WORDS_5;
  
  // Letter sanity checks
  const checkLetterSanity = (word: string): string[] => {
    const issues: string[] = [];
    
    // Check for triple letters
    const letterCounts = new Map<string, number>();
    for (const letter of word) {
      letterCounts.set(letter, (letterCounts.get(letter) || 0) + 1);
      if (letterCounts.get(letter)! >= 3) {
        issues.push(`Word '${word}' has letter '${letter}' repeated 3+ times`);
      }
    }
    
    // Check vowel/consonant balance
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
    
    if (uniqueVowels.size + uniqueConsonants.size < 2) {
      issues.push(`Word '${word}' has poor letter diversity`);
    }
    
    return issues;
  };
  
  errors.push(...checkLetterSanity(start));
  errors.push(...checkLetterSanity(goal));
  
  // Validate the puzzle pair
  const validation = validatePuzzlePair(start, goal, wordLength, wordSet);
  
  if (!validation.solvable) {
    errors.push(`Puzzle not solvable: ${validation.failureReason}`);
    return { success: false, errors, warnings };
  }
  
  if (!validation.meetsGates) {
    errors.push(`Puzzle fails quality gates: ${validation.failureReason}`);
  }
  
  // Check for edge cases
  if (validation.pathCount < 5) {
    warnings.push(`Low path count (${validation.pathCount}) - puzzle may feel narrow`);
  }
  
  if (wordLength === 6 && validation.avgBranching < 2.0) {
    warnings.push(`Low branching (${validation.avgBranching.toFixed(2)}) for 6L puzzle`);
  }
  
  if (validation.minDistance < 3) {
    warnings.push('Very short puzzle - may be too easy');
  }
  
  if (validation.minDistance > 8) {
    warnings.push('Very long puzzle - may be too hard');
  }
  
  // Precompute data for runtime
  const precomputed = precomputePuzzleData(start, goal, wordLength, wordSet);
  
  if (!precomputed) {
    errors.push('Failed to precompute puzzle data');
    return { success: false, errors, warnings };
  }
  
  const success = errors.length === 0;
  
  return {
    success,
    puzzleData: {
      minDistance: validation.minDistance,
      pathCount: validation.pathCount,
      avgBranching: validation.avgBranching,
      moveCap: precomputed.moveCap
    },
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined
  };
};

/**
 * Batch preflight check for multiple puzzles
 * Useful for validating a week or month of puzzles at once
 */
export const runBatchPreflightCheck = (
  puzzles: Array<{ start: string; goal: string; wordLength: 4 | 5 | 6; date?: string }>
): Map<string, PreflightResult> => {
  const results = new Map<string, PreflightResult>();
  
  for (let i = 0; i < puzzles.length; i++) {
    const puzzle = puzzles[i];
    const key = puzzle.date || `puzzle_${i}`;
    const result = runPreflightCheck(puzzle.start, puzzle.goal, puzzle.wordLength);
    results.set(key, result);
  }
  
  return results;
};

/**
 * Generate a report summary for a batch of preflight checks
 */
export const generatePreflightReport = (
  results: Map<string, PreflightResult>
): string => {
  const total = results.size;
  const passed = Array.from(results.values()).filter(r => r.success).length;
  const failed = total - passed;
  
  let report = `Preflight Check Report\n`;
  report += `======================\n\n`;
  report += `Total puzzles: ${total}\n`;
  report += `Passed: ${passed}\n`;
  report += `Failed: ${failed}\n\n`;
  
  if (failed > 0) {
    report += `Failed Puzzles:\n`;
    report += `---------------\n`;
    for (const [key, result] of results.entries()) {
      if (!result.success) {
        report += `\n${key}:\n`;
        if (result.errors) {
          result.errors.forEach(error => report += `  ❌ ${error}\n`);
        }
      }
    }
  }
  
  // Show warnings
  const withWarnings = Array.from(results.entries()).filter(([_, r]) => r.warnings && r.warnings.length > 0);
  if (withWarnings.length > 0) {
    report += `\nPuzzles with Warnings:\n`;
    report += `----------------------\n`;
    for (const [key, result] of withWarnings) {
      report += `\n${key}:\n`;
      if (result.warnings) {
        result.warnings.forEach(warning => report += `  ⚠️  ${warning}\n`);
      }
    }
  }
  
  return report;
};
