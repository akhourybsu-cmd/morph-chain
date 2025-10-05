interface LengthStats {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
  distribution: number[]; // index = moves-1
}

interface GameStats {
  overall: {
    played: number;
    won: number;
    currentStreak: number;
    maxStreak: number;
    distribution: number[];
    hardModeStreak: number;
  };
  byLength: {
    4: LengthStats;
    5: LengthStats;
    6: LengthStats;
  };
  lastPlayedDate?: string;
}

interface GameSettings {
  hardMode: boolean;
  colorblindMode: boolean;
  vibration: boolean;
}

interface GameState {
  date: string;
  wordLength: number;
  moves: Array<{
    from: string;
    to: string;
    timestamp: string;
  }>;
  completed: boolean;
  won: boolean;
}

const STATS_KEY = "morphchain_stats";
const SETTINGS_KEY = "morphchain_settings";
const STATE_KEY = "morphchain_state";

const createEmptyLengthStats = (): LengthStats => ({
  played: 0,
  won: 0,
  currentStreak: 0,
  maxStreak: 0,
  distribution: Array(12).fill(0),
});

export const loadStats = (): GameStats => {
  try {
    const stored = localStorage.getItem(STATS_KEY);
    if (!stored) {
      return {
        overall: {
          played: 0,
          won: 0,
          currentStreak: 0,
          maxStreak: 0,
          distribution: Array(12).fill(0),
          hardModeStreak: 0,
        },
        byLength: {
          4: createEmptyLengthStats(),
          5: createEmptyLengthStats(),
          6: createEmptyLengthStats(),
        },
      };
    }
    const parsed = JSON.parse(stored);
    // Migrate old stats format to new format
    if (!parsed.byLength) {
      return {
        overall: {
          played: parsed.played || 0,
          won: parsed.won || 0,
          currentStreak: parsed.currentStreak || 0,
          maxStreak: parsed.maxStreak || 0,
          distribution: parsed.distribution || Array(12).fill(0),
          hardModeStreak: parsed.hardModeStreak || 0,
        },
        byLength: {
          4: createEmptyLengthStats(),
          5: createEmptyLengthStats(),
          6: createEmptyLengthStats(),
        },
        lastPlayedDate: parsed.lastPlayedDate,
      };
    }
    return parsed;
  } catch {
    return {
      overall: {
        played: 0,
        won: 0,
        currentStreak: 0,
        maxStreak: 0,
        distribution: Array(12).fill(0),
        hardModeStreak: 0,
      },
      byLength: {
        4: createEmptyLengthStats(),
        5: createEmptyLengthStats(),
        6: createEmptyLengthStats(),
      },
    };
  }
};

export const saveStats = (stats: GameStats): void => {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error("Failed to save stats:", error);
  }
};

export const loadSettings = (): GameSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) {
      return {
        hardMode: false,
        colorblindMode: false,
        vibration: true,
      };
    }
    return JSON.parse(stored);
  } catch {
    return {
      hardMode: false,
      colorblindMode: false,
      vibration: true,
    };
  }
};

export const saveSettings = (settings: GameSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
};

export const loadGameState = (wordLength: number): GameState | null => {
  try {
    const key = `${STATE_KEY}_${wordLength}`;
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const saveGameState = (state: GameState): void => {
  try {
    const key = `${STATE_KEY}_${state.wordLength}`;
    localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save game state:", error);
  }
};

export const clearGameState = (wordLength: number): void => {
  try {
    const key = `${STATE_KEY}_${wordLength}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Failed to clear game state:", error);
  }
};

export const resetAllData = (): void => {
  try {
    localStorage.removeItem(STATS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(`${STATE_KEY}_4`);
    localStorage.removeItem(`${STATE_KEY}_5`);
    localStorage.removeItem(`${STATE_KEY}_6`);
    // Also clear disputes
    localStorage.removeItem("morphchain_word_disputes");
  } catch (error) {
    console.error("Failed to reset data:", error);
  }
};
