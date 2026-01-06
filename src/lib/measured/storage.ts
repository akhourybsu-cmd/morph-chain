// MEASURED - Local Storage
// Stores user preferences only - attempts are stored in Supabase

const STORAGE_PREFIX = 'measured_';

export interface MeasuredSettings {
  reduceMotion: boolean;
  hapticFeedback: boolean;
}

const DEFAULT_SETTINGS: MeasuredSettings = {
  reduceMotion: false,
  hapticFeedback: true,
};

/**
 * Load settings from local storage
 */
export function loadSettings(): MeasuredSettings {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}settings`);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn('Failed to load measured settings:', e);
  }
  return DEFAULT_SETTINGS;
}

/**
 * Save settings to local storage
 */
export function saveSettings(settings: Partial<MeasuredSettings>): void {
  try {
    const current = loadSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save measured settings:', e);
  }
}

/**
 * Get today's date string in YYYY-MM-DD format (Eastern timezone)
 */
export function getTodayDateString(): string {
  const now = new Date();
  const eastern = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  return eastern.toISOString().split('T')[0];
}
