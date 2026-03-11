import { Symbol, GuessFeedback, SLOTS } from './types';

/**
 * Calculate feedback for a guess against a hidden sequence.
 * No duplicates allowed in standard mode, so logic is straightforward.
 */
export function calculateFeedback(guess: Symbol[], sequence: Symbol[]): GuessFeedback {
  let exact = 0;
  const unmatchedGuess: (Symbol | null)[] = [...guess];
  const unmatchedSeq: (Symbol | null)[] = [...sequence];

  // Pass 1: find exact matches
  for (let i = 0; i < SLOTS; i++) {
    if (guess[i] === sequence[i]) {
      exact++;
      unmatchedGuess[i] = null;
      unmatchedSeq[i] = null;
    }
  }

  // Pass 2: find shifted matches
  let shifted = 0;
  for (let i = 0; i < SLOTS; i++) {
    if (unmatchedGuess[i] === null) continue;
    const idx = unmatchedSeq.indexOf(unmatchedGuess[i]);
    if (idx !== -1) {
      shifted++;
      unmatchedSeq[idx] = null;
    }
  }

  return { exact, shifted };
}

/**
 * Validate a sequence or guess:
 * - exactly 4 symbols
 * - all from the pool
 * - no duplicates
 */
export function validateSequence(symbols: Symbol[], pool: Symbol[]): { valid: boolean; error?: string } {
  if (symbols.length !== SLOTS) {
    return { valid: false, error: `Must have exactly ${SLOTS} symbols` };
  }
  
  const seen = new Set<Symbol>();
  for (const s of symbols) {
    if (!pool.includes(s)) {
      return { valid: false, error: `Symbol "${s}" is not in the pool` };
    }
    if (seen.has(s)) {
      return { valid: false, error: `Duplicate symbol "${s}"` };
    }
    seen.add(s);
  }
  
  return { valid: true };
}

/**
 * Generate a random 6-character invite code
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Determine round winner after both players have equal turns
 */
export function determineRoundWinner(
  solvedA: boolean,
  solvedB: boolean,
  guessesA: number,
  guessesB: number,
  timeA: number,
  timeB: number
): 'a' | 'b' | 'draw' {
  // Both solved
  if (solvedA && solvedB) {
    if (guessesA < guessesB) return 'a';
    if (guessesB < guessesA) return 'b';
    // Same guesses - tiebreak by time
    if (timeA < timeB) return 'a';
    if (timeB < timeA) return 'b';
    return 'draw';
  }
  
  // Only one solved
  if (solvedA) return 'a';
  if (solvedB) return 'b';
  
  // Neither solved - compare best progress (handled at a higher level)
  return 'draw';
}
