// Measured Stats Storage
// Tracks player statistics for the Measured game

import { getEasternDateString, calculateStreak } from '@/lib/dateUtils';
import { Band } from './gameLogic';

const STATS_KEY = 'measured_stats';

export interface MeasuredStats {
  gamesPlayed: number;
  exactMatches: number;        // is_exact = true count
  currentStreak: number;       // consecutive days played
  maxStreak: number;
  lastPlayedDate: string | null;
  bestScore: number;           // highest score_int (0-100)
  totalScore: number;          // sum of all scores for avg calculation
  averageScore: number;        // running average
  bandDistribution: {          // count per band
    deadOn: number;
    sharp: number;
    close: number;
    warm: number;
    wide: number;
  };
  totalError: number;          // sum of all absolute errors
  bestErrorPercent: number | null;  // lowest error percentage
  completedDates: string[];    // recent dates (keep last 30)
}

const DEFAULT_STATS: MeasuredStats = {
  gamesPlayed: 0,
  exactMatches: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastPlayedDate: null,
  bestScore: 0,
  totalScore: 0,
  averageScore: 0,
  bandDistribution: {
    deadOn: 0,
    sharp: 0,
    close: 0,
    warm: 0,
    wide: 0,
  },
  totalError: 0,
  bestErrorPercent: null,
  completedDates: [],
};

/**
 * Load Measured stats from local storage
 */
export function loadMeasuredStats(): MeasuredStats {
  try {
    const stored = localStorage.getItem(STATS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_STATS, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load measured stats:', e);
  }
  return { ...DEFAULT_STATS };
}

/**
 * Save Measured stats to local storage
 */
export function saveMeasuredStats(stats: MeasuredStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.warn('Failed to save measured stats:', e);
  }
}

/**
 * Map band string to distribution key
 */
function getBandKey(band: Band): keyof MeasuredStats['bandDistribution'] {
  const mapping: Record<Band, keyof MeasuredStats['bandDistribution']> = {
    'Dead On': 'deadOn',
    'Sharp': 'sharp',
    'Close': 'close',
    'Warm': 'warm',
    'Wide': 'wide',
  };
  return mapping[band];
}

/**
 * Update stats after a game attempt
 */
export function updateMeasuredStats(payload: {
  score: number;
  band: Band;
  isExact: boolean;
  error: number;
  targetValue: number;
}): MeasuredStats {
  const stats = loadMeasuredStats();
  const today = getEasternDateString();
  
  // Guard: If already played today, don't double-count stats
  if (stats.completedDates.includes(today)) {
    console.log('Measured: Skipping stat update - already counted today');
    return stats;
  }
  
  // Increment games played
  stats.gamesPlayed += 1;
  
  // Track exact matches
  if (payload.isExact) {
    stats.exactMatches += 1;
  }
  
  // Update best score
  stats.bestScore = Math.max(stats.bestScore, payload.score);
  
  // Update total and average score
  stats.totalScore += payload.score;
  stats.averageScore = Math.round(stats.totalScore / stats.gamesPlayed);
  
  // Update band distribution
  const bandKey = getBandKey(payload.band);
  stats.bandDistribution[bandKey] += 1;
  
  // Update error tracking
  stats.totalError += payload.error;
  const errorPercent = payload.targetValue > 0 
    ? (payload.error / payload.targetValue) * 100 
    : 0;
  if (stats.bestErrorPercent === null || errorPercent < stats.bestErrorPercent) {
    stats.bestErrorPercent = Math.round(errorPercent * 10) / 10;
  }
  
  // Update streak
  const { newStreak, maxStreak } = calculateStreak(
    stats.lastPlayedDate,
    stats.currentStreak,
    stats.maxStreak,
    today
  );
  stats.currentStreak = newStreak;
  stats.maxStreak = maxStreak;
  stats.lastPlayedDate = today;
  
  // Track completed dates (keep last 30)
  if (!stats.completedDates.includes(today)) {
    stats.completedDates.push(today);
    if (stats.completedDates.length > 30) {
      stats.completedDates = stats.completedDates.slice(-30);
    }
  }
  
  saveMeasuredStats(stats);
  console.log('Measured stats updated:', stats);
  
  return stats;
}

/**
 * Reset all measured stats
 */
export function resetMeasuredStats(): void {
  localStorage.removeItem(STATS_KEY);
}

/**
 * Check if Measured was completed today
 */
export function isMeasuredCompletedToday(): boolean {
  const stats = loadMeasuredStats();
  const today = getEasternDateString();
  return stats.lastPlayedDate === today;
}

/**
 * Mark today as completed (for syncing from database without double-counting stats)
 * Used when loading an existing attempt from the server
 */
export function markMeasuredCompletedToday(): void {
  const stats = loadMeasuredStats();
  const today = getEasternDateString();
  
  if (stats.lastPlayedDate !== today) {
    stats.lastPlayedDate = today;
    if (!stats.completedDates.includes(today)) {
      stats.completedDates.push(today);
      if (stats.completedDates.length > 30) {
        stats.completedDates = stats.completedDates.slice(-30);
      }
    }
    saveMeasuredStats(stats);
    console.log('Marked Measured as completed for today (synced from database)');
  }
}
