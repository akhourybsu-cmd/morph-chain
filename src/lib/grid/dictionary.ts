// Dictionary for MORPH GRID word validation
// Uses official TWL06 Scrabble dictionary

import { getScrabbleWordsMinLength, isValidScrabbleWord } from '@/lib/scrabbleDictionary';

let wordSet: Set<string> | null = null;

export async function loadDictionary(): Promise<void> {
  if (wordSet) return;
  
  try {
    // Get all words 3 letters or longer from TWL06
    wordSet = getScrabbleWordsMinLength(3);
    console.log(`MORPH GRID Dictionary loaded: ${wordSet.size} valid words (3+ letters)`);
  } catch (error) {
    console.error('Failed to load dictionary:', error);
    wordSet = new Set();
  }
}

export function isValidWord(word: string): boolean {
  if (!wordSet) return false;
  const normalizedWord = word.toUpperCase();
  
  // Validate word length
  if (normalizedWord.length < 3) return false;
  
  // Check against TWL06 dictionary
  return wordSet.has(normalizedWord);
}

export function isDictionaryLoaded(): boolean {
  return wordSet !== null;
}
