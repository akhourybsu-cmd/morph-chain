// Comprehensive puzzle validator using pattern buckets and component analysis
// Implements the battle-tested algorithm for guaranteed solvability and difficulty rating

import {
  getCachedBucketIndex,
  neighborsDelta1,
  neighborsDelta2,
  BucketIndex
} from './puzzleBucketIndex';
import {
  getCachedComponents,
  inSameComponent,
  is5LSolvable
} from './puzzleComponentAnalysis';
import {
  reverseBfs,
  calculate4LStats,
  calculate5LStats,
  calculate6LStats,
  precomputeDistanceArrays
} from './puzzleDistanceCalculator';

export interface PuzzleValidationResult {
  solvable: boolean;
  minDistance: number;
  pathCount: number;
  avgBranching: number;
  meetsGates: boolean;
  failureReason?: string;
}

export interface PrecomputedPuzzleData {
  startWord: string;
  goalWord: string;
  wordLength: 4 | 5 | 6;
  minDistance: number;
  pathCount: number;
  avgBranching: number;
  moveCap: number;
  hints: number;
  distArrayDelta1: Int16Array;
  distArrayDelta2: Int16Array;
}

/**
 * Validate a puzzle pair with instant O(1) component check
 * Returns comprehensive stats for difficulty rating
 */
export const validatePuzzlePair = (
  start: string,
  goal: string,
  wordLength: 4 | 5 | 6,
  words: Set<string>
): PuzzleValidationResult => {
  start = start.toUpperCase();
  goal = goal.toUpperCase();
  
  // Step 1: Basic validation
  if (!words.has(start) || !words.has(goal)) {
    return {
      solvable: false,
      minDistance: Infinity,
      pathCount: 0,
      avgBranching: 0,
      meetsGates: false,
      failureReason: 'Words not in dictionary'
    };
  }
  
  if (start.length !== goal.length || start.length !== wordLength) {
    return {
      solvable: false,
      minDistance: Infinity,
      pathCount: 0,
      avgBranching: 0,
      meetsGates: false,
      failureReason: 'Word length mismatch'
    };
  }
  
  // Step 2: Build bucket index and components (cached)
  const index = getCachedBucketIndex(words);
  const components = getCachedComponents(words, index);
  
  // Step 3: Instant O(1) solvability check via components
  let solvable = false;
  
  if (wordLength === 4) {
    // 4L: Check Δ=1 component
    solvable = inSameComponent(start, goal, components.delta1Components, index);
  } else if (wordLength === 5) {
    // 5L: Check if any Δ≤2 neighbor of start shares Δ=1 component with goal
    solvable = is5LSolvable(start, goal, components.delta1Components, index);
  } else if (wordLength === 6) {
    // 6L: Check Δ≤2 component
    solvable = inSameComponent(start, goal, components.delta2Components, index);
  }
  
  if (!solvable) {
    return {
      solvable: false,
      minDistance: Infinity,
      pathCount: 0,
      avgBranching: 0,
      meetsGates: false,
      failureReason: 'Not in same connected component'
    };
  }
  
  // Step 4: Calculate distance and path statistics
  const goalId = index.wordToId.get(goal);
  if (goalId === undefined) {
    return {
      solvable: false,
      minDistance: Infinity,
      pathCount: 0,
      avgBranching: 0,
      meetsGates: false,
      failureReason: 'Goal word not found in index'
    };
  }
  
  let stats;
  
  if (wordLength === 4) {
    // 4L: Use Δ=1 graph
    const distArray = reverseBfs(
      goalId,
      words.size,
      (wordId) => neighborsDelta1(index.idToWord.get(wordId)!, index),
      index
    );
    stats = calculate4LStats(start, goal, index, distArray);
  } else if (wordLength === 5) {
    // 5L: Use Δ=1 graph (first move is special)
    const distArray = reverseBfs(
      goalId,
      words.size,
      (wordId) => neighborsDelta1(index.idToWord.get(wordId)!, index),
      index
    );
    stats = calculate5LStats(start, goal, index, distArray);
  } else {
    // 6L: Use Δ≤2 graph
    const distArray = reverseBfs(
      goalId,
      words.size,
      (wordId) => neighborsDelta2(index.idToWord.get(wordId)!, index),
      index
    );
    stats = calculate6LStats(start, goal, index, distArray);
  }
  
  // Step 5: Check against acceptance gates
  const gates = checkAcceptanceGates(stats, wordLength);
  
  return {
    solvable: true,
    minDistance: stats.minDistance,
    pathCount: stats.pathCount,
    avgBranching: stats.avgBranching,
    meetsGates: gates.passes,
    failureReason: gates.passes ? undefined : gates.reason
  };
};

/**
 * Check if puzzle meets acceptance gates from the comprehensive algorithm
 */
const checkAcceptanceGates = (
  stats: { minDistance: number; pathCount: number; avgBranching: number },
  wordLength: 4 | 5 | 6
): { passes: boolean; reason?: string } => {
  // Distance bands
  const distanceBands = {
    4: { min: 4, max: 7 },
    5: { min: 5, max: 8 },
    6: { min: 3, max: 7 }
  };
  
  const band = distanceBands[wordLength];
  if (stats.minDistance < band.min || stats.minDistance > band.max) {
    return {
      passes: false,
      reason: `Distance ${stats.minDistance} outside acceptable band [${band.min}, ${band.max}]`
    };
  }
  
  // Path count requirements
  const pathRequirements = {
    4: 10,
    5: 10,
    6: 12
  };
  
  if (stats.pathCount < pathRequirements[wordLength]) {
    return {
      passes: false,
      reason: `Path count ${stats.pathCount} below minimum ${pathRequirements[wordLength]}`
    };
  }
  
  // Branching requirements (6L only)
  if (wordLength === 6) {
    const minBranching = 2.7;
    if (stats.avgBranching < minBranching) {
      return {
        passes: false,
        reason: `Average branching ${stats.avgBranching.toFixed(2)} below minimum ${minBranching}`
      };
    }
  }
  
  return { passes: true };
};

/**
 * Precompute and cache all data needed for runtime O(1) operations
 * This is what you run the night before for daily puzzles
 */
export const precomputePuzzleData = (
  start: string,
  goal: string,
  wordLength: 4 | 5 | 6,
  words: Set<string>
): PrecomputedPuzzleData | null => {
  const validation = validatePuzzlePair(start, goal, wordLength, words);
  
  if (!validation.solvable || !validation.meetsGates) {
    console.error(`Puzzle failed validation: ${validation.failureReason}`);
    return null;
  }
  
  // Pre-compute distance arrays for runtime
  const index = getCachedBucketIndex(words);
  const { distDelta1, distDelta2 } = precomputeDistanceArrays(goal, index);
  
  // Calculate move cap: clamp(minDistance + bonus, 10..14)
  const moveBonus = wordLength === 6 ? 5 : 4;
  const moveCap = Math.min(14, Math.max(10, validation.minDistance + moveBonus));
  
  // Hint count
  const hints = wordLength === 6 ? 2 : 1;
  
  return {
    startWord: start,
    goalWord: goal,
    wordLength,
    minDistance: validation.minDistance,
    pathCount: validation.pathCount,
    avgBranching: validation.avgBranching,
    moveCap,
    hints,
    distArrayDelta1: distDelta1,
    distArrayDelta2: distDelta2
  };
};

/**
 * Runtime check: Is a move getting closer to goal? (O(1) with precomputed dist array)
 */
export const isMovingCloser = (
  currentWord: string,
  nextWord: string,
  goalWord: string,
  wordLength: 4 | 5 | 6,
  words: Set<string>
): 'closer' | 'sideways' | 'farther' | 'invalid' => {
  const index = getCachedBucketIndex(words);
  const { distDelta1, distDelta2 } = precomputeDistanceArrays(goalWord, index);
  
  const currentId = index.wordToId.get(currentWord);
  const nextId = index.wordToId.get(nextWord);
  
  if (currentId === undefined || nextId === undefined) {
    return 'invalid';
  }
  
  // Use appropriate distance array based on word length
  const distArray = wordLength === 6 ? distDelta2 : distDelta1;
  
  const currentDist = distArray[currentId];
  const nextDist = distArray[nextId];
  
  if (nextDist < currentDist) return 'closer';
  if (nextDist === currentDist) return 'sideways';
  return 'farther';
};
