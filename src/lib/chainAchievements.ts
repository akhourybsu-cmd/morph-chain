// Achievement system for Morph Chain
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  flavorText: string;
}

export const CHAIN_ACHIEVEMENTS: Record<string, Achievement> = {
  first_win: {
    id: 'first_win',
    title: 'First Victory',
    description: 'Win your first Morph Chain puzzle',
    icon: '🏆',
    flavorText: 'The journey begins!',
  },
  par_buster: {
    id: 'par_buster',
    title: 'Par Buster',
    description: 'Solve a puzzle under par',
    icon: '⭐',
    flavorText: 'Below par excellence!',
  },
  perfect_solve: {
    id: 'perfect_solve',
    title: 'Perfect Solve',
    description: 'Solve a puzzle at minimum distance',
    icon: '💎',
    flavorText: 'Optimal path found!',
  },
  streak_starter: {
    id: 'streak_starter',
    title: 'Streak Starter',
    description: 'Win 3 days in a row',
    icon: '🔥',
    flavorText: 'Getting warmed up!',
  },
  week_warrior: {
    id: 'week_warrior',
    title: 'Week Warrior',
    description: 'Win 7 days in a row',
    icon: '⚔️',
    flavorText: 'A full week of wins!',
  },
  hard_mode_hero: {
    id: 'hard_mode_hero',
    title: 'Hard Mode Hero',
    description: 'Win a puzzle in Hard Mode',
    icon: '🦸',
    flavorText: 'No wrong turns!',
  },
  both_lengths: {
    id: 'both_lengths',
    title: 'Double Dipper',
    description: 'Win both 4L and 5L on the same day',
    icon: '✌️',
    flavorText: 'Twice the fun!',
  },
  speed_solver: {
    id: 'speed_solver',
    title: 'Speed Solver',
    description: 'Solve a puzzle in under 60 seconds',
    icon: '⚡',
    flavorText: 'Lightning fast!',
  },
  no_detours: {
    id: 'no_detours',
    title: 'No Detours',
    description: 'Win without any moves away from goal',
    icon: '🎯',
    flavorText: 'Straight to the point!',
  },
  comeback_kid: {
    id: 'comeback_kid',
    title: 'Comeback Kid',
    description: 'Win after using more than 75% of moves',
    icon: '🔄',
    flavorText: 'Never give up!',
  },
  centurion: {
    id: 'centurion',
    title: 'Centurion',
    description: 'Win 100 total puzzles',
    icon: '💯',
    flavorText: 'Master morpher!',
  },
  daily_devotee: {
    id: 'daily_devotee',
    title: 'Daily Devotee',
    description: 'Win 30 days in a row',
    icon: '📅',
    flavorText: 'A month of mastery!',
  },
};

export interface ChainAchievementContext {
  won: boolean;
  movesUsed: number;
  minDistance: number;
  maxMoves: number;
  hardMode: boolean;
  currentStreak: number;
  totalWins: number;
  wordLength: 4 | 5;
  wonBothToday: boolean;
  timeElapsedSeconds: number;
  hadWorseMove: boolean;
}

export const checkChainAchievements = (context: ChainAchievementContext): string[] => {
  const earned: string[] = [];

  if (!context.won) return earned;

  // First Victory - first ever win
  if (context.totalWins === 1) {
    earned.push('first_win');
  }

  // Par Buster - solved under par (moves < minDistance + buffer)
  // Par is typically minDistance + 2
  const par = context.minDistance + 2;
  if (context.movesUsed < par) {
    earned.push('par_buster');
  }

  // Perfect Solve - exactly at minimum distance
  if (context.movesUsed === context.minDistance) {
    earned.push('perfect_solve');
  }

  // Streak Starter - 3 day streak
  if (context.currentStreak >= 3) {
    earned.push('streak_starter');
  }

  // Week Warrior - 7 day streak
  if (context.currentStreak >= 7) {
    earned.push('week_warrior');
  }

  // Daily Devotee - 30 day streak
  if (context.currentStreak >= 30) {
    earned.push('daily_devotee');
  }

  // Hard Mode Hero - win in hard mode
  if (context.hardMode) {
    earned.push('hard_mode_hero');
  }

  // Double Dipper - won both lengths today
  if (context.wonBothToday) {
    earned.push('both_lengths');
  }

  // Speed Solver - under 60 seconds
  if (context.timeElapsedSeconds < 60) {
    earned.push('speed_solver');
  }

  // No Detours - no moves that went further from goal
  if (!context.hadWorseMove) {
    earned.push('no_detours');
  }

  // Comeback Kid - used more than 75% of moves
  if (context.movesUsed > context.maxMoves * 0.75) {
    earned.push('comeback_kid');
  }

  // Centurion - 100 total wins
  if (context.totalWins >= 100) {
    earned.push('centurion');
  }

  return earned;
};

const CHAIN_ACHIEVEMENTS_KEY = 'chain_achievements';

export const saveChainAchievements = (achievementIds: string[]): void => {
  const existing = getChainAchievements();
  const combined = new Set([...existing, ...achievementIds]);
  localStorage.setItem(CHAIN_ACHIEVEMENTS_KEY, JSON.stringify([...combined]));
};

export const getChainAchievements = (): string[] => {
  try {
    const stored = localStorage.getItem(CHAIN_ACHIEVEMENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const getNewChainAchievements = (
  earned: string[],
  alreadyUnlocked: string[]
): string[] => {
  return earned.filter(id => !alreadyUnlocked.includes(id));
};
