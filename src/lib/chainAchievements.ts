// Achievement system for Morph Chain
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  flavorText: string;
}

export const CHAIN_ACHIEVEMENTS: Record<string, Achievement> = {
  // === FIRST MILESTONES ===
  first_win: {
    id: 'first_win',
    title: 'First Victory',
    description: 'Win your first Morph Chain puzzle',
    icon: '🏆',
    flavorText: 'The journey begins!',
  },
  first_4l_win: {
    id: 'first_4l_win',
    title: 'Four Letter Start',
    description: 'Win your first 4-letter puzzle',
    icon: '4️⃣',
    flavorText: 'Mastering the basics!',
  },
  first_5l_win: {
    id: 'first_5l_win',
    title: 'Five Letter Start',
    description: 'Win your first 5-letter puzzle',
    icon: '5️⃣',
    flavorText: 'Stepping up!',
  },

  // === PERFORMANCE ACHIEVEMENTS ===
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
  double_perfect: {
    id: 'double_perfect',
    title: 'Double Diamond',
    description: 'Get a perfect solve on both 4L and 5L on the same day',
    icon: '💎💎',
    flavorText: 'Twice the perfection!',
  },
  three_under_par: {
    id: 'three_under_par',
    title: 'Birdie Master',
    description: 'Solve 3 puzzles under par',
    icon: '🐦',
    flavorText: 'Consistently excellent!',
  },
  ten_under_par: {
    id: 'ten_under_par',
    title: 'Eagle Eye',
    description: 'Solve 10 puzzles under par',
    icon: '🦅',
    flavorText: 'A true pathfinder!',
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
  close_call: {
    id: 'close_call',
    title: 'Close Call',
    description: 'Win on your last available move',
    icon: '😰',
    flavorText: 'That was close!',
  },

  // === SPEED ACHIEVEMENTS ===
  speed_solver: {
    id: 'speed_solver',
    title: 'Speed Solver',
    description: 'Solve a puzzle in under 60 seconds',
    icon: '⚡',
    flavorText: 'Lightning fast!',
  },
  blitz_solver: {
    id: 'blitz_solver',
    title: 'Blitz Solver',
    description: 'Solve a puzzle in under 30 seconds',
    icon: '💨',
    flavorText: 'Blazing speed!',
  },
  instant_win: {
    id: 'instant_win',
    title: 'Instant Win',
    description: 'Solve a puzzle in under 15 seconds',
    icon: '⏱️',
    flavorText: 'Did you even blink?',
  },
  consistent_speed: {
    id: 'consistent_speed',
    title: 'Consistent Speedster',
    description: 'Solve 5 puzzles in under 60 seconds each',
    icon: '🏃',
    flavorText: 'Always quick!',
  },

  // === STREAK ACHIEVEMENTS ===
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
  fortnight_fighter: {
    id: 'fortnight_fighter',
    title: 'Fortnight Fighter',
    description: 'Win 14 days in a row',
    icon: '🛡️',
    flavorText: 'Two weeks strong!',
  },
  daily_devotee: {
    id: 'daily_devotee',
    title: 'Daily Devotee',
    description: 'Win 30 days in a row',
    icon: '📅',
    flavorText: 'A month of mastery!',
  },
  streak_guardian: {
    id: 'streak_guardian',
    title: 'Streak Guardian',
    description: 'Win 60 days in a row',
    icon: '🏛️',
    flavorText: 'Two months of dedication!',
  },
  streak_legend: {
    id: 'streak_legend',
    title: 'Streak Legend',
    description: 'Win 100 days in a row',
    icon: '👑',
    flavorText: 'Legendary consistency!',
  },

  // === TOTAL WINS ACHIEVEMENTS ===
  ten_wins: {
    id: 'ten_wins',
    title: 'Getting Started',
    description: 'Win 10 total puzzles',
    icon: '🔟',
    flavorText: 'Double digits!',
  },
  twenty_five_wins: {
    id: 'twenty_five_wins',
    title: 'Quarter Century',
    description: 'Win 25 total puzzles',
    icon: '🎖️',
    flavorText: 'A quarter of the way!',
  },
  fifty_wins: {
    id: 'fifty_wins',
    title: 'Half Century',
    description: 'Win 50 total puzzles',
    icon: '🎗️',
    flavorText: 'Halfway to 100!',
  },
  centurion: {
    id: 'centurion',
    title: 'Centurion',
    description: 'Win 100 total puzzles',
    icon: '💯',
    flavorText: 'Master morpher!',
  },
  double_centurion: {
    id: 'double_centurion',
    title: 'Double Centurion',
    description: 'Win 200 total puzzles',
    icon: '🏅',
    flavorText: 'Dedication personified!',
  },
  five_hundred_club: {
    id: 'five_hundred_club',
    title: '500 Club',
    description: 'Win 500 total puzzles',
    icon: '🎯',
    flavorText: 'Elite status achieved!',
  },

  // === DAILY CHALLENGES ===
  both_lengths: {
    id: 'both_lengths',
    title: 'Double Dipper',
    description: 'Win both 4L and 5L on the same day',
    icon: '✌️',
    flavorText: 'Twice the fun!',
  },
  daily_sweep: {
    id: 'daily_sweep',
    title: 'Daily Sweep',
    description: 'Win both lengths under par on the same day',
    icon: '🧹',
    flavorText: 'Clean sweep!',
  },
  morning_person: {
    id: 'morning_person',
    title: 'Morning Person',
    description: 'Win a puzzle before 8 AM',
    icon: '🌅',
    flavorText: 'Early bird gets the word!',
  },
  night_owl: {
    id: 'night_owl',
    title: 'Night Owl',
    description: 'Win a puzzle after 11 PM',
    icon: '🦉',
    flavorText: 'Burning the midnight oil!',
  },
  weekend_warrior: {
    id: 'weekend_warrior',
    title: 'Weekend Warrior',
    description: 'Win puzzles on both Saturday and Sunday',
    icon: '🎉',
    flavorText: 'Weekend dedication!',
  },

  // === HARD MODE ACHIEVEMENTS ===
  hard_mode_hero: {
    id: 'hard_mode_hero',
    title: 'Hard Mode Hero',
    description: 'Win a puzzle in Hard Mode',
    icon: '🦸',
    flavorText: 'No wrong turns!',
  },
  hard_mode_streak_3: {
    id: 'hard_mode_streak_3',
    title: 'Hard Mode Streak',
    description: 'Win 3 hard mode puzzles in a row',
    icon: '💪',
    flavorText: 'Tough and consistent!',
  },
  hard_mode_streak_7: {
    id: 'hard_mode_streak_7',
    title: 'Hard Mode Master',
    description: 'Win 7 hard mode puzzles in a row',
    icon: '🏋️',
    flavorText: 'Week of intensity!',
  },
  hard_mode_perfect: {
    id: 'hard_mode_perfect',
    title: 'Hard Mode Diamond',
    description: 'Get a perfect solve in Hard Mode',
    icon: '💠',
    flavorText: 'Flawless under pressure!',
  },
  hard_mode_both: {
    id: 'hard_mode_both',
    title: 'Hard Mode Double',
    description: 'Win both 4L and 5L in Hard Mode on the same day',
    icon: '🎖️',
    flavorText: 'Maximum challenge conquered!',
  },

  // === SPECIAL WORD ACHIEVEMENTS ===
  vowel_master: {
    id: 'vowel_master',
    title: 'Vowel Master',
    description: 'Win a puzzle by only changing vowels',
    icon: '🔤',
    flavorText: 'AEIOU expert!',
  },
  consonant_king: {
    id: 'consonant_king',
    title: 'Consonant King',
    description: 'Win a puzzle by only changing consonants',
    icon: '👑',
    flavorText: 'BCDFG master!',
  },
  position_specialist: {
    id: 'position_specialist',
    title: 'Position Specialist',
    description: 'Win 5 puzzles changing only the same position',
    icon: '📍',
    flavorText: 'Creature of habit!',
  },

  // === COMEBACK & CHALLENGE ACHIEVEMENTS ===
  recovery_expert: {
    id: 'recovery_expert',
    title: 'Recovery Expert',
    description: 'Win after making a move that went further from goal',
    icon: '🔙',
    flavorText: 'Found your way back!',
  },
  clutch_player: {
    id: 'clutch_player',
    title: 'Clutch Player',
    description: 'Win 3 puzzles on the last move',
    icon: '🎰',
    flavorText: 'Living on the edge!',
  },
  
  // === EXPLORATION ACHIEVEMENTS ===
  explorer: {
    id: 'explorer',
    title: 'Explorer',
    description: 'Use 20 different unique words across all puzzles',
    icon: '🗺️',
    flavorText: 'Building vocabulary!',
  },
  word_collector: {
    id: 'word_collector',
    title: 'Word Collector',
    description: 'Use 50 different unique words across all puzzles',
    icon: '📚',
    flavorText: 'Quite the collection!',
  },
  lexicon_master: {
    id: 'lexicon_master',
    title: 'Lexicon Master',
    description: 'Use 100 different unique words across all puzzles',
    icon: '📖',
    flavorText: 'Walking dictionary!',
  },

  // === FUN ACHIEVEMENTS ===
  palindrome_path: {
    id: 'palindrome_path',
    title: 'Palindrome Path',
    description: 'Use a palindrome word in your solution',
    icon: '🔁',
    flavorText: 'Same forwards and backwards!',
  },
  lucky_seven: {
    id: 'lucky_seven',
    title: 'Lucky Seven',
    description: 'Win a puzzle in exactly 7 moves',
    icon: '🍀',
    flavorText: 'The magic number!',
  },
  triple_threat: {
    id: 'triple_threat',
    title: 'Triple Threat',
    description: 'Win 3 puzzles in a single day (including practice)',
    icon: '3️⃣',
    flavorText: 'Three times the charm!',
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
  // Extended tracking
  totalUnderPar?: number;
  totalSpeedSolves?: number;
  hardModeStreak?: number;
  perfectSolves4L?: number;
  perfectSolves5L?: number;
  clutchWins?: number;
  uniqueWordsUsed?: number;
  hourOfDay?: number;
  wonOnSaturday?: boolean;
  wonOnSunday?: boolean;
  usedPalindrome?: boolean;
  onlyChangedVowels?: boolean;
  onlyChangedConsonants?: boolean;
}

export const checkChainAchievements = (context: ChainAchievementContext): string[] => {
  const earned: string[] = [];

  if (!context.won) return earned;

  // === FIRST MILESTONES ===
  if (context.totalWins === 1) {
    earned.push('first_win');
  }

  // Track first win per word length independently (not tied to overall totalWins)
  if (context.wordLength === 4) {
    earned.push('first_4l_win');
  }

  if (context.wordLength === 5) {
    earned.push('first_5l_win');
  }

  // === PERFORMANCE ===
  const par = context.minDistance + 2;
  if (context.movesUsed < par) {
    earned.push('par_buster');
  }

  if (context.movesUsed === context.minDistance) {
    earned.push('perfect_solve');
  }

  if (!context.hadWorseMove) {
    earned.push('no_detours');
  }

  if (context.movesUsed > context.maxMoves * 0.75) {
    earned.push('comeback_kid');
  }

  if (context.movesUsed === context.maxMoves) {
    earned.push('close_call');
  }

  // Under par milestones
  if (context.totalUnderPar && context.totalUnderPar >= 3) {
    earned.push('three_under_par');
  }

  if (context.totalUnderPar && context.totalUnderPar >= 10) {
    earned.push('ten_under_par');
  }

  // === SPEED ===
  if (context.timeElapsedSeconds < 60) {
    earned.push('speed_solver');
  }

  if (context.timeElapsedSeconds < 30) {
    earned.push('blitz_solver');
  }

  if (context.timeElapsedSeconds < 15) {
    earned.push('instant_win');
  }

  if (context.totalSpeedSolves && context.totalSpeedSolves >= 5) {
    earned.push('consistent_speed');
  }

  // === STREAKS ===
  if (context.currentStreak >= 3) {
    earned.push('streak_starter');
  }

  if (context.currentStreak >= 7) {
    earned.push('week_warrior');
  }

  if (context.currentStreak >= 14) {
    earned.push('fortnight_fighter');
  }

  if (context.currentStreak >= 30) {
    earned.push('daily_devotee');
  }

  if (context.currentStreak >= 60) {
    earned.push('streak_guardian');
  }

  if (context.currentStreak >= 100) {
    earned.push('streak_legend');
  }

  // === TOTAL WINS ===
  if (context.totalWins >= 10) {
    earned.push('ten_wins');
  }

  if (context.totalWins >= 25) {
    earned.push('twenty_five_wins');
  }

  if (context.totalWins >= 50) {
    earned.push('fifty_wins');
  }

  if (context.totalWins >= 100) {
    earned.push('centurion');
  }

  if (context.totalWins >= 200) {
    earned.push('double_centurion');
  }

  if (context.totalWins >= 500) {
    earned.push('five_hundred_club');
  }

  // === DAILY CHALLENGES ===
  if (context.wonBothToday) {
    earned.push('both_lengths');
  }

  // Double perfect
  if (context.perfectSolves4L && context.perfectSolves5L && 
      context.perfectSolves4L > 0 && context.perfectSolves5L > 0) {
    earned.push('double_perfect');
  }

  // Time of day achievements
  if (context.hourOfDay !== undefined && context.hourOfDay < 8) {
    earned.push('morning_person');
  }

  if (context.hourOfDay !== undefined && context.hourOfDay >= 23) {
    earned.push('night_owl');
  }

  if (context.hardMode && context.wonBothToday) {
    earned.push('hard_mode_both');
  }

  // Weekend warrior — must have won on both Saturday AND Sunday
  if (context.wonOnSaturday && context.wonOnSunday) {
    earned.push('weekend_warrior');
  }

  // === HARD MODE ===
  if (context.hardMode) {
    earned.push('hard_mode_hero');
  }

  if (context.hardMode && context.movesUsed === context.minDistance) {
    earned.push('hard_mode_perfect');
  }

  if (context.hardModeStreak && context.hardModeStreak >= 3) {
    earned.push('hard_mode_streak_3');
  }

  if (context.hardModeStreak && context.hardModeStreak >= 7) {
    earned.push('hard_mode_streak_7');
  }

  // === SPECIAL WORDS ===
  if (context.onlyChangedVowels) {
    earned.push('vowel_master');
  }

  if (context.onlyChangedConsonants) {
    earned.push('consonant_king');
  }

  if (context.usedPalindrome) {
    earned.push('palindrome_path');
  }

  // === CLUTCH ===
  if (context.clutchWins && context.clutchWins >= 3) {
    earned.push('clutch_player');
  }

  // === EXPLORATION ===
  if (context.uniqueWordsUsed && context.uniqueWordsUsed >= 20) {
    earned.push('explorer');
  }

  if (context.uniqueWordsUsed && context.uniqueWordsUsed >= 50) {
    earned.push('word_collector');
  }

  if (context.uniqueWordsUsed && context.uniqueWordsUsed >= 100) {
    earned.push('lexicon_master');
  }

  // === FUN ===
  if (context.movesUsed === 7) {
    earned.push('lucky_seven');
  }

  if (context.hadWorseMove) {
    earned.push('recovery_expert');
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
