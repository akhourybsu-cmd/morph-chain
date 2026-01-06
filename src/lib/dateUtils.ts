// Unified date utilities for consistent timezone handling across all games
// All games use Eastern timezone for daily puzzle rotation

const EASTERN_TZ = 'America/New_York';

/**
 * Get today's date string in YYYY-MM-DD format (Eastern timezone)
 */
export function getEasternDateString(): string {
  const now = new Date();
  const year = now.toLocaleString('en-US', { timeZone: EASTERN_TZ, year: 'numeric' });
  const month = now.toLocaleString('en-US', { timeZone: EASTERN_TZ, month: '2-digit' });
  const day = now.toLocaleString('en-US', { timeZone: EASTERN_TZ, day: '2-digit' });
  return `${year}-${month}-${day}`;
}

/**
 * Get yesterday's date string from a given date string
 */
export function getYesterday(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00'); // Use noon to avoid DST issues
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

/**
 * Check if two dates are consecutive days (date2 is the day after date1)
 */
export function isConsecutiveDay(lastDate: string | null, currentDate: string): boolean {
  if (!lastDate) return false;
  const expected = getYesterday(currentDate);
  return lastDate === expected;
}

/**
 * Check if a date is today (in Eastern timezone)
 */
export function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return dateStr === getEasternDateString();
}

/**
 * Calculate streak based on last played date
 * Returns: { newStreak, maxStreak }
 */
export function calculateStreak(
  lastPlayedDate: string | null,
  currentStreak: number,
  maxStreak: number,
  todayDate: string
): { newStreak: number; maxStreak: number } {
  // Already played today - no change
  if (lastPlayedDate === todayDate) {
    return { newStreak: currentStreak, maxStreak };
  }
  
  // Consecutive day - increment streak
  if (isConsecutiveDay(lastPlayedDate, todayDate)) {
    const newStreak = currentStreak + 1;
    return { newStreak, maxStreak: Math.max(maxStreak, newStreak) };
  }
  
  // Not consecutive - reset to 1
  return { newStreak: 1, maxStreak: Math.max(maxStreak, 1) };
}

/**
 * Format milliseconds to MM:SS string
 */
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
