// Daily progress tracking across all game modes
import { loadGameState } from './storage';
import { loadGridGameState } from './gridStorage';
import { getEasternDateString } from './dateUtils';

export interface DailyProgress {
  chain4L: boolean;
  chain5L: boolean;
  grid: boolean;
}

/**
 * Get today's date string in Eastern timezone (matches game date logic)
 */
function getTodayDate(): string {
  return getEasternDateString();
}

/**
 * Check if Chain game is completed for today
 */
function isChainCompleted(wordLength: 4 | 5): boolean {
  const state = loadGameState(wordLength);
  if (!state) return false;
  
  const today = getTodayDate();
  return state.date === today && state.completed && state.won;
}

/**
 * Check if Grid game is completed for today
 */
function isGridCompleted(): boolean {
  const today = getTodayDate();
  const state = loadGridGameState(today);
  if (!state) return false;
  
  return state.isEnded === true && state.isWin === true;
}

/**
 * Check if Rush game is completed for today
 */
function isRushCompleted(): boolean {
  const completion = loadTodayCompletion();
  return completion !== null;
}

/**
 * Check if Alibi game is completed for today
 */
function isAlibiCompleted(): boolean {
  const today = getTodayDate();
  const puzzleId = `alibi_${today}`;
  const state = loadAlibiGameState(puzzleId);
  
  if (!state) return false;
  return state.isComplete === true && state.isSolved === true;
}

/**
 * Check if Measured game is completed for today
 */
function isMeasuredCompleted(): boolean {
  return isMeasuredCompletedToday();
}

/**
 * Get the completion status for all games today
 */
export function checkDailyProgress(): DailyProgress {
  return {
    chain4L: isChainCompleted(4),
    chain5L: isChainCompleted(5),
    grid: isGridCompleted(),
    rush: isRushCompleted(),
    alibi: isAlibiCompleted(),
    measured: isMeasuredCompleted(),
  };
}

/**
 * Get the count of completed games today
 */
export function getCompletionCount(progress?: DailyProgress): number {
  const p = progress || checkDailyProgress();
  return [p.chain4L, p.chain5L, p.grid, p.rush, p.alibi, p.measured].filter(Boolean).length;
}

/**
 * Get total number of trackable games
 */
export function getTotalGames(): number {
  return 6;
}
