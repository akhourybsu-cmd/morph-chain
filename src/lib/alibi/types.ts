export interface AlibiSolution {
  personToLocation: Record<string, string>;
  personToTime: Record<string, string>;
  personToObject: Record<string, string>;
}

export type ClueType = "direct_positive" | "direct_negative" | "relational" | "conditional";

export interface AlibiClue {
  id: string;
  text: string;
  type: ClueType;
}

export type Difficulty = "easy" | "medium" | "hard";

export interface AlibiPuzzle {
  id: string;
  index: number;
  difficulty: Difficulty;
  people: string[];
  locations: string[];
  times: string[];
  objects: string[];
  solution: AlibiSolution;
  clues: AlibiClue[];
  finalQuestion: string;
  finalAnswerPerson: string;
}

export type CellState = "unknown" | "confirmed" | "ruled_out";

export interface GridState {
  rows: string[];
  cols: string[];
  cells: Record<string, Record<string, CellState>>;
}

export type GridType = "location" | "time" | "object";

export interface AlibiGameState {
  puzzle: AlibiPuzzle | null;
  grids: {
    location: GridState;
    time: GridState;
    object: GridState;
  };
  activeGrid: GridType;
  elapsedTime: number;
  consistencyChecks: number;
  isSolved: boolean;
  isComplete: boolean;
  moveHistory: Array<{
    grid: GridType;
    row: string;
    col: string;
    prevState: CellState;
    newState: CellState;
  }>;
}

export interface AlibiStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  lastPlayedDate: string | null;
  averageTime: number;
  perfectGames: number; // No consistency checks used
}
