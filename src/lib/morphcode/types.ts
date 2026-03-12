// Morphcode Game Types

export type Symbol = 'circle' | 'triangle' | 'wave' | 'flame' | 'eye' | 'shard';

export const ALL_SYMBOLS: Symbol[] = ['circle', 'triangle', 'wave', 'flame', 'eye', 'shard'];

export const SYMBOL_DISPLAY: Record<Symbol, { emoji: string; label: string; color: string }> = {
  circle:   { emoji: '●', label: 'Circle',   color: 'hsl(210, 80%, 60%)' },
  triangle: { emoji: '▲', label: 'Triangle', color: 'hsl(45, 90%, 55%)' },
  wave:     { emoji: '∿', label: 'Wave',     color: 'hsl(180, 70%, 50%)' },
  flame:    { emoji: '✦', label: 'Flame',    color: 'hsl(15, 90%, 55%)' },
  eye:      { emoji: '◉', label: 'Eye',      color: 'hsl(270, 60%, 60%)' },
  shard:    { emoji: '◆', label: 'Shard',    color: 'hsl(330, 70%, 55%)' },
};

export const SLOTS = 4;
export const MAX_GUESSES = 8;
export const TURN_TIME_LIVE = 90; // seconds
export const ROUNDS_TO_WIN = 2;

export type MatchStatus = 'waiting' | 'setup' | 'active' | 'completed' | 'forfeited' | 'expired';
export type RoundStatus = 'setup' | 'active' | 'completed';

export interface GuessFeedback {
  exact: number;
  shifted: number;
}

export interface GuessEntry {
  id: string;
  guess: Symbol[];
  exact: number;
  shifted: number;
  isSolve: boolean;
  timeTakenMs: number;
}

export interface RoundState {
  id: string;
  matchId: string;
  roundNumber: number;
  status: RoundStatus;
  firstGuesser: string;
  currentTurn: string | null;
  mySequence: Symbol[] | null;
  mySequenceLocked: boolean;
  opponentSequenceLocked: boolean;
  myGuesses: GuessEntry[];
  opponentGuesses: GuessEntry[];
  myGuessCount: number;
  opponentGuessCount: number;
  mySolved: boolean;
  opponentSolved: boolean;
  winnerId: string | null;
  symbolPool: Symbol[];
  turnStartedAt: string | null;
}

export interface MatchState {
  id: string;
  playerA: string;
  playerB: string | null;
  status: MatchStatus;
  winnerId: string | null;
  roundWinsA: number;
  roundWinsB: number;
  currentRound: number;
  inviteCode: string | null;
  timerMode: 'live' | 'async';
  turnTimeSeconds: number;
}

export type GamePhase = 'lobby' | 'waiting' | 'versus' | 'setup' | 'playing' | 'round-end' | 'match-end';

// --- XP & Progression ---

export const XP_PER_LEVEL = 200;
export const XP_WIN = 100;
export const XP_LOSS = 25;
export const XP_SOLVE = 50;

export function getXPForLevel(level: number): number {
  return (level - 1) * XP_PER_LEVEL;
}

export function getLevelFromXP(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function getStreakMultiplier(streak: number): number {
  if (streak >= 5) return 3;
  if (streak >= 3) return 2;
  return 1;
}

// --- Rank Titles ---

const RANK_TIERS = [
  { threshold: 50, title: 'Grandmaster' },
  { threshold: 30, title: 'Cryptographer' },
  { threshold: 15, title: 'Cipher' },
  { threshold: 5, title: 'Decoder' },
  { threshold: 0, title: 'Novice' },
] as const;

export function getRankTitle(wins: number): string {
  for (const tier of RANK_TIERS) {
    if (wins >= tier.threshold) return tier.title;
  }
  return 'Novice';
}
