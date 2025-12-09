// Generate 5x5 grid for MORPH GRID with balanced vowel/consonant placement
import { SeededRandom } from './seededRNG';
import {
  VOWEL_RATIO_TARGET,
  LETTER_WEIGHTS,
  VOWELS,
  GRID_SIZE,
  MAX_GENERATION_RETRIES,
  LETTER_LIMITS,
  RARE_LETTERS,
  RARE_LETTER_CHANCE
} from './gridConfig';
import { validateGridConstraints, repairGridConstraints, generateSafeTemplate } from './gridValidation';

export type ProgressState = 0 | 1 | 2; // 0=Orange, 1=Blue, 2=Purple

export interface Tile {
  id: string;
  char: string;
  isVowel: boolean;
  isPower: boolean;
  morphCount: number;
  stabilized: boolean;
  row: number;
  col: number;
  progress: ProgressState;
}

export function generateDailyGrid(date: string): Tile[][] {
  const rng = new SeededRandom(date);
  
  // Try to generate a balanced grid
  for (let attempt = 0; attempt < MAX_GENERATION_RETRIES; attempt++) {
    const attemptRng = new SeededRandom(`${date}-gen-${attempt}`);
    const grid = generateGridAttempt(attemptRng);
    
    if (validateGridConstraints(grid)) {
      console.log(`✓ Grid generated successfully on attempt ${attempt + 1}`);
      return grid;
    }
    
    // Try to repair instead of regenerating
    if (attempt > 10 && attempt % 5 === 0) {
      const repaired = repairGridConstraints(grid, attemptRng);
      if (validateGridConstraints(repaired)) {
        console.log(`✓ Grid repaired successfully on attempt ${attempt + 1}`);
        return repaired;
      }
    }
  }
  
  // Fallback: generate a safe template
  console.warn('Using fallback safe template');
  return generateSafeTemplate(rng);
}

function generateGridAttempt(rng: SeededRandom): Tile[][] {
  const grid: Tile[][] = [];
  const totalCells = GRID_SIZE * GRID_SIZE;
  const targetVowels = Math.floor(totalCells * VOWEL_RATIO_TARGET);
  
  // Track letter counts for limiting uncommon letters
  const letterCounts: Record<string, number> = {};
  
  // Pre-allocate vowel positions
  const vowelPositions = new Set<string>();
  while (vowelPositions.size < targetVowels) {
    const row = rng.nextInt(0, GRID_SIZE);
    const col = rng.nextInt(0, GRID_SIZE);
    vowelPositions.add(`${row}-${col}`);
  }
  
  for (let row = 0; row < GRID_SIZE; row++) {
    const gridRow: Tile[] = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      const isVowel = vowelPositions.has(`${row}-${col}`);
      const char = isVowel 
        ? getConstrainedLetter(LETTER_WEIGHTS.vowels, letterCounts, rng, true)
        : getConstrainedLetter(LETTER_WEIGHTS.consonants, letterCounts, rng, false);
      
      // Track the letter count
      letterCounts[char] = (letterCounts[char] || 0) + 1;
      
      gridRow.push({
        id: `${row}-${col}`,
        char,
        isVowel,
        isPower: false,
        morphCount: 0,
        stabilized: false,
        row,
        col,
        progress: 0
      });
    }
    grid.push(gridRow);
  }
  
  // Optionally add one rare letter (J, Q, X, Z) with 10% chance
  if (rng.next() < RARE_LETTER_CHANCE) {
    const rareLetter = rng.choice(RARE_LETTERS);
    // Only add if we haven't already hit the limit (shouldn't happen, but safety check)
    if ((letterCounts[rareLetter] || 0) < (LETTER_LIMITS[rareLetter] || 1)) {
      // Find a random consonant position to replace
      const consonantPositions: { row: number; col: number }[] = [];
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (!grid[r][c].isVowel) {
            consonantPositions.push({ row: r, col: c });
          }
        }
      }
      if (consonantPositions.length > 0) {
        const pos = consonantPositions[rng.nextInt(0, consonantPositions.length)];
        grid[pos.row][pos.col].char = rareLetter;
      }
    }
  }
  
  return grid;
}

/**
 * Get a letter from the pool that respects occurrence limits
 */
function getConstrainedLetter(
  pool: string[], 
  counts: Record<string, number>, 
  rng: SeededRandom,
  isVowel: boolean
): string {
  const maxAttempts = 20;
  
  for (let i = 0; i < maxAttempts; i++) {
    const letter = rng.choice(pool);
    const limit = LETTER_LIMITS[letter];
    
    // If no limit defined, or under the limit, use this letter
    if (limit === undefined || (counts[letter] || 0) < limit) {
      return letter;
    }
  }
  
  // Fallback: pick a safe common letter that won't have limits
  return isVowel ? 'E' : rng.choice(['R', 'S', 'T', 'N', 'L']);
}

export function getRandomLetter(isVowel: boolean, rng: SeededRandom): string {
  return isVowel 
    ? rng.choice(LETTER_WEIGHTS.vowels)
    : rng.choice(LETTER_WEIGHTS.consonants);
}

export function isVowelChar(char: string): boolean {
  return VOWELS.includes(char.toUpperCase());
}
