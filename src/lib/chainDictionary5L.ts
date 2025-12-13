/**
 * 5-Letter Word Dictionary for Morph Chain
 * 
 * Uses an expanded wordlist (~16k words) for validating player moves,
 * while puzzle start/goal words use the curated common word list.
 */

import wordlistFives from './wordlist_fives.txt?raw';

// Load the expanded 5-letter wordlist for move validation
let expandedWords5L: Set<string> | null = null;

export function loadExpanded5LDictionary(): Set<string> {
  if (expandedWords5L) return expandedWords5L;
  
  expandedWords5L = new Set<string>();
  
  const lines = wordlistFives.split('\n');
  for (const line of lines) {
    const word = line.trim().toUpperCase();
    // Only include valid 5-letter words
    if (word.length === 5 && /^[A-Z]+$/.test(word)) {
      expandedWords5L.add(word);
    }
  }
  
  console.log(`Expanded 5L dictionary loaded: ${expandedWords5L.size} words`);
  return expandedWords5L;
}

export function isValidExpanded5LWord(word: string): boolean {
  const dict = loadExpanded5LDictionary();
  return dict.has(word.toUpperCase());
}

export function getExpanded5LDictionary(): Set<string> {
  return loadExpanded5LDictionary();
}
