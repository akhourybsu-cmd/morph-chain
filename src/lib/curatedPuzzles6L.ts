// Curated 6-Letter Daily Puzzle Pairs (Validated Puzzles)
// All puzzles validated for solvability, acceptance gates, and minimum 3-move requirement
// Validated with comprehensive algorithm on 2025-10-07

export interface CuratedPuzzlePair {
  start: string;
  goal: string;
  minDist?: number;
}

export const CURATED_6L_PUZZLES: CuratedPuzzlePair[] = [
  { start: "GARDEN", goal: "DESERT", minDist: 6 },
  { start: "SPRING", goal: "WINTER", minDist: 6 },
  { start: "SILENT", goal: "LOUDER", minDist: 6 },
  { start: "BRIGHT", goal: "DIMMER", minDist: 6 },
  { start: "LITTLE", goal: "LARGER", minDist: 5 },
  { start: "SIMPLE", goal: "PUZZLE", minDist: 6 },
  { start: "FOREST", goal: "JUNGLE", minDist: 6 },
  { start: "ORANGE", goal: "PURPLE", minDist: 6 },
  { start: "STREAM", goal: "STREET", minDist: 3 },
  { start: "FLOWER", goal: "TOMATO", minDist: 6 },
  { start: "SCHOOL", goal: "CAMPUS", minDist: 6 },
  { start: "PEOPLE", goal: "ANIMAL", minDist: 6 },
  { start: "PLANET", goal: "GALAXY", minDist: 6 },
  { start: "FAMILY", goal: "FRIEND", minDist: 5 },
  { start: "SISTER", goal: "COUSIN", minDist: 6 },
  { start: "FUTURE", goal: "MODERN", minDist: 6 },
  { start: "RANDOM", goal: "METHOD", minDist: 6 },
  { start: "REASON", goal: "RESULT", minDist: 5 },
  { start: "ROCKET", goal: "ENGINE", minDist: 6 },
  { start: "SILVER", goal: "GOLDEN", minDist: 5 },
  { start: "TARGET", goal: "OBJECT", minDist: 6 },
  { start: "WINDOW", goal: "SCREEN", minDist: 6 },
  { start: "SECRET", goal: "OPENED", minDist: 6 },
  { start: "NUMBER", goal: "FIGURE", minDist: 6 },
  { start: "RECORD", goal: "REPORT", minDist: 4 },
];
