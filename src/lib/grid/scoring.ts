// Scoring system for MORPH GRID
import { Tile } from './gridGenerator';

const RARE_LETTERS = new Set(['J', 'Q', 'X', 'Z', 'K', 'V']);

export interface WordScore {
  base: number;
  rarity: number;
  ripple: number;
  power: number;
  total: number;
}

const WORD_LENGTH_SCORES: { [key: number]: number } = {
  4: 20,
  5: 40,
  6: 65,
  7: 95
};

export function calculateWordScore(
  word: string,
  tiles: Tile[],
  rippleMutations: number,
  hasPowerTile: boolean
): WordScore {
  // Base score by word length
  const length = word.length;
  let base = WORD_LENGTH_SCORES[length] || 0;
  
  if (length > 7) {
    base = 95 + (length - 7) * 15;
  }
  
  // Rarity bonus (10% for each rare letter)
  let rarityMultiplier = 1.0;
  for (const char of word.toUpperCase()) {
    if (RARE_LETTERS.has(char)) {
      rarityMultiplier += 0.1;
    }
  }
  
  const rarity = Math.round(base * (rarityMultiplier - 1.0));
  
  // Ripple bonus (+1 per mutated neighbor)
  const ripple = rippleMutations;
  
  // Power bonus (+20 if word contains a power tile)
  const power = hasPowerTile ? 20 : 0;
  
  const total = base + rarity + ripple + power;
  
  return {
    base,
    rarity,
    ripple,
    power,
    total
  };
}

export interface GameStats {
  finalScore: number;
  wordsFormed: string[];
  longestWord: string;
  morphCount: number;
  stabilizationCount: number;
}