// Dictionary for MORPH GRID word validation
import { isModernEnglish } from '@/lib/wordFilters';

let wordSet: Set<string> | null = null;

export async function loadDictionary(): Promise<void> {
  if (wordSet) return;
  
  try {
    const response = await fetch('/dict/manifest.json');
    const manifest = await response.json();
    
    const allWords = new Set<string>();
    
    // Load all dictionary files
    for (const file of manifest.files) {
      const wordsResponse = await fetch(`/dict/${file}`);
      const words = await wordsResponse.json();
      words.forEach((word: string) => {
        const normalizedWord = word.toLowerCase();
        // Only add words that pass modern English filters
        if (isModernEnglish(normalizedWord)) {
          allWords.add(normalizedWord);
        }
      });
    }
    
    wordSet = allWords;
    console.log(`Dictionary loaded: ${wordSet.size} valid words`);
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
