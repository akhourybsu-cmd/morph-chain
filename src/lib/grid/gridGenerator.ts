// Generate 5x5 grid for MORPH GRID
import { SeededRandom } from './seededRNG';

export interface Tile {
  id: string;
  char: string;
  isVowel: boolean;
  isPower: boolean;
  morphCount: number;
  stabilized: boolean;
  row: number;
  col: number;
}

const VOWELS = ['A', 'E', 'I', 'O', 'U'];
const CONSONANTS = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'];

// Weighted letter distribution for better gameplay
const LETTER_WEIGHTS = {
  vowels: ['A', 'E', 'E', 'I', 'O', 'U'], // More E's
  consonants: [
    'R', 'R', 'S', 'S', 'T', 'T', 'T', 'N', 'N', 'L', 'L', 'D', 'D',
    'C', 'C', 'M', 'P', 'H', 'G', 'B', 'F', 'W', 'Y', 'V', 'K',
    'J', 'Q', 'X', 'Z'
  ]
};

export function generateDailyGrid(date: string): Tile[][] {
  const rng = new SeededRandom(date);
  const grid: Tile[][] = [];
  
  for (let row = 0; row < 5; row++) {
    const gridRow: Tile[] = [];
    for (let col = 0; col < 5; col++) {
      const isVowel = rng.next() < 0.4; // 40% vowels
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
        col
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
