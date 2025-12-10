// Achievement system for Morph Rush (simplified tap-to-place gameplay)
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
    description: 'Last-second successful morph (<5s remaining)',
    icon: '⏳',
    flavorText: 'You bent the clock.',
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
  quick_fingers: {
    id: 'quick_fingers',
    title: 'Quick Fingers',
    description: '3 consecutive morphs under 3 seconds each',
    icon: '👆',
    flavorText: 'Tap tap tap!',
  },
  perfect_run: {
    id: 'perfect_run',
    title: 'Perfect Run',
    description: 'Score 2000+ points in a single run',
    icon: '🏆',
    flavorText: 'Outstanding performance!',
  },
  word_streak: {
    id: 'word_streak',
    title: 'Word Streak',
    description: 'Chain 15 valid morphs without an error',
    icon: '🔗',
    flavorText: 'Unstoppable chain!',
  },
  first_morph: {
    id: 'first_morph',
    title: 'First Morph',
    description: 'Complete your first morph',
    icon: '🎯',
    flavorText: 'Welcome to Rush!',
  },
  century: {
    id: 'century',
    title: 'Century',
    description: 'Score 100+ points in a single run',
    icon: '💯',
    flavorText: 'Triple digits!',
  },
};

export interface AchievementProgress {
  brainwaveStreak: { count: number; firstTime: number } | null;
  consecutiveValid: number;
  lastMorphTime: number | null;
  quickFingerCount: number;
}

export const getInitialProgress = (): AchievementProgress => ({
  brainwaveStreak: null,
  consecutiveValid: 0,
  lastMorphTime: null,
  quickFingerCount: 0,
});

export const checkAchievements = (
  words: { word: string; timestamp: Date }[],
  invalidCount: number,
  timeRemaining: number,
  score: number,
  progress: AchievementProgress
): string[] => {
  const earned: string[] = [];
  
  // First Morph - complete any morph
  if (words.length >= 1) {
    earned.push('first_morph');
  }
  
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
  
  // Time Bender: morph with <5s remaining
  if (timeRemaining > 0 && timeRemaining < 5 && words.length > 0) {
    earned.push('time_bender');
  }
  
  // Word Wizard: 20 morphs
  if (words.length >= 20) {
    earned.push('word_wizard');
  }
  
  // Speed Demon: 5 morphs in 15 seconds
  if (words.length >= 5) {
    const lastFive = words.slice(-5);
    if (lastFive.length === 5) {
      const timeSpan = (lastFive[4].timestamp.getTime() - lastFive[0].timestamp.getTime()) / 1000;
      if (timeSpan <= 15) {
        earned.push('speed_demon');
      }
    }
  }
  
  // Quick Fingers: 3 consecutive morphs under 3 seconds each
  if (progress.quickFingerCount >= 3) {
    earned.push('quick_fingers');
  }
  
  // Perfect Run: 2000+ points
  if (score >= 2000) {
    earned.push('perfect_run');
  }
  
  // Word Streak: 15 valid morphs without error
  if (progress.consecutiveValid >= 15) {
    earned.push('word_streak');
  }
  
  // Century: 100+ points
  if (score >= 100) {
    earned.push('century');
  }
  
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

// Helper to get rush achievements for gallery
export const getRushAchievements = getUnlockedAchievements;
