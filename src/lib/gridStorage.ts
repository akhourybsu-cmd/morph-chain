// Grid-specific storage for stats and leaderboard

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

export const recordGridPlayStart = (dateSeed: string): void => {
  const stats = loadGridStats();
  
  // Only increment if new date
  if (stats.lastPlayedDate !== dateSeed) {
    stats.gamesPlayed += 1;
    stats.lastPlayedDate = dateSeed;
    saveGridStats(stats);
  }
};

export const recordGridSubmit = (word: string, usedPower: boolean, stabilizedFreed: number): void => {
  const stats = loadGridStats();
  
  stats.totalWordsAllGames += 1;
  if (usedPower) stats.totalPowerUses += 1;
  stats.totalStabilizedFreed += stabilizedFreed;
  
  // Track longest word
  if (!stats.longestWord || word.length > stats.longestWord.length) {
    stats.longestWord = word;
  }
  
  // Track letter frequency
  const letters: Record<string, number> = {};
  for (const char of word.toUpperCase()) {
    letters[char] = (letters[char] || 0) + 1;
  }
  const mostUsed = Object.entries(letters).sort((a, b) => b[1] - a[1])[0];
  if (mostUsed) {
    stats.mostUsedLetter = mostUsed[0];
  }
  
  saveGridStats(stats);
};

export const recordGridWin = (payload: {
  dateSeed: string;
  moves: number;
  wordsUsed: number;
  timeToCompleteMs?: number;
}): void => {
  const stats = loadGridStats();
  const alias = loadGridAlias();
  
  stats.gamesCompleted += 1;
  
  // Update best moves
  if (stats.bestMoves === null || payload.moves < stats.bestMoves) {
    stats.bestMoves = payload.moves;
    stats.bestMovesDate = payload.dateSeed;
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
  
  // Calculate avg and median
  const completedMoves = stats.completedGames.map(g => g.moves);
  stats.avgMovesCompleted = completedMoves.reduce((a, b) => a + b, 0) / completedMoves.length;
  stats.medianMovesCompleted = calculateMedian(completedMoves);
  
  // Calculate completion rate
  stats.completionRate = stats.gamesPlayed > 0 ? stats.gamesCompleted / stats.gamesPlayed : 0;
  
  // Update streak
  const today = payload.dateSeed;
  const yesterday = new Date(new Date(today).getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  if (stats.lastPlayedDate === yesterday) {
    stats.streakDays += 1;
  } else if (stats.lastPlayedDate !== today) {
    stats.streakDays = 1;
  }
  
  saveGridStats(stats);
  
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
