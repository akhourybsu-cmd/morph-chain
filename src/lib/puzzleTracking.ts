// Puzzle usage tracking to ensure each curated pair is used only once

const USED_PUZZLES_KEY = "morphchain_used_4l_puzzles";
const PUZZLE_INDEX_KEY = "morphchain_4l_current_index";

export interface UsedPuzzleRecord {
  pairKey: string; // "START->GOAL"
  dateUsed: string;
  index: number;
}

// Load the set of used puzzle pair keys
export const loadUsedPuzzles = (): Set<string> => {
  try {
    const stored = localStorage.getItem(USED_PUZZLES_KEY);
    if (!stored) return new Set();
    const records: UsedPuzzleRecord[] = JSON.parse(stored);
    return new Set(records.map(r => r.pairKey));
  } catch (error) {
    console.error("Error loading used puzzles:", error);
    return new Set();
  }
};

// Get the current puzzle index (which puzzle in the sequence we're on)
export const getCurrentPuzzleIndex = (): number => {
  try {
    const stored = localStorage.getItem(PUZZLE_INDEX_KEY);
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
  date: string
): void => {
  try {
    const pairKey = `${start}->${goal}`;
    const stored = localStorage.getItem(USED_PUZZLES_KEY);
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
    
    localStorage.setItem(USED_PUZZLES_KEY, JSON.stringify(records));
    localStorage.setItem(PUZZLE_INDEX_KEY, index.toString());
  } catch (error) {
    console.error("Error marking puzzle as used:", error);
  }
};

// Get usage statistics
export const getPuzzleUsageStats = () => {
  const usedPuzzles = loadUsedPuzzles();
  const currentIndex = getCurrentPuzzleIndex();
  
  return {
    totalUsed: usedPuzzles.size,
    currentIndex,
    usedPuzzles: Array.from(usedPuzzles),
  };
};

// Reset tracking (admin function)
export const resetPuzzleTracking = (): void => {
  localStorage.removeItem(USED_PUZZLES_KEY);
  localStorage.removeItem(PUZZLE_INDEX_KEY);
};
