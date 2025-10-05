interface GameStats {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
  distribution: number[]; // index = moves-1
  hardModeStreak: number;
  lastPlayedDate?: string;
}

interface GameSettings {
  hardMode: boolean;
  colorblindMode: boolean;
  vibration: boolean;
}

interface GameState {
  date: string;
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

export const loadStats = (): GameStats => {
  try {
    const stored = localStorage.getItem(STATS_KEY);
    if (!stored) {
      return {
        played: 0,
        won: 0,
        currentStreak: 0,
        maxStreak: 0,
        distribution: Array(12).fill(0),
        hardModeStreak: 0,
      };
    }
    return JSON.parse(stored);
  } catch {
    return {
      played: 0,
      won: 0,
      currentStreak: 0,
      maxStreak: 0,
      distribution: Array(12).fill(0),
      hardModeStreak: 0,
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

export const loadGameState = (): GameState | null => {
  try {
    const stored = localStorage.getItem(STATE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

export const saveGameState = (state: GameState): void => {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save game state:", error);
  }
};

export const clearGameState = (): void => {
  try {
    localStorage.removeItem(STATE_KEY);
  } catch (error) {
    console.error("Failed to clear game state:", error);
  }
};

export const resetAllData = (): void => {
  try {
    localStorage.removeItem(STATS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(STATE_KEY);
  } catch (error) {
    console.error("Failed to reset data:", error);
  }
};
