import { AlibiGameState, AlibiStats, GridState, GridType, CellState } from './types';
import { PUZZLE_GENERATION_VERSION } from './dailyPuzzle';

const STORAGE_KEYS = {
  GAME_STATE: 'alibi_game_state',
  STATS: 'alibi_stats',
  SETTINGS: 'alibi_settings',
  PUZZLE_VERSION: 'alibi_puzzle_version',
};

// Check and clear cache if puzzle generation version changed
export function checkAndClearVersionedCache(): void {
  try {
    const storedVersion = localStorage.getItem(STORAGE_KEYS.PUZZLE_VERSION);
    const currentVersion = String(PUZZLE_GENERATION_VERSION);
    
    if (storedVersion !== currentVersion) {
      // Clear all game states (puzzles generated with old rules)
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEYS.GAME_STATE)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Update stored version
      localStorage.setItem(STORAGE_KEYS.PUZZLE_VERSION, currentVersion);
      console.log(`Alibi puzzle cache cleared for version ${currentVersion}`);
    }
  } catch (e) {
    console.error('Failed to check puzzle version:', e);
  }
}

// Initialize empty grid state
export function createEmptyGridState(rows: string[], cols: string[]): GridState {
  const cells: Record<string, Record<string, CellState>> = {};
  for (const row of rows) {
    cells[row] = {};
    for (const col of cols) {
      cells[row][col] = 'unknown';
    }
  }
  return { rows, cols, cells };
}

// Save game state
export function saveGameState(puzzleId: string, state: Partial<AlibiGameState>): void {
  try {
    const key = `${STORAGE_KEYS.GAME_STATE}_${puzzleId}`;
    const existing = loadGameState(puzzleId);
    const merged = { ...existing, ...state };
    localStorage.setItem(key, JSON.stringify(merged));
  } catch (e) {
    console.error('Failed to save alibi game state:', e);
  }
}

// Load game state
export function loadGameState(puzzleId: string): Partial<AlibiGameState> | null {
  try {
    const key = `${STORAGE_KEYS.GAME_STATE}_${puzzleId}`;
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load alibi game state:', e);
    return null;
  }
}

// Clear game state
export function clearGameState(puzzleId: string): void {
  try {
    const key = `${STORAGE_KEYS.GAME_STATE}_${puzzleId}`;
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Failed to clear alibi game state:', e);
  }
}

// Get default stats
export function getDefaultStats(): AlibiStats {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    lastPlayedDate: null,
    averageTime: 0,
    perfectGames: 0,
  };
}

// Load stats
export function loadStats(): AlibiStats {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.STATS);
    if (!data) return getDefaultStats();
    return { ...getDefaultStats(), ...JSON.parse(data) };
  } catch (e) {
    console.error('Failed to load alibi stats:', e);
    return getDefaultStats();
  }
}

// Save stats
export function saveStats(stats: AlibiStats): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save alibi stats:', e);
  }
}

// Update stats after game completion
export function updateStatsAfterGame(
  won: boolean,
  timeMs: number,
  consistencyChecks: number,
  dateStr: string
): AlibiStats {
  const stats = loadStats();
  
  stats.gamesPlayed++;
  
  if (won) {
    stats.gamesWon++;
    
    // Update streak
    const today = new Date(dateStr).toDateString();
    const lastPlayed = stats.lastPlayedDate 
      ? new Date(stats.lastPlayedDate).toDateString() 
      : null;
    
    if (lastPlayed) {
      const lastDate = new Date(stats.lastPlayedDate!);
      const currentDate = new Date(dateStr);
      const diffDays = Math.floor(
        (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (diffDays === 1) {
        stats.currentStreak++;
      } else if (diffDays > 1) {
        stats.currentStreak = 1;
      }
    } else {
      stats.currentStreak = 1;
    }
    
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
    
    // Update average time
    const totalTime = stats.averageTime * (stats.gamesWon - 1) + timeMs;
    stats.averageTime = Math.round(totalTime / stats.gamesWon);
    
    // Perfect game (no consistency checks)
    if (consistencyChecks === 0) {
      stats.perfectGames++;
    }
  } else {
    stats.currentStreak = 0;
  }
  
  stats.lastPlayedDate = dateStr;
  saveStats(stats);
  
  return stats;
}
