// Dictionary for MORPH GRID word validation
import { isModernEnglish } from '@/lib/wordFilters';
import wordsAlpha from '../words_alpha.txt?raw';

let wordSet: Set<string> | null = null;

export async function loadDictionary(): Promise<void> {
  if (wordSet) return;
  
  try {
    const allWords = new Set<string>();
    
    // Load words from the same source as Morph Chain
    const words = wordsAlpha.split('\n');
    
    for (const word of words) {
      const trimmed = word.trim().toLowerCase();
      // Only add words that pass modern English filters (3+ letters for GRID)
      if (trimmed.length >= 3 && isModernEnglish(trimmed)) {
        allWords.add(trimmed);
      }
    }
    
    wordSet = allWords;
    console.log(`MORPH GRID Dictionary loaded: ${wordSet.size} valid words (3+ letters)`);
  } catch (error) {
    console.error('Failed to load dictionary:', error);
    wordSet = new Set();
  }
}

export function isValidWord(word: string): boolean {
  if (!wordSet) return false;
  const normalizedWord = word.toLowerCase();
  
  // Validate word length
  if (normalizedWord.length < 3) return false;
  
  // Check dictionary and modern English filters
  return wordSet.has(normalizedWord) && isModernEnglish(normalizedWord);
}

export function isDictionaryLoaded(): boolean {
  return wordSet !== null;
}
