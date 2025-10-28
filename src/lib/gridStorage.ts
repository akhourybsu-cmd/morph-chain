// Grid-specific storage for stats and leaderboard

export interface SubmittedWord {
  word: string;
  timestamp: number;
}

export interface GridLBEntry {
  id: string;
  dateSeed: string;
  moves: number;
  wordsUsed: number;
  timeToCompleteMs?: number;
  completedAt: string;
  deviceAlias?: string;
}

export interface GridStats {
  gamesPlayed: number;
  gamesCompleted: number;
  bestMoves: number | null;
  bestMovesDate: string | null;
  avgMovesCompleted: number | null;
  medianMovesCompleted: number | null;
  completionRate: number;
  longestWord: string | null;
  mostUsedLetter: string | null;
  totalWordsAllGames: number;
  totalPowerUses: number;
  totalStabilizedFreed: number;
  movesHistogram: Record<string, number>;
  streakDays: number;
  lastPlayedDate: string | null;
  completedGames: Array<{
    dateSeed: string;
    moves: number;
    wordsUsed: number;
    timeToCompleteMs?: number;
    completedAt: string;
  }>;
}

const GRID_STATS_KEY = 'morphGrid_stats';
const GRID_ALIAS_KEY = 'morphGrid_alias';
const GRID_LEADERBOARD_KEY = 'morphGrid_leaderboard';
const GRID_GAME_STATE_KEY = 'morphGrid_gameState';

export const loadGridStats = (): GridStats => {
  try {
    const saved = localStorage.getItem(GRID_STATS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading Grid stats:', e);
  }
  
  return {
    gamesPlayed: 0,
    gamesCompleted: 0,
    bestMoves: null,
    bestMovesDate: null,
    avgMovesCompleted: null,
    medianMovesCompleted: null,
    completionRate: 0,
    longestWord: null,
    mostUsedLetter: null,
    totalWordsAllGames: 0,
    totalPowerUses: 0,
    totalStabilizedFreed: 0,
    movesHistogram: {},
    streakDays: 0,
    lastPlayedDate: null,
    completedGames: [],
  };
};

export const saveGridStats = (stats: GridStats): void => {
  try {
    localStorage.setItem(GRID_STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Error saving Grid stats:', e);
  }
};

export const loadGridAlias = (): string | null => {
  try {
    return localStorage.getItem(GRID_ALIAS_KEY);
  } catch (e) {
    console.error('Error loading Grid alias:', e);
    return null;
  }
};

export const saveGridAlias = (alias: string): void => {
  try {
    localStorage.setItem(GRID_ALIAS_KEY, alias);
  } catch (e) {
    console.error('Error saving Grid alias:', e);
  }
};

export const loadGridLeaderboard = (dateSeed: string): GridLBEntry[] => {
  try {
    const saved = localStorage.getItem(`${GRID_LEADERBOARD_KEY}_${dateSeed}`);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading Grid leaderboard:', e);
  }
  return [];
};

export const saveGridLeaderboard = (dateSeed: string, entries: GridLBEntry[]): void => {
  try {
    localStorage.setItem(`${GRID_LEADERBOARD_KEY}_${dateSeed}`, JSON.stringify(entries));
  } catch (e) {
    console.error('Error saving Grid leaderboard:', e);
  }
};

export const addGridLeaderboardEntry = (entry: GridLBEntry): void => {
  const entries = loadGridLeaderboard(entry.dateSeed);
  
  // Check if entry already exists for this device
  const existingIndex = entries.findIndex(e => e.id === entry.id);
  
  if (existingIndex >= 0) {
    // Update if better
    if (entry.moves < entries[existingIndex].moves) {
      entries[existingIndex] = entry;
    }
  } else {
    entries.push(entry);
  }
  
  // Sort by moves (asc), then time (asc), then completedAt (asc)
  entries.sort((a, b) => {
    if (a.moves !== b.moves) return a.moves - b.moves;
    if (a.timeToCompleteMs && b.timeToCompleteMs && a.timeToCompleteMs !== b.timeToCompleteMs) {
      return a.timeToCompleteMs - b.timeToCompleteMs;
    }
    return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
  });
  
  saveGridLeaderboard(entry.dateSeed, entries);
};

const getHistogramBucket = (moves: number): string => {
  if (moves <= 10) return '0-10';
  if (moves <= 15) return '11-15';
  if (moves <= 20) return '16-20';
  if (moves <= 25) return '21-25';
  if (moves <= 30) return '26-30';
  return '30+';
};

const calculateMedian = (values: number[]): number | null => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

/**
 * Records the start of a Grid game play session
 * Only increments games played once per unique date
 */
export const recordGridPlayStart = (dateSeed: string): void => {
  try {
    const stats = loadGridStats();
    
    // Only increment if new date
    if (stats.lastPlayedDate !== dateSeed) {
      stats.gamesPlayed += 1;
      stats.lastPlayedDate = dateSeed;
      saveGridStats(stats);
      console.log(`Grid play started for ${dateSeed}, games played: ${stats.gamesPlayed}`);
    }
  } catch (e) {
    console.error('Error recording Grid play start:', e);
  }
};

/**
 * Records stats for each word submitted in Grid
 * Tracks total words, power-up usage, stabilized tiles, and letter frequency
 */
export const recordGridSubmit = (word: string, usedPower: boolean, stabilizedFreed: number): void => {
  try {
    const stats = loadGridStats();
    
    stats.totalWordsAllGames += 1;
    if (usedPower) stats.totalPowerUses += 1;
    stats.totalStabilizedFreed += stabilizedFreed;
    
    // Track longest word
    if (!stats.longestWord || word.length > stats.longestWord.length) {
      stats.longestWord = word;
    }
    
    // Track most used letter across all words
    const allLetters: Record<string, number> = {};
    // Get all letters from previous data and current word
    stats.completedGames.forEach(game => {
      // We don't have individual words, but we could track this differently
    });
    
    // For now, just track from current word
    const letters: Record<string, number> = {};
    for (const char of word.toUpperCase()) {
      letters[char] = (letters[char] || 0) + 1;
    }
    const mostUsed = Object.entries(letters).sort((a, b) => b[1] - a[1])[0];
    if (mostUsed) {
      stats.mostUsedLetter = mostUsed[0];
    }
    
    saveGridStats(stats);
  } catch (e) {
    console.error('Error recording Grid submit:', e);
  }
};

/**
 * Records a Grid game win/completion
 * Updates all completion stats, streaks, and leaderboard
 */
export const recordGridWin = (payload: {
  dateSeed: string;
  moves: number;
  wordsUsed: number;
  timeToCompleteMs?: number;
}): void => {
  try {
    const stats = loadGridStats();
    const alias = loadGridAlias();
    
    stats.gamesCompleted += 1;
    
    // Update best moves
    if (stats.bestMoves === null || payload.moves < stats.bestMoves) {
      stats.bestMoves = payload.moves;
      stats.bestMovesDate = payload.dateSeed;
      console.log(`New best moves record: ${payload.moves} on ${payload.dateSeed}`);
    }
    
    // Add to completed games
    stats.completedGames.push({
      dateSeed: payload.dateSeed,
      moves: payload.moves,
      wordsUsed: payload.wordsUsed,
      timeToCompleteMs: payload.timeToCompleteMs,
      completedAt: new Date().toISOString(),
    });
    
    // Keep only last 30
    if (stats.completedGames.length > 30) {
      stats.completedGames = stats.completedGames.slice(-30);
    }
    
    // Update histogram
    const bucket = getHistogramBucket(payload.moves);
    stats.movesHistogram[bucket] = (stats.movesHistogram[bucket] || 0) + 1;
    
    // Calculate avg and median from all completed games
    const completedMoves = stats.completedGames.map(g => g.moves);
    stats.avgMovesCompleted = completedMoves.reduce((a, b) => a + b, 0) / completedMoves.length;
    stats.medianMovesCompleted = calculateMedian(completedMoves);
    
    // Calculate completion rate
    stats.completionRate = stats.gamesPlayed > 0 ? stats.gamesCompleted / stats.gamesPlayed : 0;
    
    // Update streak - consecutive daily completions
    const today = payload.dateSeed;
    const yesterday = new Date(new Date(today).getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    if (stats.lastPlayedDate === yesterday) {
      stats.streakDays += 1;
    } else if (stats.lastPlayedDate !== today) {
      stats.streakDays = 1;
    }
    
    stats.lastPlayedDate = today;
    
    saveGridStats(stats);
    console.log(`Grid win recorded: ${payload.moves} moves, streak: ${stats.streakDays} days`);
    
    // Add to leaderboard
    addGridLeaderboardEntry({
      id: crypto.randomUUID(),
      dateSeed: payload.dateSeed,
      moves: payload.moves,
      wordsUsed: payload.wordsUsed,
      timeToCompleteMs: payload.timeToCompleteMs,
      completedAt: new Date().toISOString(),
      deviceAlias: alias || undefined,
    });
  } catch (e) {
    console.error('Error recording Grid win:', e);
  }
};

export interface GridGameState {
  grid: any[][];
  selected: any[];
  submittedWords: SubmittedWord[];
  moves: number;
  purpleCount: number;
  dailySeed: string;
  morphCount: number;
  stabilizationCount: number;
  startTime: number;
}

export const saveGridGameState = (state: GridGameState): void => {
  try {
    localStorage.setItem(`${GRID_GAME_STATE_KEY}_${state.dailySeed}`, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving Grid game state:', e);
  }
};

export const loadGridGameState = (dateSeed: string): GridGameState | null => {
  try {
    const saved = localStorage.getItem(`${GRID_GAME_STATE_KEY}_${dateSeed}`);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading Grid game state:', e);
  }
  return null;
};

export const clearGridGameState = (dateSeed: string): void => {
  try {
    localStorage.removeItem(`${GRID_GAME_STATE_KEY}_${dateSeed}`);
  } catch (e) {
    console.error('Error clearing Grid game state:', e);
  }
};

export const resetGridStats = (): void => {
  localStorage.removeItem(GRID_STATS_KEY);
  // Clear all leaderboard entries
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(GRID_LEADERBOARD_KEY)) {
      localStorage.removeItem(key);
    }
  }
};
