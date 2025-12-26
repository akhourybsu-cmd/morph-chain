/**
 * 5-Letter Word Dictionary for Morph Chain
 * 
 * Uses official TWL06 Scrabble dictionary for word validation.
 */

import { getScrabbleWords, isValidScrabbleWordByLength } from './scrabbleDictionary';

/**
 * Get the full set of valid 5-letter words.
 */
export function getExpanded5LDictionary(): Set<string> {
  return getScrabbleWords(5);
}

/**
 * Alias for backwards compatibility.
 */
export function loadExpanded5LDictionary(): Set<string> {
  return getScrabbleWords(5);
}

/**
 * Check if a word is valid in the 5-letter dictionary.
 */
export function isValidExpanded5LWord(word: string): boolean {
  return isValidScrabbleWordByLength(word, 5);
}
