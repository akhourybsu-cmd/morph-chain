// Achievement system for Morph Grid
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  flavorText: string;
}

export const GRID_ACHIEVEMENTS: Record<string, Achievement> = {
  // Basic milestones
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
  purple_rain: {
    id: 'purple_rain',
    title: 'Purple Rain',
    description: 'Have 20+ purple tiles at once',
    icon: '💜',
    flavorText: 'So much purple!',
  },
  grid_streak_3: {
    id: 'grid_streak_3',
    title: 'Grid Streak',
    description: 'Win 3 daily grids in a row',
    icon: '🔥',
    flavorText: 'On a roll!',
  },
  grid_streak_7: {
    id: 'grid_streak_7',
    title: 'Grid Warrior',
    description: 'Win 7 daily grids in a row',
    icon: '⚔️',
    flavorText: 'A week of victories!',
  },
  morphology: {
    id: 'morphology',
    title: 'Morphology Expert',
    description: 'Cause 50 tile mutations in one game',
    icon: '🧬',
    flavorText: 'Master of change!',
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

  // Speedster - under 3 minutes
  if (context.timeMs < 180000) {
    earned.push('speedster');
  }

  // Word Hunter - 15+ words
  if (context.wordsSubmitted >= 15) {
    earned.push('word_hunter');
  }

  // Long Word Finder - 7+ letter word
  if (context.longestWord >= 7) {
    earned.push('long_word_finder');
  }

  // Power Player - used power tile
  if (context.usedPowerTile) {
    earned.push('power_player');
  }

  // Purple Rain - 20+ purple tiles
  if (context.purpleCount >= 20) {
    earned.push('purple_rain');
  }

  // Grid Streak 3
  if (context.currentStreak >= 3) {
    earned.push('grid_streak_3');
  }

  // Grid Streak 7
  if (context.currentStreak >= 7) {
    earned.push('grid_streak_7');
  }

  // Morphology Expert - 50+ mutations
  if (context.mutationCount >= 50) {
    earned.push('morphology');
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
