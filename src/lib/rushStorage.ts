// Rush-specific storage for stats and settings

export interface RushStats {
  normal: {
    gamesPlayed: number;
    highScore: number;
    totalWords: number;
    maxMultiplier: number;
    totalScore: number;
  };
  hard: {
    gamesPlayed: number;
    highScore: number;
    totalWords: number;
    maxMultiplier: number;
    totalScore: number;
  };
}

const RUSH_STATS_KEY = 'morphchain_rush_stats';

export const loadRushStats = (): RushStats => {
  try {
    const saved = localStorage.getItem(RUSH_STATS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading Rush stats:', e);
  }
  
  return {
    normal: {
      gamesPlayed: 0,
      highScore: 0,
      totalWords: 0,
      maxMultiplier: 1.0,
      totalScore: 0,
    },
    hard: {
      gamesPlayed: 0,
      highScore: 0,
      totalWords: 0,
      maxMultiplier: 1.0,
      totalScore: 0,
    },
  };
};

export const saveRushStats = (stats: RushStats): void => {
  try {
    localStorage.setItem(RUSH_STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Error saving Rush stats:', e);
  }
};

export const updateRushStats = (
  score: number,
  wordsCount: number,
  maxMultiplier: number,
  hardMode: boolean
): void => {
  const stats = loadRushStats();
  const mode = hardMode ? 'hard' : 'normal';
  
  stats[mode].gamesPlayed += 1;
  stats[mode].highScore = Math.max(stats[mode].highScore, score);
  stats[mode].totalWords += wordsCount;
  stats[mode].maxMultiplier = Math.max(stats[mode].maxMultiplier, maxMultiplier);
  stats[mode].totalScore += score;
  
  saveRushStats(stats);
};

// Track if user has completed their first daily attempt
export const hasCompletedFirstDailyAttempt = (): boolean => {
  const key = 'morphchain_rush_first_daily_attempt';
  return localStorage.getItem(key) === 'true';
};

export const markFirstDailyAttemptComplete = (): void => {
  const key = 'morphchain_rush_first_daily_attempt';
  localStorage.setItem(key, 'true');
};
