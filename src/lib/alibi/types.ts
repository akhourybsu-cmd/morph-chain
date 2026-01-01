export interface AlibiSolution {
  personToLocation: Record<string, string>;
  personToTime: Record<string, string>;
  personToObject: Record<string, string>;
}

// V3.0 Master Ruleset: Difficulty tiers for NYT-style progression
export type DifficultyTier = 'easy' | 'medium' | 'hard';

// V3.0 Ruleset: Clue tiers ordered by logic strength
export type ClueTier = 'anchor' | 'constrained_positive' | 'forced_negative' | 'relational' | 'cross_category' | 'advanced';

// V3.0 Ruleset: Category that a clue constrains
export type ClueCategory = 'time' | 'location' | 'object' | 'cross';

// V3.0 Expanded clue types for deeper deduction
export type ClueType = 
  | "direct_positive" 
  | "direct_negative" 
  | "relational" 
  | "conditional" 
  | "xor" 
  | "mutual_exclusion" 
  | "bounded_range" 
  | "triple_elimination"
  // V3.0 New clue types
  | "binary_positive"       // "X was either at A or B"
  | "quantifier_exactly_one" // "Exactly one of X or Y had Z"
  | "quantifier_at_least"    // "At least one outdoor location..."
  | "quantifier_no_more"     // "No more than one person..."
  | "red_herring";           // Clues involving 5th attribute

// V3.0 Red herring category options
export type RedHerringCategory = 'transportation' | 'weather' | null;

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
  // V3.0: Red herring attribute if applicable
  redHerringValue?: string;
}

// Deductive Logic Edition: Structured final question format
export type FinalQuestionType = 
  | 'person_at_time' 
  | 'person_at_location' 
  | 'person_with_object'
  // V3.0 New question types
  | 'person_not_at_location'
  | 'person_not_with_object'
  | 'person_not_at_time'
  | 'who_arrived_last'
  | 'who_arrived_first';

export interface FinalQuestion {
  type: FinalQuestionType;
  targetCategory: 'time' | 'location' | 'object';
  targetValue: string;
  questionText: string;
  answer: string;
  // V3.0: Flag for negative questions
  isNegative?: boolean;
}

// V3.0 Ruleset: Puzzle validation status
export interface PuzzleValidation {
  hasMinimumAnchors: boolean;      // Now means constrained positives (Section 2)
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
  // V3.0 New validation fields
  difficulty?: DifficultyTier;     // Puzzle difficulty tier
  anchorCount: number;             // Number of direct anchors (should be 0-1)
  clueCount: number;               // Total clue count (should be 6-8)
  hasSilentAha: boolean;           // Has a satisfying deduction moment
  hasRedHerring?: boolean;         // Uses a 5th attribute
}

// V3.0 Ruleset: Deduction step for human solver
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
  // V3.0: Include validation metadata
  validation?: PuzzleValidation;
  // Hidden Final Question mechanic
  revealThreshold?: number;
  // V3.0: Difficulty tier
  difficulty?: DifficultyTier;
  // V3.0: Red herring category if used
  redHerringCategory?: RedHerringCategory;
  redHerringAssignments?: Record<string, string>; // person -> red herring value
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

// V3.0 Master Ruleset Constants (NYT-Style Requirements)
export const ALIBI_RULES = {
  // Section 0: No Guessing
  NO_GUESSING: "All progress must come from forced deductions",
  
  // Section 1: Fixed Puzzle Size
  PUZZLE_SIZE: { people: 4, locations: 4, times: 4, objects: 4 },
  
  // Section 2: Anchor Restrictions (V3.0)
  MAX_ANCHORS: 1,                // Maximum 1 direct positive anchor
  ZERO_ANCHORS_PREFERRED: true,  // Zero anchors preferred for challenge
  
  // Section 3: Clue Tiers
  TIER_ORDER: ['constrained_positive', 'forced_negative', 'relational', 'cross_category', 'advanced'] as ClueTier[],
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
  
  // Section 8: Clue Count Limits (V3.0)
  MAX_CLUE_COUNT: 8,
  PREFERRED_CLUE_COUNT: { min: 6, max: 7 },
  
  // Section 10: Language Clarity
  MAX_ENTITIES_PER_CLAUSE: 2,
  NO_PRONOUNS: true,
  SINGLE_SENTENCE: true,
  
  // Enhanced Deductive Logic Edition (V3.0) - All puzzles are challenging
  MIN_DEDUCTION_DEPTH: 4,         // Answer needs ≥4 deductions
  REQUIRE_CROSS_CATEGORY: true,   // Must use different category for answer
  ANSWER_OBFUSCATION: true,       // No clue may directly state the answer
  NO_TRIVIAL_ELIMINATION: true,   // Answer cannot be obvious from anchors alone
  MIN_CLUE_COUNT: 6,              // Minimum clues to ensure complexity
  REQUIRE_MULTI_STEP_CHAINS: true, // Require chained reasoning across grids
  REQUIRE_SILENT_AHA: true,       // Must have a satisfying deduction moment
  
  // V3.0 Difficulty-Specific Rules
  DIFFICULTY: {
    easy: {
      maxAnchors: 1,               // Up to 1 constrained anchor
      allowQuantifiers: false,     // No quantifiers
      allowRedHerring: false,      // No red herring
      requireRelativeTime: false,  // Relative time optional
      minDeductionDepth: 3,
    },
    medium: {
      maxAnchors: 0,               // Zero anchors
      allowQuantifiers: true,      // One quantifier OR conditional
      allowRedHerring: false,      // No red herring
      requireRelativeTime: true,   // Relative time required
      minDeductionDepth: 4,
      requireCrossCategory: true,  // At least 1 cross-category chain
    },
    hard: {
      maxAnchors: 0,               // Zero anchors
      allowQuantifiers: true,      // Quantifier required
      allowRedHerring: true,       // One red herring attribute
      requireRelativeTime: true,   // Relative time ONLY
      minDeductionDepth: 5,
      requireCrossCategory: true,
      preferNegativeFinalQuestion: true,
    },
  },
} as const;

// V3.0 Day of week to difficulty mapping
export function getDifficultyForDate(date: Date): DifficultyTier {
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Monday-Tuesday: Easy
  if (day === 1 || day === 2) return 'easy';
  // Wednesday-Thursday: Medium
  if (day === 3 || day === 4) return 'medium';
  // Friday-Sunday: Hard
  return 'hard';
}
