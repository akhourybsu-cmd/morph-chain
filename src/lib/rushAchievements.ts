// Achievement system for Morph Rush
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  flavorText: string;
}

export const ACHIEVEMENTS: Record<string, Achievement> = {
  brainwave: {
    id: 'brainwave',
    title: 'Brainwave',
    description: '3 correct morphs within 10 seconds',
    icon: '💡',
    flavorText: 'Quick thinking!',
  },
  synapse_surge: {
    id: 'synapse_surge',
    title: 'Synapse Surge',
    description: '5 morphs with no errors',
    icon: '⚡',
    flavorText: 'No mistakes!',
  },
  hyperfocus: {
    id: 'hyperfocus',
    title: 'Hyperfocus',
    description: '10-second streak without typing pause',
    icon: '🧠',
    flavorText: 'Mode Activated!',
  },
  double_helix: {
    id: 'double_helix',
    title: 'Double Helix',
    description: 'Two morphs using the same letter position',
    icon: '🔁',
    flavorText: 'Achieved!',
  },
  neuron_burst: {
    id: 'neuron_burst',
    title: 'Neuron Burst',
    description: '10 total morphs completed',
    icon: '🔥',
    flavorText: "You're on fire!",
  },
  flawless_flow: {
    id: 'flawless_flow',
    title: 'Flawless Flow',
    description: 'No mistakes in entire session',
    icon: '🌟',
    flavorText: 'Pure precision.',
  },
  time_bender: {
    id: 'time_bender',
    title: 'Time Bender',
    description: 'Last-second successful morph (<2s remaining)',
    icon: '⏳',
    flavorText: 'You bent the clock.',
  },
  multiplier_master: {
    id: 'multiplier_master',
    title: 'Multiplier Master',
    description: 'Reach 2.0x multiplier',
    icon: '⚡',
    flavorText: 'Maximum charge!',
  },
  word_wizard: {
    id: 'word_wizard',
    title: 'Word Wizard',
    description: '20 morphs in one session',
    icon: '🧙',
    flavorText: 'Mastery achieved!',
  },
  speed_demon: {
    id: 'speed_demon',
    title: 'Speed Demon',
    description: '5 morphs in 15 seconds',
    icon: '👹',
    flavorText: 'Lightning fast!',
  },
};

export interface AchievementProgress {
  brainwaveStreak?: { count: number; firstTime: number };
  consecutiveValid: number;
  lastInputTime?: number;
  lastChangedPosition?: number;
  consecutiveSamePosition: number;
}

export const checkAchievements = (
  words: any[],
  invalidCount: number,
  timeRemaining: number,
  currentMultiplier: number,
  progress: AchievementProgress
): string[] => {
  const earned: string[] = [];
  
  // Brainwave: 3 morphs within 10s
  if (progress.brainwaveStreak && progress.brainwaveStreak.count >= 3) {
    const elapsed = (Date.now() - progress.brainwaveStreak.firstTime) / 1000;
    if (elapsed <= 10) {
      earned.push('brainwave');
    }
  }
  
  // Synapse Surge: 5 morphs, no errors
  if (progress.consecutiveValid >= 5) {
    earned.push('synapse_surge');
  }
  
  // Neuron Burst: 10 morphs
  if (words.length >= 10) {
    earned.push('neuron_burst');
  }
  
  // Flawless Flow: no mistakes entire session (check at end only)
  if (words.length >= 5 && invalidCount === 0 && timeRemaining === 0) {
    earned.push('flawless_flow');
  }
  
  // Time Bender: morph with <2s remaining
  if (timeRemaining > 0 && timeRemaining < 2 && words.length > 0) {
    earned.push('time_bender');
  }
  
  // Multiplier Master: reach 2.0x
  if (currentMultiplier >= 2.0) {
    earned.push('multiplier_master');
  }
  
  // Word Wizard: 20 morphs
  if (words.length >= 20) {
    earned.push('word_wizard');
  }
  
  // Double Helix: 2 consecutive same position changes
  if (progress.consecutiveSamePosition >= 2) {
    earned.push('double_helix');
  }
  
  // Speed Demon: 5 morphs in 15 seconds
  if (words.length >= 5) {
    // Check if last 5 words were within 15 seconds
    const lastFive = words.slice(-5);
    if (lastFive.length === 5) {
      const timeSpan = (lastFive[4].timestamp.getTime() - lastFive[0].timestamp.getTime()) / 1000;
      if (timeSpan <= 15) {
        earned.push('speed_demon');
      }
    }
  }
  
  // Hyperfocus: 10-second streak without typing pause (handled separately in game logic)
  
  return earned;
};

export const saveUnlockedAchievements = (achievementIds: string[]) => {
  const existing = getUnlockedAchievements();
  const combined = new Set([...existing, ...achievementIds]);
  localStorage.setItem('rush_achievements', JSON.stringify([...combined]));
};

export const getUnlockedAchievements = (): string[] => {
  const stored = localStorage.getItem('rush_achievements');
  return stored ? JSON.parse(stored) : [];
};

export const getNewAchievements = (
  currentSession: string[],
  allUnlocked: string[]
): string[] => {
  return currentSession.filter(id => !allUnlocked.includes(id));
};
