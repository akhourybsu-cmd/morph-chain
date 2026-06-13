import { TileState } from "@/components/HintTile";
import { CURATED_4L_WORDS, CURATED_5L_WORDS } from "./curatedDictionary";
import { getExpanded4LDictionary } from "./chainDictionary4L";
import { getExpanded5LDictionary } from "./chainDictionary5L";
import { isPuzzleSolvable, calculateMinDistance } from "./puzzleValidator";
import { CURATED_4L_PUZZLES } from "./curatedPuzzles4L";
import { CURATED_5L_PUZZLES } from "./curatedPuzzles5L";
import { markPuzzleAsUsed, getCurrentPuzzleIndex } from "./puzzleTracking";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";
import { startOfDay, differenceInDays } from "date-fns";
import { loadDailyPuzzle, VaultPuzzle } from "./puzzleVaultLoader";

// Both use expanded wordlists for move validation
// but curated words are used for puzzle generation (start/goal)
const cachedWords4 = getExpanded4LDictionary();
const cachedWords5 = getExpanded5LDictionary();

// Curated words are used for puzzle generation only
export const CURATED_WORDS_4 = CURATED_4L_WORDS;
export const CURATED_WORDS_5 = CURATED_5L_WORDS;

console.log(`Using dictionaries: 4L=${cachedWords4.size} (expanded), 5L=${cachedWords5.size} (expanded)`);

// Export word sets for validation
export const VALID_WORDS_4 = cachedWords4;
export const VALID_WORDS_5 = cachedWords5;

export interface Puzzle {
  date: string;
  startWord: string;
  goalWord: string;
  wordLength: number;
  maxMoves: number;
  minDistance: number;
  puzzleIndex?: number;
}

// Cache for async-loaded puzzles
const puzzlePromiseCache = new Map<string, Promise<Puzzle & { puzzleIndex: number }>>();

// Async version - loads from vault with curated fallback
export const getDailyPuzzleAsync = async (wordLength: 4 | 5 = 4): Promise<Puzzle & { puzzleIndex: number }> => {
  const timezone = "America/New_York";
  const nowNY = toZonedTime(new Date(), timezone);
  const today = formatInTimeZone(nowNY, timezone, "yyyy-MM-dd");
  const cacheKey = `${wordLength}-${today}`;
  
  // Check cache
  if (puzzlePromiseCache.has(cacheKey)) {
    return puzzlePromiseCache.get(cacheKey)!;
  }
  
  const promise = (async () => {
    try {
      // Try to load from vault
      const vaultPuzzle = await loadDailyPuzzle(wordLength, nowNY);
      
      // Move cap formula: clamp(minDistance + 4, 10..14)
      const moveBonus = 4;
      const maxMoves = Math.min(14, Math.max(10, vaultPuzzle.minDistance + moveBonus));
      
      // Mark as used for tracking
      markPuzzleAsUsed(
        vaultPuzzle.startWord, 
        vaultPuzzle.goalWord, 
        vaultPuzzle.puzzleIndex - 1, 
        today, 
        wordLength
      );
      
      return {
        date: today,
        startWord: vaultPuzzle.startWord,
        goalWord: vaultPuzzle.goalWord,
        wordLength,
        maxMoves,
        minDistance: vaultPuzzle.minDistance,
        puzzleIndex: vaultPuzzle.puzzleIndex - 1, // 0-indexed internally
      };
    } catch (err) {
      console.warn('Failed to load from vault, using curated fallback:', err);
      // Fall back to sync version
      return getDailyPuzzle(wordLength);
    }
  })();
  
  puzzlePromiseCache.set(cacheKey, promise);
  return promise;
};

// Sync version - uses curated puzzles only (for backward compatibility)
export const getDailyPuzzle = (wordLength: 4 | 5 = 4): Puzzle & { puzzleIndex: number } => {
  const timezone = "America/New_York";
  
  // Get current date in NY timezone
  const nowNY = toZonedTime(new Date(), timezone);
  const todayNY = startOfDay(nowNY);
  const today = formatInTimeZone(nowNY, timezone, "yyyy-MM-dd");
  
  // Get appropriate word set
  const wordSet = wordLength === 4 ? VALID_WORDS_4 : VALID_WORDS_5;
  
  // Use curated pairs with tracking for supported word lengths only
  const curatedPuzzles = wordLength === 4 ? CURATED_4L_PUZZLES : CURATED_5L_PUZZLES;
  
  // Launch date: October 6, 2025 (NY time) is Puzzle #1
  const launchDateNY = startOfDay(toZonedTime(new Date('2025-10-06T00:00:00'), timezone));
  const daysSinceStart = differenceInDays(todayNY, launchDateNY);
  const puzzleIndex = daysSinceStart % curatedPuzzles.length;
  const candidatePuzzle = curatedPuzzles[puzzleIndex];
  
  // Use pre-calculated minDist (fallback to runtime calculation if missing)
  const minDist = candidatePuzzle.minDist || 
    calculateMinDistance(candidatePuzzle.start, candidatePuzzle.goal, wordSet) || 
    (wordLength === 4 ? 4 : 5);
  
  // Mark this puzzle as used
  markPuzzleAsUsed(candidatePuzzle.start, candidatePuzzle.goal, puzzleIndex, today, wordLength);
  
  // Move cap formula: clamp(minDistance + 4, 10..14)
  const moveBonus = 4;
  const maxMoves = Math.min(14, Math.max(10, minDist + moveBonus));
  
  return {
    date: today,
    startWord: candidatePuzzle.start,
    goalWord: candidatePuzzle.goal,
    wordLength,
    maxMoves,
    minDistance: minDist,
    puzzleIndex,
  };
};

// Returns a random curated puzzle that isn't today's daily (by index).
// Safe to call multiple times — each call picks a fresh random index.
export const getPracticePuzzle = (
  wordLength: 4 | 5,
  excludeIndex?: number
): Puzzle & { puzzleIndex: number } => {
  const curatedPuzzles = wordLength === 4 ? CURATED_4L_PUZZLES : CURATED_5L_PUZZLES;
  const wordSet = wordLength === 4 ? VALID_WORDS_4 : VALID_WORDS_5;

  let idx: number;
  let attempts = 0;
  do {
    idx = Math.floor(Math.random() * curatedPuzzles.length);
    attempts++;
  } while (idx === excludeIndex && attempts < 20);

  const p = curatedPuzzles[idx];
  const minDist =
    p.minDist ||
    calculateMinDistance(p.start, p.goal, wordSet) ||
    (wordLength === 4 ? 4 : 5);
  const moveBonus = 4;
  const maxMoves = Math.min(14, Math.max(10, minDist + moveBonus));

  const timezone = "America/New_York";
  const nowNY = toZonedTime(new Date(), timezone);
  const today = formatInTimeZone(nowNY, timezone, "yyyy-MM-dd");

  return {
    date: today,
    startWord: p.start,
    goalWord: p.goal,
    wordLength,
    maxMoves,
    minDistance: minDist,
    puzzleIndex: idx,
  };
};

export const isValidWord = (word: string, wordLength: number = 4): boolean => {
  const upperWord = word.toUpperCase();
  if (wordLength === 4) return VALID_WORDS_4.has(upperWord);
  if (wordLength === 5) return VALID_WORDS_5.has(upperWord);
  return false;
};

export const isOneLetterDifferent = (word1: string, word2: string): boolean => {
  if (word1.length !== word2.length) return false;
  
  let differences = 0;
  for (let i = 0; i < word1.length; i++) {
    if (word1[i] !== word2[i]) differences++;
  }
  
  return differences === 1;
};

export const isTwoLettersDifferent = (word1: string, word2: string): boolean => {
  if (word1.length !== word2.length) return false;
  
  let differences = 0;
  for (let i = 0; i < word1.length; i++) {
    if (word1[i] !== word2[i]) differences++;
  }
  
  return differences === 2;
};

/**
 * Wordle-style per-letter hints with correct multi-letter handling.
 *
 * Two-pass algorithm:
 *  Pass 1 — mark exact matches ("match"), count remaining unmatched goal letters.
 *  Pass 2 — for non-matched positions, mark "present" only while unused goal
 *            copies remain; extras get "miss".
 *
 * Fixes the double-letter bug where e.g. goal=KEEP, attempt=KEEK would
 * incorrectly mark the trailing K as "present" (the K is already matched at [0]).
 */
export const getHints = (attempt: string, goal: string): TileState[] => {
  const hints = new Array<TileState>(attempt.length).fill("miss");
  const unusedGoalLetters = new Map<string, number>();

  // Pass 1: exact matches
  for (let i = 0; i < attempt.length; i++) {
    if (attempt[i] === goal[i]) {
      hints[i] = "match";
    } else {
      unusedGoalLetters.set(goal[i], (unusedGoalLetters.get(goal[i]) ?? 0) + 1);
    }
  }

  // Pass 2: present (non-exact) matches, consume available goal copies
  for (let i = 0; i < attempt.length; i++) {
    if (hints[i] === "match") continue;
    const available = unusedGoalLetters.get(attempt[i]) ?? 0;
    if (available > 0) {
      hints[i] = "present";
      unusedGoalLetters.set(attempt[i], available - 1);
    }
  }

  return hints;
};

// ---------------------------------------------------------------------------
// BFS distance cache — keyed by `${wordLength}-${goalWord}`
// Stores exact graph distance (min word-ladder steps) from every reachable
// word to the goal.  Built lazily on first move, then O(1) lookups.
// ---------------------------------------------------------------------------
const bfsDistanceCache = new Map<string, Map<string, number>>();

function buildBFSDistanceMap(goal: string, wordSet: Set<string>): Map<string, number> {
  const distances = new Map<string, number>();
  distances.set(goal, 0);
  const queue: string[] = [goal];
  const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  while (queue.length > 0) {
    const word = queue.shift()!;
    const dist = distances.get(word)!;
    for (let i = 0; i < word.length; i++) {
      for (const letter of LETTERS) {
        if (letter === word[i]) continue;
        const neighbor = word.substring(0, i) + letter + word.substring(i + 1);
        if (wordSet.has(neighbor) && !distances.has(neighbor)) {
          distances.set(neighbor, dist + 1);
          queue.push(neighbor);
        }
      }
    }
  }
  return distances;
}

/**
 * Pre-warm the BFS distance cache for a puzzle's goal word.
 * Call this when a new puzzle loads so the first move is instant.
 */
export const precomputePuzzleDistances = (goal: string, wordLength: 4 | 5): void => {
  const wordSet = wordLength === 4 ? VALID_WORDS_4 : VALID_WORDS_5;
  const cacheKey = `${wordLength}-${goal}`;
  if (!bfsDistanceCache.has(cacheKey)) {
    bfsDistanceCache.set(cacheKey, buildBFSDistanceMap(goal, wordSet));
  }
};

/**
 * True word-ladder graph distance from `word` to `goal`.
 * Returns Infinity when there is no valid path (disconnected graph component).
 * Replaces the old Hamming-distance heuristic which was directionally wrong.
 */
export const calculateDistance = (word: string, goal: string): number => {
  if (word === goal) return 0;
  const wordLength = word.length as 4 | 5;
  const wordSet = wordLength === 4 ? VALID_WORDS_4 : VALID_WORDS_5;
  const cacheKey = `${wordLength}-${goal}`;

  if (!bfsDistanceCache.has(cacheKey)) {
    bfsDistanceCache.set(cacheKey, buildBFSDistanceMap(goal, wordSet));
  }

  return bfsDistanceCache.get(cacheKey)!.get(word) ?? Infinity;
};

export const hasValidNextMove = (
  word: string, 
  usedWords: Set<string>, 
  wordLength: number,
  allowTwoLetters: boolean = false
): boolean => {
  const wordSet = wordLength === 4 ? VALID_WORDS_4 : VALID_WORDS_5;
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  
  // Check one-letter changes
  for (let i = 0; i < word.length; i++) {
    for (const letter of letters) {
      if (letter === word[i]) continue;
      const newWord = word.substring(0, i) + letter + word.substring(i + 1);
      if (wordSet.has(newWord) && !usedWords.has(newWord)) {
        return true;
      }
    }
  }
  
  // Check two-letter changes if allowed (not used in Core spec)
  if (allowTwoLetters) {
    for (let i = 0; i < word.length; i++) {
      for (let j = i + 1; j < word.length; j++) {
        for (const letter1 of letters) {
          if (letter1 === word[i]) continue;
          for (const letter2 of letters) {
            if (letter2 === word[j]) continue;
            const newWord = 
              word.substring(0, i) + 
              letter1 + 
              word.substring(i + 1, j) + 
              letter2 + 
              word.substring(j + 1);
            if (wordSet.has(newWord) && !usedWords.has(newWord)) {
              return true;
            }
          }
        }
      }
    }
  }
  
  return false;
};

/** Per-move direction flags passed from the live game state into share text. */
export interface ShareMoveFlag {
  closerToGoal: boolean;
  isComplete: boolean;
  isWorse: boolean;
}

/**
 * Direction indicator for one move in the share text.
 * Prefers the stored BFS-based game flags when supplied; falls back to a
 * hint match-count heuristic so old call-sites without flags still work.
 */
const getDirectionIndicator = (
  flag: ShareMoveFlag | undefined,
  currentHints: TileState[],
  prevHints: TileState[] | null,
  isWin: boolean
): string => {
  if (isWin) return "✓";

  if (flag) {
    if (flag.isComplete) return "✓";
    if (flag.closerToGoal) return "↑";
    if (flag.isWorse) return "↓";
    return "↔";
  }

  // Fallback: hint match-count delta (used when moveFlags not provided)
  const currentMatches = currentHints.filter(h => h === "match").length;
  const prevMatches = prevHints ? prevHints.filter(h => h === "match").length : 0;
  if (currentMatches > prevMatches) return "↑";
  if (currentMatches < prevMatches) return "↓";
  return "↔";
};

export const generateShareText = (
  date: string,
  movesUsed: number,
  won: boolean,
  wordLength: number,
  moveHints: TileState[][],
  maxMoves: number,
  puzzleIndex: number,
  minDistance?: number,
  streak?: number,
  moveFlags?: ShareMoveFlag[]
): string => {
  const emojiMap: Record<TileState, string> = {
    match: "🟩",
    present: "🟧",
    miss: "⬛",
  };

  // Format date as "October 6, 2025" in NY timezone
  const timezone = "America/New_York";
  const formattedDate = formatInTimeZone(new Date(), timezone, 'MMMM d, yyyy');

  // Header line per spec
  const header = `Morph Chain #${puzzleIndex + 1} – ${formattedDate} (${wordLength}-letter)`;

  // Build per-move lines with hints and direction indicators
  const moveLines: string[] = [];

  for (let i = 0; i < moveHints.length; i++) {
    const hints = moveHints[i];
    const prevHints = i > 0 ? moveHints[i - 1] : null;
    const isWin = i === moveHints.length - 1 && won;

    const hintEmojis = hints.map(h => emojiMap[h]).join("");
    const direction = getDirectionIndicator(moveFlags?.[i], hints, prevHints, isWin);

    moveLines.push(`${hintEmojis} ${direction}`);
  }
  
  // Par calculation
  const par = minDistance !== undefined ? minDistance + 2 : null;
  const parText = par !== null ? ` (Par: ${par})` : '';
  
  // Performance badge
  let badge = '';
  if (won && minDistance !== undefined) {
    if (movesUsed === minDistance) badge = ' 💎';
    else if (movesUsed < minDistance + 2) badge = ' ⭐';
  }
  
  // Final result line
  const resultLine = won 
    ? `Solved in ${movesUsed}${parText}${badge}` 
    : `Failed - ${movesUsed}/${maxMoves} moves`;
  
  // Streak info
  const streakLine = streak && streak >= 3 ? `🔥 ${streak} day streak!` : '';
  
  const lines = [
    header,
    'START → GOAL',
    ...moveLines,
    resultLine,
    streakLine,
    'morphchaingame.com'
  ].filter(Boolean);
  
  return lines.join('\n');
};
