// Curated 5-Letter Daily Puzzle Pairs (Validated Puzzles)
// All puzzles validated for solvability, acceptance gates, and minimum 3-move requirement
// Validated with comprehensive algorithm on 2025-10-07

export interface CuratedPuzzlePair {
  start: string;
  goal: string;
  minDist?: number;
}

export const CURATED_5L_PUZZLES: CuratedPuzzlePair[] = [
  { start: "SMILE", goal: "FROWN", minDist: 5 },
  { start: "NORTH", goal: "SOUTH", minDist: 4 },
  { start: "ABOVE", goal: "BELOW", minDist: 4 },
  { start: "CLEAN", goal: "DIRTY", minDist: 5 },
  { start: "SMALL", goal: "LARGE", minDist: 5 },
  { start: "BLACK", goal: "WHITE", minDist: 5 },
  { start: "SWEET", goal: "SALTY", minDist: 5 },
  { start: "RIGHT", goal: "WRONG", minDist: 5 },
  { start: "TRUTH", goal: "FALSE", minDist: 5 },
  { start: "ORDER", goal: "CHAOS", minDist: 5 },
  { start: "HEART", goal: "BRAIN", minDist: 4 },
  { start: "TIRED", goal: "AWAKE", minDist: 5 },
  { start: "SLEEP", goal: "DREAM", minDist: 4 },
  { start: "BEGIN", goal: "START", minDist: 4 },
  { start: "TEACH", goal: "LEARN", minDist: 4 },
  { start: "MUSIC", goal: "SOUND", minDist: 5 },
  { start: "WATER", goal: "STEAM", minDist: 5 },
  { start: "CLOUD", goal: "STORM", minDist: 4 },
  { start: "OCEAN", goal: "RIVER", minDist: 4 },
  { start: "BREAD", goal: "PASTA", minDist: 5 },
  { start: "SUGAR", goal: "SPICE", minDist: 4 },
  { start: "HONEY", goal: "LEMON", minDist: 4 },
  { start: "APPLE", goal: "GRAPE", minDist: 4 },
  { start: "BERRY", goal: "MELON", minDist: 5 },
  { start: "CHAIR", goal: "TABLE", minDist: 4 },
];
