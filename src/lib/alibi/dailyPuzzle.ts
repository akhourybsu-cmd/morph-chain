/**
 * Daily Puzzle Generator - V1.0 Ruleset Implementation
 * 
 * Generates puzzles with retry loop until all validation rules pass:
 * - Mandatory anchors (Section 2)
 * - Forced progress path (Section 4)
 * - Minimum forced moves ≥5 (Section 4.2)
 * - Category balance (Section 5)
 * - Final question inevitability (Section 6)
 */

import { AlibiPuzzle, Difficulty, ALIBI_RULES } from './types';
import { generateEntities, generateSolution, generateFinalQuestion, PuzzleEntities } from './solutionGenerator';
import { selectHumanSolvableClueSet, estimateDifficulty, validatePuzzle } from './clueSelection';
import { simulateHumanSolve, countForcedMoves } from './humanLogicSolver';
import { countValidSolutions } from './constraintSolver';

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
 * Generate a daily puzzle with full validation
 * Retries up to MAX_ATTEMPTS times to find a valid puzzle
 */
export function generateDailyPuzzle(dateStr: string): AlibiPuzzle {
  const baseSeed = dateToSeed(dateStr);
  const index = getPuzzleIndex(dateStr);

  const MAX_ATTEMPTS = 100;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const seed = baseSeed + attempt * 1000;

    // Generate entities and solution
    const entities = generateEntities(seed);
    const solution = generateSolution(entities, seed);

    // Select clues with human-solvability validation
    const clues = selectHumanSolvableClueSet(
      { ...entities, solution },
      seed,
      'medium'
    );

    if (!clues) continue;

    // Validate the puzzle
    const validation = validatePuzzle(clues, { ...entities, solution });

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

    // Generate final question with inevitability validation
    const finalQ = generateFinalQuestion(entities, solution, clues, seed);
    if (!finalQ) continue;

    // All validations passed!
    const difficulty: Difficulty = estimateDifficulty(clues);

    return {
      id: dateStr,
      index,
      difficulty,
      people: entities.people,
      locations: entities.locations,
      times: entities.times,
      objects: entities.objects,
      solution,
      clues,
      finalQuestion: finalQ.question,
      finalAnswerPerson: finalQ.answer,
      validation,
    };
  }

  // Fallback: Generate a basic puzzle if all attempts fail
  console.warn(`Failed to generate ideal puzzle for ${dateStr} after ${MAX_ATTEMPTS} attempts, using fallback`);
  return generateFallbackPuzzle(dateStr, baseSeed, index);
}

/**
 * Fallback puzzle generation when validation fails
 * Uses simpler clue selection without strict validation
 */
function generateFallbackPuzzle(dateStr: string, seed: number, index: number): AlibiPuzzle {
  const entities = generateEntities(seed);
  const solution = generateSolution(entities, seed);

  // Import all generators
  const { generateAllCandidateClues } = require('./clueTemplates');
  const candidates = generateAllCandidateClues({ ...entities, solution }, seed);

  // Use a simple anchor-heavy clue set
  const clues = [
    ...candidates.anchors.time.slice(0, 2),
    ...candidates.anchors.location.slice(0, 2),
    ...candidates.anchors.object.slice(0, 2),
    ...candidates.forcedNegatives.slice(0, 3),
  ];

  const { generateFinalQuestionLegacy } = require('./solutionGenerator');
  const { question, answer } = generateFinalQuestionLegacy(entities, solution, seed);

  return {
    id: dateStr,
    index,
    difficulty: 'medium',
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
  const MAX_ATTEMPTS = 50;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const attemptSeed = seed + attempt * 1000;
    const entities = generateEntities(attemptSeed);
    const solution = generateSolution(entities, attemptSeed);

    const clues = selectHumanSolvableClueSet(
      { ...entities, solution },
      attemptSeed,
      'medium'
    );

    if (!clues) continue;

    // Quick validation
    const solveResult = simulateHumanSolve({
      id: 'practice',
      index: 0,
      difficulty: 'medium',
      ...entities,
      solution,
      clues,
      finalQuestion: '',
      finalAnswerPerson: '',
    });

    if (!solveResult.solvable) continue;

    const finalQ = generateFinalQuestion(entities, solution, clues, attemptSeed);
    if (!finalQ) continue;

    const difficulty: Difficulty = estimateDifficulty(clues);

    return {
      id: `practice-${attemptSeed}`,
      index: 0,
      difficulty,
      ...entities,
      solution,
      clues,
      finalQuestion: finalQ.question,
      finalAnswerPerson: finalQ.answer,
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
 * Debug helper: Analyze a puzzle's solve path
 */
export function analyzePuzzle(puzzle: AlibiPuzzle): {
  solvable: boolean;
  forcedMoves: number;
  stuckAt?: number;
  stepBreakdown: { confirms: number; eliminates: number };
} {
  const result = simulateHumanSolve(puzzle);
  
  const confirms = result.steps.filter(s => s.type === 'confirm').length;
  const eliminates = result.steps.filter(s => s.type === 'eliminate').length;

  return {
    solvable: result.solvable,
    forcedMoves: countForcedMoves(result.steps),
    stuckAt: result.stuckAt,
    stepBreakdown: { confirms, eliminates },
  };
}
