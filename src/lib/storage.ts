export interface LengthStats {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
  distribution: number[]; // index = moves-1
}

export interface GameStats {
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
  };
  lastPlayedDate?: string;
}

export interface GameSettings {
  hardMode: boolean;
  colorblindMode: boolean;
  vibration: boolean;
  backgroundTheme?: string;
  useOnScreenKeyboard?: boolean;
}

interface GameState {
  schemaVersion?: number;
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

// Schema version - increment when game rules change
export const SCHEMA_VERSION = 2; // v2: Core spec - 4L and 5L only, one-letter changes only

// Game version - increment this to force reset for all users
export const GAME_VERSION = "3.0.0"; // Core spec alignment - removed combo/power-ups, 6L

const STATS_KEY = "morphchain_stats";
const SETTINGS_KEY = "morphchain_settings";
const STATE_KEY = "morphchain_state";
const VERSION_KEY = "morphchain_version";

// Check version and auto-reset if game was updated
const checkVersionAndReset = () => {
  const storedVersion = localStorage.getItem(VERSION_KEY);
  
  if (storedVersion !== GAME_VERSION) {
    console.log(`Game updated from ${storedVersion || 'unknown'} to ${GAME_VERSION}. Resetting data...`);
    resetAllData();
    localStorage.setItem(VERSION_KEY, GAME_VERSION);
  }
};

const createEmptyLengthStats = (): LengthStats => ({
  played: 0,
  won: 0,
  currentStreak: 0,
  maxStreak: 0,
  distribution: Array(12).fill(0),
});

export const loadStats = (): GameStats => {
  checkVersionAndReset();
  
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
        },
        lastPlayedDate: parsed.lastPlayedDate,
      };
    }
    // Remove 6L if present from old data
    if (parsed.byLength && parsed.byLength[6]) {
      delete parsed.byLength[6];
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
        backgroundTheme: "midnight",
        useOnScreenKeyboard: false,
      };
    }
    const parsed = JSON.parse(stored);
    return {
      ...parsed,
      backgroundTheme: parsed.backgroundTheme || "midnight",
      useOnScreenKeyboard: parsed.useOnScreenKeyboard ?? false,
    };
  } catch {
    return {
      hardMode: false,
      colorblindMode: false,
      vibration: true,
      backgroundTheme: "midnight",
      useOnScreenKeyboard: false,
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
  checkVersionAndReset();
  
  try {
    const key = `${STATE_KEY}_${wordLength}`;
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    
    // Drop incompatible schemas
    if (!parsed.schemaVersion || parsed.schemaVersion < SCHEMA_VERSION) {
      console.log(`Dropping incompatible saved game (schema v${parsed.schemaVersion || 0} < v${SCHEMA_VERSION})`);
      clearGameState(wordLength);
      return null;
    }
    
    return parsed;
  } catch {
    return null;
  }
};

export const saveGameState = (state: GameState): void => {
  try {
    const key = `${STATE_KEY}_${state.wordLength}`;
    const stateWithSchema = { ...state, schemaVersion: SCHEMA_VERSION };
    localStorage.setItem(key, JSON.stringify(stateWithSchema));
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
    localStorage.removeItem(`${STATE_KEY}_6`); // Clean up old 6L data
    localStorage.removeItem("morphchain_word_disputes");
    localStorage.setItem(VERSION_KEY, GAME_VERSION);
    console.log(`All game data reset to version ${GAME_VERSION}`);
  } catch (error) {
    console.error("Failed to reset data:", error);
  }
};
