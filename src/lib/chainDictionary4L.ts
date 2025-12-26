/**
 * 4-Letter Word Dictionary for Morph Chain
 * 
 * Uses official TWL06 Scrabble dictionary for word validation.
 */

import { getScrabbleWords, isValidScrabbleWordByLength } from './scrabbleDictionary';

/**
 * Get the full set of valid 4-letter words.
 */
export function getExpanded4LDictionary(): Set<string> {
  return getScrabbleWords(4);
}

/**
 * Check if a word is valid in the 4-letter dictionary.
 */
export function isValidExpanded4LWord(word: string): boolean {
  return isValidScrabbleWordByLength(word, 4);
}
