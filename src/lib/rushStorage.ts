// Rush-specific storage for stats and settings
import { getEasternDateString, isConsecutiveDay } from '@/lib/dateUtils';

interface ModeStats {
  gamesPlayed: number;
  highScore: number;
  totalWords: number;
  maxMultiplier: number;
  totalScore: number;
}

export interface RushStats {
  normal: ModeStats;
  hard: ModeStats;
  // Streak tracking
  dailyStreak: number;
  maxDailyStreak: number;
  lastDailyDate: string | null;
}

const RUSH_STATS_KEY = 'morphchain_rush_stats';

const DEFAULT_MODE_STATS: ModeStats = {
  gamesPlayed: 0,
  highScore: 0,
  totalWords: 0,
  maxMultiplier: 1.0,
  totalScore: 0,
};

export const loadRushStats = (): RushStats => {
  try {
    const saved = localStorage.getItem(RUSH_STATS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old stats without streak tracking
      return {
        normal: { ...DEFAULT_MODE_STATS, ...parsed.normal },
        hard: { ...DEFAULT_MODE_STATS, ...parsed.hard },
        dailyStreak: parsed.dailyStreak ?? 0,
        maxDailyStreak: parsed.maxDailyStreak ?? 0,
        lastDailyDate: parsed.lastDailyDate ?? null,
      };
    }
  } catch (e) {
    console.error('Error loading Rush stats:', e);
  }
  
  return {
    normal: { ...DEFAULT_MODE_STATS },
    hard: { ...DEFAULT_MODE_STATS },
    dailyStreak: 0,
    maxDailyStreak: 0,
    lastDailyDate: null,
  };
};

export const saveRushStats = (stats: RushStats): void => {
  try {
    localStorage.setItem(RUSH_STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Error saving Rush stats:', e);
  }
};

/**
 * Updates Rush stats after a game completes
 * Tracks games played, high scores, words, multipliers, and total scores
 */
export const updateRushStats = (
  score: number,
  wordsCount: number,
  maxMultiplier: number,
  hardMode: boolean,
  isDaily: boolean = false
): void => {
  try {
    const stats = loadRushStats();
    const mode = hardMode ? 'hard' : 'normal';
    const today = getEasternDateString();
    
    stats[mode].gamesPlayed += 1;
    stats[mode].highScore = Math.max(stats[mode].highScore, score);
    stats[mode].totalWords += wordsCount;
    stats[mode].maxMultiplier = Math.max(stats[mode].maxMultiplier, maxMultiplier);
    stats[mode].totalScore += score;
    
    // Update daily streak (only for daily mode)
    if (isDaily) {
      if (stats.lastDailyDate === today) {
        // Already played today, no streak change
      } else if (isConsecutiveDay(stats.lastDailyDate, today)) {
        stats.dailyStreak += 1;
        stats.maxDailyStreak = Math.max(stats.maxDailyStreak, stats.dailyStreak);
      } else {
        // Not consecutive - reset streak
        stats.dailyStreak = 1;
        stats.maxDailyStreak = Math.max(stats.maxDailyStreak, 1);
      }
      stats.lastDailyDate = today;
    }
    
    saveRushStats(stats);
    console.log(`Rush stats updated for ${mode} mode:`, stats[mode], `streak: ${stats.dailyStreak}`);
  } catch (e) {
    console.error('Error updating Rush stats:', e);
  }
};

export interface CompletedDailyRun {
  date: string;
  mode: 'daily' | 'practice';
  hardMode: boolean;
  score: number;
  wordsCount: number;
  maxMultiplier: number;
  invalidCount: number;
  words?: any[]; // Store words for calculating bonuses
  sessionAchievements: string[];
  completedAt: string;
  submitted?: boolean;
}

const DAILY_RUN_KEY = 'morphchain_rush_daily_run';

export const getTodayDateString = (): string => {
  const tz = 'America/New_York';
  const now = new Date();
  const year = now.toLocaleString('en-US', { timeZone: tz, year: 'numeric' });
  const month = now.toLocaleString('en-US', { timeZone: tz, month: '2-digit' });
  const day = now.toLocaleString('en-US', { timeZone: tz, day: '2-digit' });
  return `${year}-${month}-${day}`;
};

export const saveDailyCompletion = (run: Omit<CompletedDailyRun, 'date' | 'completedAt'>): void => {
  try {
    const completedRun: CompletedDailyRun = {
      ...run,
      date: getTodayDateString(),
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem(DAILY_RUN_KEY, JSON.stringify(completedRun));
  } catch (e) {
    console.error('Error saving daily completion:', e);
  }
};

export const loadTodayCompletion = (): CompletedDailyRun | null => {
  try {
    const saved = localStorage.getItem(DAILY_RUN_KEY);
    if (!saved) return null;
    
    const run: CompletedDailyRun = JSON.parse(saved);
    
    // Check if it's from today
    if (run.date === getTodayDateString()) {
      return run;
    }
    
    // Clear old completion
    localStorage.removeItem(DAILY_RUN_KEY);
    return null;
  } catch (e) {
    console.error('Error loading daily completion:', e);
    return null;
  }
};

export const hasDailyCompletion = (hardMode: boolean): boolean => {
  const completion = loadTodayCompletion();
  if (!completion) return false;
  return completion.hardMode === hardMode;
};
