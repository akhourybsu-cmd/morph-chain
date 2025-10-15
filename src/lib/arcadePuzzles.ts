import { formatInTimeZone } from 'date-fns-tz';

// Collection of 5-letter word pairs for Morph Mystery
const MYSTERY_PUZZLES = [
  { start: "CRANE", goal: "PLANT", minDist: 5 },
  { start: "FLAME", goal: "TRUST", minDist: 5 },
  { start: "BEACH", goal: "STORM", minDist: 5 },
  { start: "CLIMB", goal: "FROST", minDist: 5 },
  { start: "SHINE", goal: "BLANK", minDist: 5 },
  { start: "TRACK", goal: "PROOF", minDist: 5 },
  { start: "GREAT", goal: "SMALL", minDist: 5 },
  { start: "LIGHT", goal: "SHADE", minDist: 5 },
  { start: "FRESH", goal: "STALE", minDist: 5 },
  { start: "BRAVE", goal: "TIMID", minDist: 5 },
  { start: "SHARP", goal: "BLUNT", minDist: 5 },
  { start: "CLEAN", goal: "DIRTY", minDist: 5 },
  { start: "MAJOR", goal: "MINOR", minDist: 5 },
  { start: "OUTER", goal: "INNER", minDist: 5 },
  { start: "UPPER", goal: "LOWER", minDist: 5 },
  { start: "FIRST", goal: "FINAL", minDist: 5 },
  { start: "EARLY", goal: "LATER", minDist: 5 },
  { start: "SOLID", goal: "FLUID", minDist: 5 },
  { start: "QUIET", goal: "NOISY", minDist: 5 },
  { start: "SIMPLE", goal: "COMPLEX", minDist: 6 },
];

export interface ArcadePuzzle {
  dateISO: string;
  puzzleNumber: number;
  startWord: string;
  goalWord: string;
  minDistance: number;
}

const EPOCH_DATE = new Date('2025-01-01'); // Starting date for puzzle rotation

export function getDailyArcadePuzzle(): ArcadePuzzle {
  const tz = 'America/New_York';
  const today = formatInTimeZone(new Date(), tz, 'yyyy-MM-dd');
  
  // Calculate days since epoch
  const todayDate = new Date(today);
  const daysSinceEpoch = Math.floor((todayDate.getTime() - EPOCH_DATE.getTime()) / (1000 * 60 * 60 * 24));
  
  // Get puzzle index (cycles through the array)
  const puzzleIndex = daysSinceEpoch % MYSTERY_PUZZLES.length;
  const puzzle = MYSTERY_PUZZLES[puzzleIndex];
  
  return {
    dateISO: today,
    puzzleNumber: daysSinceEpoch + 1,
    startWord: puzzle.start,
    goalWord: puzzle.goal,
    minDistance: puzzle.minDist,
  };
}
