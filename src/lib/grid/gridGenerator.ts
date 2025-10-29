// Generate 5x5 grid for MORPH GRID with balanced vowel/consonant placement
import { SeededRandom } from './seededRNG';
import {
  VOWEL_RATIO_TARGET,
  LETTER_WEIGHTS,
  VOWELS,
  SUPPORT_LETTERS,
  HARD_CLUSTER,
  MAX_HARD_CLUSTER_IN_3x3,
  MAX_VOWEL_RUN,
  GRID_SIZE,
  MAX_GENERATION_RETRIES
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
        ? rng.choice(LETTER_WEIGHTS.vowels)
        : rng.choice(LETTER_WEIGHTS.consonants);
      
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
  
  return grid;
}

export function getRandomLetter(isVowel: boolean, rng: SeededRandom): string {
  return isVowel 
    ? rng.choice(LETTER_WEIGHTS.vowels)
    : rng.choice(LETTER_WEIGHTS.consonants);
}

export function isVowelChar(char: string): boolean {
  return VOWELS.includes(char.toUpperCase());
}
