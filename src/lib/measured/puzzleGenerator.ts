// MEASURED - Puzzle Generator
// Uses reverse construction to guarantee unique solutions

export interface PuzzleSolution {
  A: number;
  B: number;
  C: number;
  D: number;
}

export interface GeneratedPuzzle {
  tiles: number[];
  solution: PuzzleSolution;
  target: number;
  nearMissCount: number;
  isUnique: boolean;
}

interface GeneratorConfig {
  minTile: number;
  maxTile: number;
  tileCount: number;
  maxAttempts: number;
}

const DEFAULT_CONFIG: GeneratorConfig = {
  minTile: 1,
  maxTile: 25,
  tileCount: 10,
  maxAttempts: 5000,
};

/**
 * Compute the equation result: (A × B) + C − D
 */
function compute(A: number, B: number, C: number, D: number): number {
  return (A * B) + C - D;
}

/**
 * Get a random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Find a valid solution (A, B, C, D) for a given target
 */
function findSolution(
  target: number,
  config: GeneratorConfig
): PuzzleSolution | null {
  const { minTile, maxTile, maxAttempts } = config;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const A = randomInt(minTile, maxTile);
    const B = randomInt(minTile, maxTile);
    const C = randomInt(minTile, maxTile);
    
    // Calculate D: D = (A*B) + C - target
    const D = (A * B) + C - target;
    
    // Validate D is within tile range
    if (D < minTile || D > maxTile) {
      continue;
    }
    
    // Ensure no negative intermediate results (A*B is always positive for positive A,B)
    const intermediate = A * B;
    if (intermediate < 0) {
      continue;
    }
    
    // Avoid trivial solutions where tiles equal target
    if (A === target || B === target || C === target || D === target) {
      continue;
    }
    
    return { A, B, C, D };
  }
  
  return null;
}

/**
 * Generate decoy tiles that create near-misses
 */
function generateDecoys(
  solution: PuzzleSolution,
  target: number,
  config: GeneratorConfig,
  count: number
): number[] {
  const { minTile, maxTile } = config;
  const solutionTiles = [solution.A, solution.B, solution.C, solution.D];
  const decoys: number[] = [];
  
  // Add "tempting" decoys - close to solution values
  const temptingDecoys = [
    solution.A + 1, solution.A - 1,
    solution.B + 1, solution.B - 1,
    solution.C + 1, solution.C - 1,
    solution.D + 1, solution.D - 1,
  ].filter(d => d >= minTile && d <= maxTile && !solutionTiles.includes(d));
  
  // Add some tempting decoys
  const shuffledTempting = shuffle(temptingDecoys);
  for (let i = 0; i < Math.min(3, shuffledTempting.length) && decoys.length < count; i++) {
    if (!decoys.includes(shuffledTempting[i])) {
      decoys.push(shuffledTempting[i]);
    }
  }
  
  // Fill remaining with random values
  let attempts = 0;
  while (decoys.length < count && attempts < 1000) {
    const d = randomInt(minTile, maxTile);
    if (!solutionTiles.includes(d) && !decoys.includes(d)) {
      decoys.push(d);
    }
    attempts++;
  }
  
  return decoys;
}

/**
 * Check if a tile set has a unique solution for the target
 * Returns the count of exact matches and near-misses
 */
function checkUniqueness(
  tiles: number[],
  target: number
): { exactCount: number; nearMissCount: number } {
  let exactCount = 0;
  let nearMissCount = 0;
  const threshold = Math.max(1, Math.round(target * 0.1)); // 10% threshold for near-miss
  
  // Generate all permutations of 4 tiles from the set
  const n = tiles.length;
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      for (let k = 0; k < n; k++) {
        if (k === i || k === j) continue;
        for (let l = 0; l < n; l++) {
          if (l === i || l === j || l === k) continue;
          
          const result = compute(tiles[i], tiles[j], tiles[k], tiles[l]);
          
          if (result === target) {
            exactCount++;
          } else if (Math.abs(result - target) <= threshold) {
            nearMissCount++;
          }
        }
      }
    }
  }
  
  return { exactCount, nearMissCount };
}

/**
 * Generate a puzzle with a unique solution
 */
export function generatePuzzle(
  target: number,
  config: Partial<GeneratorConfig> = {}
): GeneratedPuzzle | null {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const decoyCount = fullConfig.tileCount - 4;
  
  // Try multiple times to find a puzzle with unique solution
  for (let attempt = 0; attempt < 100; attempt++) {
    const solution = findSolution(target, fullConfig);
    
    if (!solution) {
      continue;
    }
    
    const solutionTiles = [solution.A, solution.B, solution.C, solution.D];
    const decoys = generateDecoys(solution, target, fullConfig, decoyCount);
    
    if (decoys.length < decoyCount) {
      continue;
    }
    
    const tiles = shuffle([...solutionTiles, ...decoys]);
    const { exactCount, nearMissCount } = checkUniqueness(tiles, target);
    
    // We want exactly 1 solution and at least 3 near-misses for good gameplay
    if (exactCount === 1 && nearMissCount >= 3) {
      return {
        tiles,
        solution,
        target,
        nearMissCount,
        isUnique: true,
      };
    }
  }
  
  return null;
}

/**
 * Verify that a puzzle has a unique solution
 */
export function verifyPuzzle(
  tiles: number[],
  solution: PuzzleSolution,
  target: number
): boolean {
  // First verify the solution is correct
  const result = compute(solution.A, solution.B, solution.C, solution.D);
  if (result !== target) {
    return false;
  }
  
  // Check uniqueness
  const { exactCount } = checkUniqueness(tiles, target);
  return exactCount === 1;
}

/**
 * Get difficulty based on target range and tile range
 */
export function getDifficulty(
  target: number,
  maxTile: number
): 'easy' | 'medium' | 'hard' {
  if (maxTile > 25) return 'hard';
  if (target > 500) return 'medium';
  return 'easy';
}
