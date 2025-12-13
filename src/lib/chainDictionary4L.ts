/**
 * Expanded 4-letter dictionary for Morph Chain word validation.
 * Uses a broader wordlist for accepting player submissions while
 * puzzle generation (start/goal words) uses CURATED_4L_WORDS.
 */

import wordlistContent from './wordlist_fours.txt?raw';

let expandedWords4L: Set<string> | null = null;

/**
 * Lazily loads and returns the expanded 4-letter dictionary.
 * Words are normalized to uppercase for consistent matching.
 */
export function getExpanded4LDictionary(): Set<string> {
  if (expandedWords4L) {
    return expandedWords4L;
  }

  const words = wordlistContent
    .split('\n')
    .map(word => word.trim().toUpperCase())
    .filter(word => word.length === 4 && /^[A-Z]+$/.test(word));

  expandedWords4L = new Set(words);
  console.log(`Loaded ${expandedWords4L.size} expanded 4-letter words`);
  
  return expandedWords4L;
}

/**
 * Check if a word exists in the expanded 4-letter dictionary.
 */
export function isValidExpanded4LWord(word: string): boolean {
  return getExpanded4LDictionary().has(word.toUpperCase());
}
