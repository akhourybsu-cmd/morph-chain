// Dictionary for MORPH GRID word validation
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
      words.forEach((word: string) => allWords.add(word.toLowerCase()));
    }
    
    wordSet = allWords;
  } catch (error) {
    console.error('Failed to load dictionary:', error);
    wordSet = new Set();
  }
}

export function isValidWord(word: string): boolean {
  if (!wordSet) return false;
  return word.length >= 3 && wordSet.has(word.toLowerCase());
}

export function isDictionaryLoaded(): boolean {
  return wordSet !== null;
}
