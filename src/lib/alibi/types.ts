export interface AlibiSolution {
  personToLocation: Record<string, string>;
  personToTime: Record<string, string>;
  personToObject: Record<string, string>;
}

// V2.0 Ruleset: Clue tiers ordered by logic strength
export type ClueTier = 'anchor' | 'forced_negative' | 'relational' | 'cross_category' | 'advanced';

// V2.0 Ruleset: Category that a clue constrains
export type ClueCategory = 'time' | 'location' | 'object' | 'cross';

// V2.0 Expanded clue types for deeper deduction
export type ClueType = "direct_positive" | "direct_negative" | "relational" | "conditional" | "xor" | "mutual_exclusion" | "bounded_range" | "triple_elimination";

export interface AlibiClue {
  id: string;
  text: string;
  type: ClueType;
  tier: ClueTier;
  category: ClueCategory;
  // Entities referenced by this clue for validation
  entities?: {
    people?: string[];
    locations?: string[];
    times?: string[];
    objects?: string[];
  };
}

// Difficulty removed - all puzzles are challenging by default

// Deductive Logic Edition: Structured final question format
export type FinalQuestionType = 'person_at_time' | 'person_at_location' | 'person_with_object';

export interface FinalQuestion {
  type: FinalQuestionType;
  targetCategory: 'time' | 'location' | 'object';
  targetValue: string;
  questionText: string;
  answer: string;
}

// V1.0 Ruleset: Puzzle validation status
export interface PuzzleValidation {
  hasMinimumAnchors: boolean;      // ≥1 per category (Section 2)
  hasForcedProgressPath: boolean;  // Can solve without guessing (Section 4)
  forcedMoveCount: number;         // ≥5 required (Section 4.2)
  isUnique: boolean;               // Exactly 1 solution
  categoryBalance: {               // ≥2 constraints per category (Section 5)
    time: number;
    location: number;
    object: number;
  };
  finalQuestionInevitable: boolean; // Answer deducible before asked (Section 6)
  // Deductive Logic Edition additions
  answerObfuscated: boolean;       // No clue directly reveals the answer
  answerRevealedAtStep: number;    // Step at which answer becomes known
  requiresCrossCategoryDeduction: boolean; // Uses reasoning from different category
  deductionDepth: number;          // Number of deductions to reach answer
  // V3.0 Puzzle Design Guardrails
  hasNoDeadEnds: boolean;          // At every step, forced move exists (Rule 1)
  allCluesContribute: boolean;     // Every clue forces at least one mark (Rule 6)
  requiresGridInteraction: boolean; // Cannot solve by reading alone (Rule 12)
  keyInsight?: {                   // The "Silent Aha" moment (Rule 13)
    description: string;
    contributingClues: string[];
  };
}

// V1.0 Ruleset: Deduction step for human solver
export interface DeductionStep {
  type: 'confirm' | 'eliminate';
  grid: 'location' | 'time' | 'object';
  person: string;
  value: string;
  reasoning: string;
  clueId?: string;
}

// Hidden Final Question: Threshold for revealing the question
export const REVEAL_THRESHOLD = 8; // Number of confirmations before question appears

export interface AlibiPuzzle {
  id: string;
  index: number;
  people: string[];
  locations: string[];
  times: string[];
  objects: string[];
  solution: AlibiSolution;
  clues: AlibiClue[];
  finalQuestion: string;
  finalAnswerPerson: string;
  // Deductive Logic Edition: Structured final question
  finalQuestionData?: FinalQuestion;
  // V1.0: Include validation metadata
  validation?: PuzzleValidation;
  // Hidden Final Question mechanic
  revealThreshold?: number;
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

// V2.0 Ruleset Constants (Enhanced Deduction Requirements)
export const ALIBI_RULES = {
  // Section 0: No Guessing
  NO_GUESSING: "All progress must come from forced deductions",
  
  // Section 1: Fixed Puzzle Size
  PUZZLE_SIZE: { people: 4, locations: 4, times: 4, objects: 4 },
  
  // Section 2: Mandatory Anchors
  MIN_ANCHORS: { time: 1, location: 1, object: 1 },
  
  // Section 3: Clue Tiers
  TIER_ORDER: ['anchor', 'forced_negative', 'relational'] as ClueTier[],
  NEGATIVE_MIN_ELIMINATION: 0.5,  // Must eliminate ≥50%
  RELATIVE_MUST_COLLAPSE: true,   // Must terminate at anchor
  
  // Section 4: Progression Guarantee
  MIN_FORCED_MOVES: 5,
  
  // Section 5: Category Balance
  MIN_CONSTRAINTS_PER_CATEGORY: 2,
  
  // Section 6: Final Question
  ANSWER_MUST_BE_INEVITABLE: true,
  
  // Section 7: No Redundant Clues
  PRUNE_REDUNDANT: true,
  
  // Section 10: Language Clarity
  MAX_ENTITIES_PER_CLAUSE: 2,
  NO_PRONOUNS: true,
  SINGLE_SENTENCE: true,
  
  // Enhanced Deductive Logic Edition (V2.0) - All puzzles are challenging
  MIN_DEDUCTION_DEPTH: 4,         // Answer needs ≥4 deductions (increased for challenge)
  REQUIRE_CROSS_CATEGORY: true,   // Must use different category for answer
  ANSWER_OBFUSCATION: true,       // No clue may directly state the answer
  NO_TRIVIAL_ELIMINATION: true,   // Answer cannot be obvious from anchors alone
  MIN_CLUE_COUNT: 6,              // Minimum clues to ensure complexity
  REQUIRE_MULTI_STEP_CHAINS: true, // Require chained reasoning across grids
} as const;
