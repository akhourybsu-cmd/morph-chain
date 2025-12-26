/**
 * Official Scrabble Dictionary (TWL06)
 * 
 * This is the authoritative source of valid words for all Morph Games.
 * Uses the Tournament Word List 2006, the official U.S. Scrabble dictionary.
 */

import twl06Content from './twl06.txt?raw';

// Cached word sets by length
let wordsByLength: Map<number, Set<string>> | null = null;
let allWords: Set<string> | null = null;

/**
 * Parse TWL06 and create word sets organized by length.
 * Skips the header line and normalizes all words to uppercase.
 */
function loadDictionary(): void {
  if (wordsByLength !== null) return;
  
  wordsByLength = new Map();
  allWords = new Set();
  
  const lines = twl06Content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const word = lines[i].trim().toUpperCase();
    
    // Skip header line and empty lines
    if (i === 0 && word.includes('TWL06')) continue;
    if (!word || !/^[A-Z]+$/.test(word)) continue;
    
    const len = word.length;
    
    // Add to all words set
    allWords.add(word);
    
    // Add to length-specific set
    if (!wordsByLength.has(len)) {
      wordsByLength.set(len, new Set());
    }
    wordsByLength.get(len)!.add(word);
  }
  
  console.log(`TWL06 Dictionary loaded: ${allWords.size} total words`);
  
  // Log counts by length for debugging
  const counts: string[] = [];
  for (let len = 2; len <= 7; len++) {
    const count = wordsByLength.get(len)?.size || 0;
    counts.push(`${len}L: ${count}`);
  }
  console.log(`TWL06 by length: ${counts.join(', ')}`);
}

/**
 * Get all Scrabble-valid words of a specific length.
 */
export function getScrabbleWords(length: number): Set<string> {
  loadDictionary();
  return wordsByLength?.get(length) || new Set();
}

/**
 * Get all Scrabble-valid words of a minimum length or greater.
 */
export function getScrabbleWordsMinLength(minLength: number): Set<string> {
  loadDictionary();
  const result = new Set<string>();
  
  if (!wordsByLength) return result;
  
  for (const [len, words] of wordsByLength.entries()) {
    if (len >= minLength) {
      for (const word of words) {
        result.add(word);
      }
    }
  }
  
  return result;
}

/**
 * Check if a word is valid in the Scrabble dictionary.
 */
export function isValidScrabbleWord(word: string): boolean {
  loadDictionary();
  return allWords?.has(word.toUpperCase()) || false;
}

/**
 * Check if a word of a specific length is valid.
 */
export function isValidScrabbleWordByLength(word: string, length: number): boolean {
  if (word.length !== length) return false;
  loadDictionary();
  return wordsByLength?.get(length)?.has(word.toUpperCase()) || false;
}

/**
 * Get total word count for a specific length.
 */
export function getWordCount(length: number): number {
  loadDictionary();
  return wordsByLength?.get(length)?.size || 0;
}

/**
 * Get total word count across all lengths.
 */
export function getTotalWordCount(): number {
  loadDictionary();
  return allWords?.size || 0;
}
