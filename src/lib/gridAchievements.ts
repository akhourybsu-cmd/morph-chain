// Achievement system for Morph Grid with tiered progression

export type AchievementTier = 'none' | 'bronze' | 'silver' | 'gold' | 'diamond';

// Medal system for daily puzzle completion
export type MedalType = 'platinum' | 'gold' | 'silver' | 'bronze' | 'none';

export interface MedalConfig {
  type: MedalType;
  label: string;
  emoji: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const MEDAL_CONFIGS: Record<MedalType, MedalConfig> = {
  platinum: {
    type: 'platinum',
    label: 'Platinum',
    emoji: '💎',
    bgClass: 'bg-gradient-to-br from-cyan-400/20 to-purple-400/20',
    textClass: 'text-cyan-400',
    borderClass: 'border-cyan-400/50',
  },
  gold: {
    type: 'gold',
    label: 'Gold',
    emoji: '🥇',
    bgClass: 'bg-gradient-to-br from-yellow-400/20 to-amber-500/20',
    textClass: 'text-yellow-500',
    borderClass: 'border-yellow-500/50',
  },
  silver: {
    type: 'silver',
    label: 'Silver',
    emoji: '🥈',
    bgClass: 'bg-gradient-to-br from-slate-300/20 to-slate-400/20',
    textClass: 'text-slate-400',
    borderClass: 'border-slate-400/50',
  },
  bronze: {
    type: 'bronze',
    label: 'Bronze',
    emoji: '🥉',
    bgClass: 'bg-gradient-to-br from-amber-600/20 to-orange-600/20',
    textClass: 'text-amber-600',
    borderClass: 'border-amber-600/50',
  },
  none: {
    type: 'none',
    label: '',
    emoji: '',
    bgClass: '',
    textClass: '',
    borderClass: '',
  },
};

/**
 * Returns the medal type earned based on moves used to complete the puzzle.
 * - Platinum: ≤8 moves
 * - Gold: 9-12 moves
 * - Silver: 13-15 moves
 * - Bronze: 16+ moves (only for wins)
 */
export const getMedalForMoves = (moves: number, won: boolean): MedalType => {
  if (!won) return 'none';
  if (moves <= 8) return 'platinum';
  if (moves <= 12) return 'gold';
  if (moves <= 15) return 'silver';
  return 'bronze';
};

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  flavorText: string;
}

export interface TieredAchievement {
  id: string;
  baseTitle: string;
  icon: string;
  tiers: {
    bronze: { threshold: number; title: string; description: string };
    silver: { threshold: number; title: string; description: string };
    gold: { threshold: number; title: string; description: string };
    diamond: { threshold: number; title: string; description: string };
  };
}

// Flat achievements (one-time unlocks)
export const GRID_ACHIEVEMENTS: Record<string, Achievement> = {
  first_grid_win: {
    id: 'first_grid_win',
    title: 'Grid Master',
    description: 'Complete your first Morph Grid puzzle',
    icon: '🎯',
    flavorText: 'Welcome to the grid!',
  },
  efficient_solver: {
    id: 'efficient_solver',
    title: 'Efficient Solver',
    description: 'Win a puzzle in 10 moves or fewer',
    icon: '✨',
    flavorText: 'Minimal moves, maximum impact!',
  },
  speedster: {
    id: 'speedster',
    title: 'Speedster',
    description: 'Complete a puzzle in under 3 minutes',
    icon: '⚡',
    flavorText: 'Lightning fast grid work!',
  },
  word_hunter: {
    id: 'word_hunter',
    title: 'Word Hunter',
    description: 'Find 15 words in a single puzzle',
    icon: '🔍',
    flavorText: 'So many words!',
  },
  long_word_finder: {
    id: 'long_word_finder',
    title: 'Long Word Finder',
    description: 'Submit a 7+ letter word',
    icon: '📏',
    flavorText: 'Size matters!',
  },
  power_player: {
    id: 'power_player',
    title: 'Power Player',
    description: 'Use a power tile during a puzzle',
    icon: '💥',
    flavorText: 'Harnessing the power!',
  },
  corner_start: {
    id: 'corner_start',
    title: 'Corner Conqueror',
    description: 'Start a word from a corner tile',
    icon: '📐',
    flavorText: 'Thinking outside the box!',
  },
  diagonal_master: {
    id: 'diagonal_master',
    title: 'Diagonal Master',
    description: 'Submit a word using only diagonal connections',
    icon: '↘️',
    flavorText: 'Thinking diagonally!',
  },
  perfect_grid: {
    id: 'perfect_grid',
    title: 'Perfect Grid',
    description: 'Win a puzzle in 8 moves or fewer',
    icon: '💎',
    flavorText: 'Flawless execution!',
  },
  clutch_victory: {
    id: 'clutch_victory',
    title: 'Clutch Victory',
    description: 'Win on move 19 or 20',
    icon: '😅',
    flavorText: 'That was close!',
  },
  monster_chain: {
    id: 'monster_chain',
    title: 'Monster Chain',
    description: 'Submit a 9+ letter word',
    icon: '🐉',
    flavorText: 'Absolute unit of a word!',
  },
  no_reuse_win: {
    id: 'no_reuse_win',
    title: 'Fresh Tiles Only',
    description: 'Win without reusing any purple tiles',
    icon: '🆕',
    flavorText: 'Every tile once!',
  },
  speed_demon: {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: 'Complete a puzzle in under 90 seconds',
    icon: '🏎️',
    flavorText: 'Blazing fast!',
  },
  minimalist: {
    id: 'minimalist',
    title: 'Minimalist',
    description: 'Win using only 6 words',
    icon: '🎭',
    flavorText: 'Less is more!',
  },
};

// Tiered achievements (progressive unlocks)
export const TIERED_ACHIEVEMENTS: Record<string, TieredAchievement> = {
  grid_wins: {
    id: 'grid_wins',
    baseTitle: 'Grid Victor',
    icon: '🏆',
    tiers: {
      bronze: { threshold: 1, title: 'Grid Novice', description: 'Win 1 grid puzzle' },
      silver: { threshold: 5, title: 'Grid Regular', description: 'Win 5 grid puzzles' },
      gold: { threshold: 25, title: 'Grid Expert', description: 'Win 25 grid puzzles' },
      diamond: { threshold: 100, title: 'Grid Legend', description: 'Win 100 grid puzzles' },
    },
  },
  win_streak: {
    id: 'win_streak',
    baseTitle: 'Streak Master',
    icon: '🔥',
    tiers: {
      bronze: { threshold: 3, title: 'Hot Streak', description: '3-day win streak' },
      silver: { threshold: 7, title: 'Week Warrior', description: '7-day win streak' },
      gold: { threshold: 14, title: 'Fortnight Force', description: '14-day win streak' },
      diamond: { threshold: 30, title: 'Monthly Master', description: '30-day win streak' },
    },
  },
  long_words: {
    id: 'long_words',
    baseTitle: 'Wordsmith',
    icon: '📚',
    tiers: {
      bronze: { threshold: 1, title: 'Word Builder', description: 'Submit 1 six-letter word' },
      silver: { threshold: 10, title: 'Word Crafter', description: 'Submit 10 six-letter words' },
      gold: { threshold: 50, title: 'Word Artisan', description: 'Submit 50 six-letter words' },
      diamond: { threshold: 200, title: 'Word Virtuoso', description: 'Submit 200 six-letter words' },
    },
  },
  epic_words: {
    id: 'epic_words',
    baseTitle: 'Epic Finder',
    icon: '⭐',
    tiers: {
      bronze: { threshold: 1, title: 'Epic Discovery', description: 'Submit 1 seven+ letter word' },
      silver: { threshold: 10, title: 'Epic Hunter', description: 'Submit 10 seven+ letter words' },
      gold: { threshold: 25, title: 'Epic Seeker', description: 'Submit 25 seven+ letter words' },
      diamond: { threshold: 100, title: 'Epic Master', description: 'Submit 100 seven+ letter words' },
    },
  },
  efficient_wins: {
    id: 'efficient_wins',
    baseTitle: 'Efficiency Expert',
    icon: '🎯',
    tiers: {
      bronze: { threshold: 1, title: 'Efficient Once', description: 'Win in ≤15 moves once' },
      silver: { threshold: 5, title: 'Consistently Efficient', description: 'Win in ≤12 moves 5 times' },
      gold: { threshold: 15, title: 'Efficiency Master', description: 'Win in ≤10 moves 15 times' },
      diamond: { threshold: 50, title: 'Efficiency Legend', description: 'Win in ≤8 moves 50 times' },
    },
  },
  speed_wins: {
    id: 'speed_wins',
    baseTitle: 'Speed Runner',
    icon: '⏱️',
    tiers: {
      bronze: { threshold: 1, title: 'Quick Finish', description: 'Win in under 5 minutes once' },
      silver: { threshold: 5, title: 'Fast Player', description: 'Win in under 3 minutes 5 times' },
      gold: { threshold: 15, title: 'Speed Demon', description: 'Win in under 2 minutes 15 times' },
      diamond: { threshold: 50, title: 'Lightning Fast', description: 'Win in under 90 seconds 50 times' },
    },
  },
  cascade_upgrades: {
    id: 'cascade_upgrades',
    baseTitle: 'Cascade Master',
    icon: '🌊',
    tiers: {
      bronze: { threshold: 10, title: 'Cascade Starter', description: 'Trigger 10 cascade upgrades' },
      silver: { threshold: 50, title: 'Cascade Rider', description: 'Trigger 50 cascade upgrades' },
      gold: { threshold: 150, title: 'Cascade Expert', description: 'Trigger 150 cascade upgrades' },
      diamond: { threshold: 500, title: 'Cascade King', description: 'Trigger 500 cascade upgrades' },
    },
  },
  total_words: {
    id: 'total_words',
    baseTitle: 'Word Volume',
    icon: '📖',
    tiers: {
      bronze: { threshold: 50, title: 'Word Collector', description: 'Submit 50 total words' },
      silver: { threshold: 200, title: 'Word Hoarder', description: 'Submit 200 total words' },
      gold: { threshold: 500, title: 'Word Librarian', description: 'Submit 500 total words' },
      diamond: { threshold: 1000, title: 'Word Archivist', description: 'Submit 1000 total words' },
    },
  },
};

export const getTierForProgress = (progress: number, achievement: TieredAchievement): AchievementTier => {
  if (progress >= achievement.tiers.diamond.threshold) return 'diamond';
  if (progress >= achievement.tiers.gold.threshold) return 'gold';
  if (progress >= achievement.tiers.silver.threshold) return 'silver';
  if (progress >= achievement.tiers.bronze.threshold) return 'bronze';
  return 'none';
};

export const getNextTierThreshold = (progress: number, achievement: TieredAchievement): number | null => {
  if (progress < achievement.tiers.bronze.threshold) return achievement.tiers.bronze.threshold;
  if (progress < achievement.tiers.silver.threshold) return achievement.tiers.silver.threshold;
  if (progress < achievement.tiers.gold.threshold) return achievement.tiers.gold.threshold;
  if (progress < achievement.tiers.diamond.threshold) return achievement.tiers.diamond.threshold;
  return null;
};

export const TIER_COLORS: Record<AchievementTier, string> = {
  none: 'text-muted-foreground',
  bronze: 'text-amber-600',
  silver: 'text-slate-400',
  gold: 'text-yellow-500',
  diamond: 'text-cyan-400',
};

export const TIER_BG_COLORS: Record<AchievementTier, string> = {
  none: 'bg-muted/50',
  bronze: 'bg-amber-500/20',
  silver: 'bg-slate-400/20',
  gold: 'bg-yellow-500/20',
  diamond: 'bg-cyan-400/20',
};

export interface GridAchievementContext {
  won: boolean;
  moves: number;
  wordsSubmitted: number;
  timeMs: number;
  longestWord: number;
  usedPowerTile: boolean;
  purpleCount: number;
  currentStreak: number;
  totalWins: number;
  mutationCount: number;
  usedCorner: boolean;
  usedDiagonal: boolean;
}

export const checkGridAchievements = (context: GridAchievementContext): string[] => {
  const earned: string[] = [];

  if (!context.won) return earned;

  // First Grid Win
  if (context.totalWins === 1) {
    earned.push('first_grid_win');
  }

  // Efficient Solver - 10 moves or fewer
  if (context.moves <= 10) {
    earned.push('efficient_solver');
  }

  // Perfect Grid - 8 moves or fewer
  if (context.moves <= 8) {
    earned.push('perfect_grid');
  }

  // Clutch Victory - move 19 or 20
  if (context.moves >= 19) {
    earned.push('clutch_victory');
  }

  // Speedster - under 3 minutes
  if (context.timeMs < 180000) {
    earned.push('speedster');
  }

  // Speed Demon - under 90 seconds
  if (context.timeMs < 90000) {
    earned.push('speed_demon');
  }

  // Word Hunter - 15+ words
  if (context.wordsSubmitted >= 15) {
    earned.push('word_hunter');
  }

  // Minimalist - only 6 words
  if (context.wordsSubmitted <= 6) {
    earned.push('minimalist');
  }

  // Long Word Finder - 7+ letter word
  if (context.longestWord >= 7) {
    earned.push('long_word_finder');
  }

  // Monster Chain - 9+ letter word
  if (context.longestWord >= 9) {
    earned.push('monster_chain');
  }

  // Power Player - used power tile
  if (context.usedPowerTile) {
    earned.push('power_player');
  }

  // Corner Conqueror
  if (context.usedCorner) {
    earned.push('corner_start');
  }

  // Diagonal Master
  if (context.usedDiagonal) {
    earned.push('diagonal_master');
  }

  return earned;
};

const GRID_ACHIEVEMENTS_KEY = 'grid_achievements';
const GRID_TIERED_PROGRESS_KEY = 'grid_tiered_progress';

export const saveGridAchievements = (achievementIds: string[]): void => {
  const existing = getGridAchievements();
  const combined = new Set([...existing, ...achievementIds]);
  localStorage.setItem(GRID_ACHIEVEMENTS_KEY, JSON.stringify([...combined]));
};

export const getGridAchievements = (): string[] => {
  try {
    const stored = localStorage.getItem(GRID_ACHIEVEMENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const getNewGridAchievements = (
  earned: string[],
  alreadyUnlocked: string[]
): string[] => {
  return earned.filter(id => !alreadyUnlocked.includes(id));
};

// Tiered achievement progress tracking
export interface TieredProgress {
  grid_wins: number;
  win_streak: number;
  max_win_streak: number;
  long_words: number;
  epic_words: number;
  efficient_wins_15: number;
  efficient_wins_12: number;
  efficient_wins_10: number;
  efficient_wins_8: number;
  speed_wins_5min: number;
  speed_wins_3min: number;
  speed_wins_2min: number;
  speed_wins_90sec: number;
  cascade_upgrades: number;
  total_words: number;
}

export const getDefaultTieredProgress = (): TieredProgress => ({
  grid_wins: 0,
  win_streak: 0,
  max_win_streak: 0,
  long_words: 0,
  epic_words: 0,
  efficient_wins_15: 0,
  efficient_wins_12: 0,
  efficient_wins_10: 0,
  efficient_wins_8: 0,
  speed_wins_5min: 0,
  speed_wins_3min: 0,
  speed_wins_2min: 0,
  speed_wins_90sec: 0,
  cascade_upgrades: 0,
  total_words: 0,
});

export const loadTieredProgress = (): TieredProgress => {
  try {
    const stored = localStorage.getItem(GRID_TIERED_PROGRESS_KEY);
    if (stored) {
      return { ...getDefaultTieredProgress(), ...JSON.parse(stored) };
    }
  } catch {
    // ignore
  }
  return getDefaultTieredProgress();
};

export const saveTieredProgress = (progress: TieredProgress): void => {
  localStorage.setItem(GRID_TIERED_PROGRESS_KEY, JSON.stringify(progress));
};

export const updateTieredProgress = (update: Partial<TieredProgress>): TieredProgress => {
  const current = loadTieredProgress();
  const updated = { ...current, ...update };
  saveTieredProgress(updated);
  return updated;
};