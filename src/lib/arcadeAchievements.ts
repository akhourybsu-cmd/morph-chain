// Achievement system for Morph Arcade
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  flavorText: string;
}

export const ARCADE_ACHIEVEMENTS: Record<string, Achievement> = {
  // Basic milestones
  arcade_rookie: {
    id: 'arcade_rookie',
    title: 'Arcade Rookie',
    description: 'Complete your first Arcade puzzle',
    icon: '🕹️',
    flavorText: 'Insert coin to continue!',
  },
  arcade_veteran: {
    id: 'arcade_veteran',
    title: 'Arcade Veteran',
    description: 'Complete 10 Arcade puzzles',
    icon: '🎮',
    flavorText: 'A seasoned player!',
  },
  arcade_master: {
    id: 'arcade_master',
    title: 'Arcade Master',
    description: 'Complete 50 Arcade puzzles',
    icon: '👑',
    flavorText: 'The arcade champion!',
  },
  
  // Efficiency achievements
  optimal_path: {
    id: 'optimal_path',
    title: 'Optimal Path',
    description: 'Solve a puzzle at minimum distance',
    icon: '💎',
    flavorText: 'The shortest route!',
  },
  under_par: {
    id: 'under_par',
    title: 'Under Par',
    description: 'Solve a puzzle under par',
    icon: '⛳',
    flavorText: 'Better than expected!',
  },
  no_backtrack: {
    id: 'no_backtrack',
    title: 'No Backtracking',
    description: 'Win without any moves away from goal',
    icon: '➡️',
    flavorText: 'Straight ahead!',
  },
  
  // Speed achievements
  quick_solver: {
    id: 'quick_solver',
    title: 'Quick Solver',
    description: 'Solve a puzzle in under 60 seconds',
    icon: '⚡',
    flavorText: 'Speed demon!',
  },
  lightning_round: {
    id: 'lightning_round',
    title: 'Lightning Round',
    description: 'Solve a puzzle in under 30 seconds',
    icon: '⚡',
    flavorText: 'Blazing fast!',
  },
  
  // Streak achievements
  arcade_streak_3: {
    id: 'arcade_streak_3',
    title: 'Arcade Streak',
    description: 'Win 3 daily arcade puzzles in a row',
    icon: '🔥',
    flavorText: 'Keep it going!',
  },
  arcade_streak_7: {
    id: 'arcade_streak_7',
    title: 'Arcade Champion',
    description: 'Win 7 daily arcade puzzles in a row',
    icon: '🏆',
    flavorText: 'A full week of wins!',
  },
  
  // Special achievements
  comeback_victory: {
    id: 'comeback_victory',
    title: 'Comeback Victory',
    description: 'Win after using 80%+ of max moves',
    icon: '🔄',
    flavorText: 'Never give up!',
  },
  high_scorer: {
    id: 'high_scorer',
    title: 'High Scorer',
    description: 'Reach the top 10 on the daily leaderboard',
    icon: '🥇',
    flavorText: 'Elite player!',
  },
};

export interface ArcadeAchievementContext {
  won: boolean;
  movesUsed: number;
  minDistance: number;
  maxMoves: number;
  timeSeconds: number;
  currentStreak: number;
  totalWins: number;
  hadWorseMove: boolean;
  leaderboardRank?: number;
}

export const checkArcadeAchievements = (context: ArcadeAchievementContext): string[] => {
  const earned: string[] = [];

  if (!context.won) return earned;

  // Arcade Rookie - first win
  if (context.totalWins === 1) {
    earned.push('arcade_rookie');
  }

  // Arcade Veteran - 10 wins
  if (context.totalWins >= 10) {
    earned.push('arcade_veteran');
  }

  // Arcade Master - 50 wins
  if (context.totalWins >= 50) {
    earned.push('arcade_master');
  }

  // Optimal Path - minimum distance
  if (context.movesUsed === context.minDistance) {
    earned.push('optimal_path');
  }

  // Under Par
  const par = context.minDistance + 2;
  if (context.movesUsed < par) {
    earned.push('under_par');
  }

  // No Backtracking
  if (!context.hadWorseMove) {
    earned.push('no_backtrack');
  }

  // Quick Solver - under 60 seconds
  if (context.timeSeconds < 60) {
    earned.push('quick_solver');
  }

  // Lightning Round - under 30 seconds
  if (context.timeSeconds < 30) {
    earned.push('lightning_round');
  }

  // Streak achievements
  if (context.currentStreak >= 3) {
    earned.push('arcade_streak_3');
  }

  if (context.currentStreak >= 7) {
    earned.push('arcade_streak_7');
  }

  // Comeback Victory - used 80%+ of moves
  if (context.movesUsed >= context.maxMoves * 0.8) {
    earned.push('comeback_victory');
  }

  // High Scorer - top 10
  if (context.leaderboardRank && context.leaderboardRank <= 10) {
    earned.push('high_scorer');
  }

  return earned;
};

const ARCADE_ACHIEVEMENTS_KEY = 'arcade_achievements';

export const saveArcadeAchievements = (achievementIds: string[]): void => {
  const existing = getArcadeAchievements();
  const combined = new Set([...existing, ...achievementIds]);
  localStorage.setItem(ARCADE_ACHIEVEMENTS_KEY, JSON.stringify([...combined]));
};

export const getArcadeAchievements = (): string[] => {
  try {
    const stored = localStorage.getItem(ARCADE_ACHIEVEMENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const getNewArcadeAchievements = (
  earned: string[],
  alreadyUnlocked: string[]
): string[] => {
  return earned.filter(id => !alreadyUnlocked.includes(id));
};
