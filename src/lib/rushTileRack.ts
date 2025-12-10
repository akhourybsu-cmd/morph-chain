// Tile Rack Generator with Guaranteed Solvability for Morph Rush
import { getNeighbors, isValidWordByLen } from './rushLogic';

export interface TileRack {
  tiles: string[];
  guaranteedLetters: string[];
}

// Letter distribution weighted towards common letters
const LETTER_DISTRIBUTION = "EEEEAAAAOOOIIINNNRRRSSSTTTT" +
  "LLLUUUDDDDGGGBBCCMMPPFFHHVVWWYYKJXQZ";

/**
 * Get all letters that would create valid one-letter morphs from the current word
 */
function getValidMorphLetters(word: string, usedWords: Set<string>): Set<string> {
  const validLetters = new Set<string>();
  const neighbors = getNeighbors(word);
  const unusedNeighbors = neighbors.filter(n => !usedWords.has(n));
  
  for (const neighbor of unusedNeighbors) {
    for (let i = 0; i < word.length; i++) {
      if (neighbor[i] !== word[i]) {
        validLetters.add(neighbor[i]);
        break;
      }
    }
  }
  return validLetters;
}

/**
 * Check if a word has any valid morphs available
 */
export function hasValidMorphs(word: string, usedWords: Set<string>): boolean {
  const neighbors = getNeighbors(word);
  return neighbors.some(n => !usedWords.has(n));
}

/**
 * Generate a tile rack that always contains at least one letter that creates a valid morph
 */
export function generateTileRack(
  currentWord: string, 
  usedWords: Set<string>,
  rackSize: number = 8
): TileRack {
  const validLetters = getValidMorphLetters(currentWord, usedWords);
  
  // If no valid morphs exist, return empty rack (game should handle dead-end)
  if (validLetters.size === 0) {
    // Generate random tiles anyway - the game logic will detect the dead end
    const tiles: string[] = [];
    for (let i = 0; i < rackSize; i++) {
      tiles.push(LETTER_DISTRIBUTION[Math.floor(Math.random() * LETTER_DISTRIBUTION.length)]);
    }
    return { tiles, guaranteedLetters: [] };
  }
  
  // Pick 1-2 guaranteed letters from the valid set
  const guaranteedArray = Array.from(validLetters);
  const numGuaranteed = Math.min(2, guaranteedArray.length);
  const guaranteed: string[] = [];
  
  // Randomly select guaranteed letters
  for (let i = 0; i < numGuaranteed; i++) {
    const idx = Math.floor(Math.random() * guaranteedArray.length);
    guaranteed.push(guaranteedArray[idx]);
    guaranteedArray.splice(idx, 1);
  }
  
  // Fill remaining slots with weighted random letters
  const tiles: string[] = [...guaranteed];
  while (tiles.length < rackSize) {
    const randomLetter = LETTER_DISTRIBUTION[
      Math.floor(Math.random() * LETTER_DISTRIBUTION.length)
    ];
    tiles.push(randomLetter);
  }
  
  // Shuffle the tiles so guaranteed letters aren't always first
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  
  return {
    tiles,
    guaranteedLetters: guaranteed
  };
}

/**
 * Check if dropping a letter at a position creates a valid word
 */
export function checkDrop(
  currentWord: string,
  letter: string,
  position: number,
  usedWords: Set<string>
): { valid: boolean; newWord: string } {
  const newWord = currentWord.substring(0, position) + letter + currentWord.substring(position + 1);
  
  // Must be different from current word
  if (newWord === currentWord) {
    return { valid: false, newWord };
  }
  
  // Must not be already used
  if (usedWords.has(newWord)) {
    return { valid: false, newWord };
  }
  
  // Must be a valid dictionary word
  if (!isValidWordByLen(newWord)) {
    return { valid: false, newWord };
  }
  
  return { valid: true, newWord };
}
