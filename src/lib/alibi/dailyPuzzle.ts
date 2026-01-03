/**
 * Daily Puzzle Generator - V3.0 Master Ruleset Implementation
 * 
 * NYT-Style Puzzle Generation with Difficulty Tiers:
 * - Easy (Mon-Tue): Up to 1 constrained anchor, no quantifiers
 * - Medium (Wed-Thu): Zero anchors, relative time required
 * - Hard (Fri-Sun): Zero anchors, quantifiers, optional red herring
 * 
 * Generation Flow:
 * 1. Determine difficulty from day of week
 * 2. Generate entities and solution
 * 3. Pick final question FIRST (establishes protected answer)
 * 4. Generate clues that DON'T reveal the answer
 * 5. Validate ALL rules for the difficulty tier
 */

import { AlibiPuzzle, ALIBI_RULES, FinalQuestion, DifficultyTier, getDifficultyForDate } from './types';

// Version bump forces puzzle regeneration when rules change
export const PUZZLE_GENERATION_VERSION = 8;

import { 
  generateEntities, 
  generateSolution, 
  pickFinalQuestion,
  PuzzleEntities 
} from './solutionGenerator';
import { selectHumanSolvableClueSet, estimateComplexity, validatePuzzle } from './clueSelection';
import { 
  simulateHumanSolve, 
  countForcedMoves, 
  clueRevealsAnswer,
  checkTrivialElimination 
} from './humanLogicSolver';
import { countValidSolutions } from './constraintSolver';

// Stricter minimum deduction depth for challenging puzzles
const MIN_ANSWER_DEDUCTION_DEPTH = 4;

// Convert date string to numeric seed
function dateToSeed(dateStr: string): number {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  // Create a unique seed for each date
  return year * 10000 + month * 100 + day;
}

// Get puzzle index (days since launch)
function getPuzzleIndex(dateStr: string): number {
  const launchDate = new Date('2025-01-01');
  const currentDate = new Date(dateStr);
  const diffTime = currentDate.getTime() - launchDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
}

/**
 * Generate a daily puzzle with STRICT validation including V3.0 difficulty tiers
 */
export function generateDailyPuzzle(dateStr: string): AlibiPuzzle {
  const baseSeed = dateToSeed(dateStr);
  const index = getPuzzleIndex(dateStr);
  
  // V3.0: Determine difficulty from day of week
  const puzzleDate = new Date(dateStr);
  const difficulty = getDifficultyForDate(puzzleDate);
  const difficultyRules = ALIBI_RULES.DIFFICULTY[difficulty];

  const MAX_ATTEMPTS = 150; // Increased attempts due to stricter requirements

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const seed = baseSeed + attempt * 1000;

    // STEP 1: Generate entities and solution
    const entities = generateEntities(seed);
    const solution = generateSolution(entities, seed);

    // STEP 2: Pick final question FIRST (establishes protected answer)
    // V3.0: Hard mode prefers negative questions
    const preferNegative = difficulty === 'hard';
    const finalQuestion = pickFinalQuestion(entities, solution, seed, preferNegative);
    if (!finalQuestion) continue;

    // STEP 3: Select clues that don't reveal the answer
    const clues = selectHumanSolvableClueSet(
      { ...entities, solution },
      seed,
      undefined,
      finalQuestion
    );

    if (!clues) continue;

    // STEP 4: Comprehensive validation
    const validation = validatePuzzle(clues, { ...entities, solution }, finalQuestion);

    // V1.0 Ruleset checks
    if (!validation.hasMinimumAnchors) continue;
    if (!validation.hasForcedProgressPath) continue;
    if (validation.forcedMoveCount < ALIBI_RULES.MIN_FORCED_MOVES) continue;
    if (!validation.isUnique) continue;

    // Category balance
    if (
      validation.categoryBalance.time < ALIBI_RULES.MIN_CONSTRAINTS_PER_CATEGORY ||
      validation.categoryBalance.location < ALIBI_RULES.MIN_CONSTRAINTS_PER_CATEGORY ||
      validation.categoryBalance.object < ALIBI_RULES.MIN_CONSTRAINTS_PER_CATEGORY
    ) {
      continue;
    }

    // Enhanced Deductive Logic Edition checks
    if (!validation.answerObfuscated) continue;
    if (validation.answerRevealedAtStep < MIN_ANSWER_DEDUCTION_DEPTH) continue;
    if (!validation.requiresCrossCategoryDeduction) continue;

    // V3.0 Puzzle Design Guardrails
    if (!validation.hasNoDeadEnds) continue;        // Rule 1: No dead ends
    if (!validation.allCluesContribute) continue;   // Rule 6: No floating info
    if (!validation.requiresGridInteraction) continue; // Rule 12: Grid earns its ink

    // Additional validation: Check no single clue reveals the answer
    let singleClueReveals = false;
    for (const clue of clues) {
      if (clueRevealsAnswer(clue, finalQuestion)) {
        singleClueReveals = true;
        break;
      }
    }
    if (singleClueReveals) continue;

    // Additional validation: Check for trivial elimination
    const entitiesObj = {
      people: entities.people,
      locations: entities.locations,
      times: entities.times,
      objects: entities.objects,
    };
    if (checkTrivialElimination(clues, finalQuestion, entitiesObj)) continue;

    // All validations passed!
    const complexity = estimateComplexity(clues);

    console.log(`[Alibi] Generated valid ${difficulty.toUpperCase()} puzzle for ${dateStr} on attempt ${attempt + 1}`);
    console.log(`  - Difficulty: ${difficulty}`);
    console.log(`  - Forced moves: ${validation.forcedMoveCount}`);
    console.log(`  - Answer deduction depth: ${validation.answerRevealedAtStep}`);
    console.log(`  - Clue count: ${clues.length}`);

    return {
      id: dateStr,
      index,
      people: entities.people,
      locations: entities.locations,
      times: entities.times,
      objects: entities.objects,
      solution,
      clues,
      finalQuestion: finalQuestion.questionText,
      finalAnswerPerson: finalQuestion.answer,
      finalQuestionData: finalQuestion,
      validation: { ...validation, difficulty },
      difficulty,
    };
  }

  // Fallback: Generate a basic puzzle if all attempts fail
  console.warn(`[Alibi] Failed to generate ideal puzzle for ${dateStr} after ${MAX_ATTEMPTS} attempts, using fallback`);
  return generateFallbackPuzzle(dateStr, baseSeed, index);
}

/**
 * Fallback puzzle generation when validation fails
 * Uses simpler clue selection - still valid but may not meet all enhanced requirements
 */
function generateFallbackPuzzle(dateStr: string, seed: number, index: number): AlibiPuzzle {
  const entities = generateEntities(seed);
  const solution = generateSolution(entities, seed);

  // Import all generators
  const { generateAllCandidateClues } = require('./clueTemplates');
  const candidates = generateAllCandidateClues({ ...entities, solution }, seed);

  // Use a balanced clue set
  const clues = [
    ...candidates.anchors.time.slice(0, 2),
    ...candidates.anchors.location.slice(0, 2),
    ...candidates.anchors.object.slice(0, 2),
    ...candidates.forcedNegatives.slice(0, 4),
    ...candidates.crossCategory.slice(0, 1),
  ];

  const { generateFinalQuestionLegacy } = require('./solutionGenerator');
  const { question, answer } = generateFinalQuestionLegacy(entities, solution, seed);

  return {
    id: dateStr,
    index,
    people: entities.people,
    locations: entities.locations,
    times: entities.times,
    objects: entities.objects,
    solution,
    clues,
    finalQuestion: question,
    finalAnswerPerson: answer,
  };
}

/**
 * Generate a practice puzzle (random, not date-based)
 */
export function generatePracticePuzzle(): AlibiPuzzle {
  const seed = Date.now();
  const MAX_ATTEMPTS = 75;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const attemptSeed = seed + attempt * 1000;
    const entities = generateEntities(attemptSeed);
    const solution = generateSolution(entities, attemptSeed);

    // Pick final question first
    const finalQuestion = pickFinalQuestion(entities, solution, attemptSeed);
    if (!finalQuestion) continue;

    const clues = selectHumanSolvableClueSet(
      { ...entities, solution },
      attemptSeed,
      undefined,
      finalQuestion
    );

    if (!clues) continue;

    // Quick validation
    const validation = validatePuzzle(clues, { ...entities, solution }, finalQuestion);

    if (!validation.hasForcedProgressPath) continue;
    if (!validation.answerObfuscated) continue;
    if (validation.answerRevealedAtStep < MIN_ANSWER_DEDUCTION_DEPTH) continue;
    if (!validation.requiresCrossCategoryDeduction) continue;

    return {
      id: `practice-${attemptSeed}`,
      index: 0,
      ...entities,
      solution,
      clues,
      finalQuestion: finalQuestion.questionText,
      finalAnswerPerson: finalQuestion.answer,
      finalQuestionData: finalQuestion,
      validation,
    };
  }

  // Fallback
  return generateFallbackPuzzle(`practice-${seed}`, seed, 0);
}

export function getTodayDateStr(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export function loadDailyPuzzle(): AlibiPuzzle {
  const dateStr = getTodayDateStr();
  return generateDailyPuzzle(dateStr);
}

/**
 * Debug helper: Comprehensive puzzle analysis
 */
export function analyzePuzzle(puzzle: AlibiPuzzle): {
  solvable: boolean;
  forcedMoves: number;
  stuckAt?: number;
  stepBreakdown: { confirms: number; eliminates: number };
  // Enhanced Deductive Logic Edition analysis
  answerRevealedAtStep: number;
  answerDeductionDepth: number;
  usedCrossCategoryReasoning: boolean;
  answerObfuscated: boolean;
  trivialElimination: boolean;
  isValid: boolean;
  cluesContributingToAnswer: string[];
} {
  const finalQuestion = puzzle.finalQuestionData;
  const result = simulateHumanSolve(puzzle, finalQuestion);
  
  const confirms = result.steps.filter(s => s.type === 'confirm').length;
  const eliminates = result.steps.filter(s => s.type === 'eliminate').length;

  // Check answer obfuscation
  let answerObfuscated = true;
  if (finalQuestion) {
    for (const clue of puzzle.clues) {
      if (clueRevealsAnswer(clue, finalQuestion)) {
        answerObfuscated = false;
        break;
      }
    }
  }

  // Check for trivial elimination
  let trivialElimination = false;
  if (finalQuestion) {
    const entities = {
      people: puzzle.people,
      locations: puzzle.locations,
      times: puzzle.times,
      objects: puzzle.objects,
    };
    trivialElimination = checkTrivialElimination(puzzle.clues, finalQuestion, entities);
  }

  const answerRevealedAtStep = result.answerRevealedAtStep ?? 0;
  const answerDeductionDepth = result.answerDeductionDepth ?? answerRevealedAtStep;
  const usedCrossCategoryReasoning = result.crossCategoryUsedForAnswer ?? false;

  // Overall validity check (stricter)
  const isValid = 
    result.solvable &&
    countForcedMoves(result.steps) >= ALIBI_RULES.MIN_FORCED_MOVES &&
    answerObfuscated &&
    !trivialElimination &&
    answerDeductionDepth >= MIN_ANSWER_DEDUCTION_DEPTH &&
    usedCrossCategoryReasoning;

  return {
    solvable: result.solvable,
    forcedMoves: countForcedMoves(result.steps),
    stuckAt: result.stuckAt,
    stepBreakdown: { confirms, eliminates },
    answerRevealedAtStep,
    answerDeductionDepth,
    usedCrossCategoryReasoning,
    answerObfuscated,
    trivialElimination,
    isValid,
    cluesContributingToAnswer: result.answerPathClues ?? [],
  };
}
