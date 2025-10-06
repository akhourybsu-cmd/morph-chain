// Puzzle usage tracking to ensure each curated pair is used only once

const USED_PUZZLES_KEY_PREFIX = "morphchain_used_puzzles_";
const PUZZLE_INDEX_KEY_PREFIX = "morphchain_current_index_";

export interface UsedPuzzleRecord {
  pairKey: string; // "START->GOAL"
  dateUsed: string;
  index: number;
}

// Load the set of used puzzle pair keys
export const loadUsedPuzzles = (wordLength: 4 | 5 | 6 = 4): Set<string> => {
  try {
    const stored = localStorage.getItem(`${USED_PUZZLES_KEY_PREFIX}${wordLength}L`);
    if (!stored) return new Set();
    const records: UsedPuzzleRecord[] = JSON.parse(stored);
    return new Set(records.map(r => r.pairKey));
  } catch (error) {
    console.error("Error loading used puzzles:", error);
    return new Set();
  }
};

// Get the current puzzle index (which puzzle in the sequence we're on)
export const getCurrentPuzzleIndex = (wordLength: 4 | 5 | 6 = 4): number => {
  try {
    const stored = localStorage.getItem(`${PUZZLE_INDEX_KEY_PREFIX}${wordLength}L`);
    return stored ? parseInt(stored, 10) : 0;
  } catch (error) {
    console.error("Error loading puzzle index:", error);
    return 0;
  }
};

// Mark a puzzle as used
export const markPuzzleAsUsed = (
  start: string,
  goal: string,
  index: number,
  date: string,
  wordLength: 4 | 5 | 6 = 4
): void => {
  try {
    const pairKey = `${start}->${goal}`;
    const usedKey = `${USED_PUZZLES_KEY_PREFIX}${wordLength}L`;
    const indexKey = `${PUZZLE_INDEX_KEY_PREFIX}${wordLength}L`;
    const stored = localStorage.getItem(usedKey);
    const records: UsedPuzzleRecord[] = stored ? JSON.parse(stored) : [];
    
    // Check if already recorded
    if (records.some(r => r.pairKey === pairKey)) {
      return;
    }
    
    records.push({
      pairKey,
      dateUsed: date,
      index,
    });
    
    localStorage.setItem(usedKey, JSON.stringify(records));
    localStorage.setItem(indexKey, index.toString());
  } catch (error) {
    console.error("Error marking puzzle as used:", error);
  }
};

// Get usage statistics
export const getPuzzleUsageStats = (wordLength: 4 | 5 | 6 = 4) => {
  const usedPuzzles = loadUsedPuzzles(wordLength);
  const currentIndex = getCurrentPuzzleIndex(wordLength);
  
  return {
    totalUsed: usedPuzzles.size,
    currentIndex,
    usedPuzzles: Array.from(usedPuzzles),
  };
};

// Reset tracking (admin function)
export const resetPuzzleTracking = (wordLength?: 4 | 5 | 6): void => {
  if (wordLength) {
    localStorage.removeItem(`${USED_PUZZLES_KEY_PREFIX}${wordLength}L`);
    localStorage.removeItem(`${PUZZLE_INDEX_KEY_PREFIX}${wordLength}L`);
  } else {
    // Reset all
    [4, 5, 6].forEach(len => {
      localStorage.removeItem(`${USED_PUZZLES_KEY_PREFIX}${len}L`);
      localStorage.removeItem(`${PUZZLE_INDEX_KEY_PREFIX}${len}L`);
    });
  }
};
