/**
 * Clue Selection - V1.0 Ruleset Implementation
 * 
 * Core Philosophy: Every puzzle must be solvable by a human using only
 * forced logical deductions, with no guessing, backtracking, or hypothesis testing.
 * 
 * Selection Process:
 * 1. Start with mandatory anchors (Section 2)
 * 2. Add clues in tier order (Section 3)
 * 3. Validate forced progress at each step (Section 4)
 * 4. Ensure category balance (Section 5)
 * 5. Prune redundant clues (Section 7)
 */

import { AlibiClue, AlibiSolution, Difficulty, ALIBI_RULES, PuzzleValidation } from './types';
import { generateAllCandidateClues, GeneratedClues } from './clueTemplates';
import { countValidSolutions, checkSolutionAgainstClues } from './constraintSolver';
import { simulateHumanSolve, countForcedMoves, validateSolverResult } from './humanLogicSolver';
import { seededShuffle } from './entityPools';

interface ClueSelectionContext {
  people: string[];
  locations: string[];
  times: string[];
  objects: string[];
  solution: AlibiSolution;
}

/**
 * Select a minimal clue set that guarantees human solvability
 * Returns null if no valid puzzle can be generated
 */
export function selectHumanSolvableClueSet(
  ctx: ClueSelectionContext,
  seed: number,
  targetDifficulty: Difficulty = 'medium'
): AlibiClue[] | null {
  const candidates = generateAllCandidateClues(ctx, seed);
  const entities = {
    people: ctx.people,
    locations: ctx.locations,
    times: ctx.times,
    objects: ctx.objects,
  };

  // STEP 1: Select mandatory anchors (Section 2)
  const anchors = selectMandatoryAnchors(candidates, seed);
  if (!anchors) return null;

  const selectedClues: AlibiClue[] = [...anchors];

  // Build candidate pool in tier order
  const candidatePool = buildTieredCandidatePool(candidates, anchors, seed);

  // STEP 2: Add clues until human-solvable
  for (const candidate of candidatePool) {
    // Skip if already selected
    if (selectedClues.some(c => c.id === candidate.id)) continue;

    // Validate clue is consistent with solution
    if (!checkSolutionAgainstClues(ctx.solution, [candidate], entities)) continue;

    // Add candidate
    selectedClues.push(candidate);

    // Check if now human-solvable
    const solveResult = simulateHumanSolve({
      id: 'test',
      index: 0,
      difficulty: 'medium',
      ...ctx,
      clues: selectedClues,
      finalQuestion: '',
      finalAnswerPerson: '',
    });

    if (solveResult.solvable) {
      const forcedMoves = countForcedMoves(solveResult.steps);
      const isUnique = countValidSolutions(selectedClues, entities) === 1;

      if (isUnique && forcedMoves >= ALIBI_RULES.MIN_FORCED_MOVES) {
        // Validate solution correctness
        if (validateSolverResult(solveResult.steps, ctx.solution, ctx.people)) {
          break;
        }
      }
    }
  }

  // STEP 3: Validate category balance (Section 5)
  if (!validateCategoryBalance(selectedClues)) {
    // Try adding more clues to balance
    const balanced = balanceCategories(selectedClues, candidates, ctx, seed);
    if (!balanced) return null;
    selectedClues.length = 0;
    selectedClues.push(...balanced);
  }

  // STEP 4: Final validation
  const finalResult = simulateHumanSolve({
    id: 'test',
    index: 0,
    difficulty: 'medium',
    ...ctx,
    clues: selectedClues,
    finalQuestion: '',
    finalAnswerPerson: '',
  });

  if (!finalResult.solvable) return null;

  const forcedMoves = countForcedMoves(finalResult.steps);
  if (forcedMoves < ALIBI_RULES.MIN_FORCED_MOVES) return null;

  if (countValidSolutions(selectedClues, entities) !== 1) return null;

  // STEP 5: Prune redundant clues (Section 7) - only for hard difficulty
  if (targetDifficulty === 'hard') {
    const pruned = pruneRedundantClues(selectedClues, ctx);
    return pruned;
  }

  return selectedClues;
}

/**
 * Select exactly one anchor per category (Section 2)
 */
function selectMandatoryAnchors(candidates: GeneratedClues, seed: number): AlibiClue[] | null {
  const timeAnchors = seededShuffle(candidates.anchors.time, seed);
  const locationAnchors = seededShuffle(candidates.anchors.location, seed + 100);
  const objectAnchors = seededShuffle(candidates.anchors.object, seed + 200);

  if (timeAnchors.length === 0 || locationAnchors.length === 0 || objectAnchors.length === 0) {
    return null;
  }

  // Pick different people for each anchor to spread information
  const usedPeople = new Set<string>();
  const result: AlibiClue[] = [];

  // Time anchor
  for (const anchor of timeAnchors) {
    const person = anchor.entities?.people?.[0];
    if (person && !usedPeople.has(person)) {
      result.push(anchor);
      usedPeople.add(person);
      break;
    }
  }
  if (result.length === 0) result.push(timeAnchors[0]);

  // Location anchor - try different person
  for (const anchor of locationAnchors) {
    const person = anchor.entities?.people?.[0];
    if (person && !usedPeople.has(person)) {
      result.push(anchor);
      usedPeople.add(person);
      break;
    }
  }
  if (result.length === 1) result.push(locationAnchors[0]);

  // Object anchor - try different person
  for (const anchor of objectAnchors) {
    const person = anchor.entities?.people?.[0];
    if (person && !usedPeople.has(person)) {
      result.push(anchor);
      usedPeople.add(person);
      break;
    }
  }
  if (result.length === 2) result.push(objectAnchors[0]);

  return result;
}

/**
 * Build candidate pool in tier order (Section 3)
 */
function buildTieredCandidatePool(
  candidates: GeneratedClues,
  existingAnchors: AlibiClue[],
  seed: number
): AlibiClue[] {
  const existingIds = new Set(existingAnchors.map(a => a.id));

  // Remaining anchors first
  const remainingAnchors = [
    ...candidates.anchors.time.filter(c => !existingIds.has(c.id)),
    ...candidates.anchors.location.filter(c => !existingIds.has(c.id)),
    ...candidates.anchors.object.filter(c => !existingIds.has(c.id)),
  ];

  // Cross-category clues (useful for cascading)
  const cross = candidates.crossCategory.filter(c => !existingIds.has(c.id));

  // Forced negatives
  const negatives = candidates.forcedNegatives.filter(c => !existingIds.has(c.id));

  // Relationals (most restricted, add last)
  const relationals = candidates.relationals.filter(c => !existingIds.has(c.id));

  // Shuffle each tier
  return [
    ...seededShuffle(remainingAnchors, seed + 300),
    ...seededShuffle(cross, seed + 400),
    ...seededShuffle(negatives, seed + 500),
    ...seededShuffle(relationals, seed + 600),
  ];
}

/**
 * Validate category balance (Section 5)
 * Each category must have ≥2 independent constraints
 */
function validateCategoryBalance(clues: AlibiClue[]): boolean {
  const counts = { time: 0, location: 0, object: 0 };

  for (const clue of clues) {
    if (clue.category === 'time' || clue.category === 'cross') counts.time++;
    if (clue.category === 'location' || clue.category === 'cross') counts.location++;
    if (clue.category === 'object' || clue.category === 'cross') counts.object++;
  }

  return (
    counts.time >= ALIBI_RULES.MIN_CONSTRAINTS_PER_CATEGORY &&
    counts.location >= ALIBI_RULES.MIN_CONSTRAINTS_PER_CATEGORY &&
    counts.object >= ALIBI_RULES.MIN_CONSTRAINTS_PER_CATEGORY
  );
}

/**
 * Try to add clues to balance categories
 */
function balanceCategories(
  clues: AlibiClue[],
  candidates: GeneratedClues,
  ctx: ClueSelectionContext,
  seed: number
): AlibiClue[] | null {
  const result = [...clues];
  const entities = {
    people: ctx.people,
    locations: ctx.locations,
    times: ctx.times,
    objects: ctx.objects,
  };

  const getCounts = () => {
    const counts = { time: 0, location: 0, object: 0 };
    for (const clue of result) {
      if (clue.category === 'time' || clue.category === 'cross') counts.time++;
      if (clue.category === 'location' || clue.category === 'cross') counts.location++;
      if (clue.category === 'object' || clue.category === 'cross') counts.object++;
    }
    return counts;
  };

  const allCandidates = [
    ...candidates.anchors.time,
    ...candidates.anchors.location,
    ...candidates.anchors.object,
    ...candidates.forcedNegatives,
  ];

  for (let attempt = 0; attempt < 20; attempt++) {
    const counts = getCounts();
    if (
      counts.time >= 2 &&
      counts.location >= 2 &&
      counts.object >= 2
    ) {
      return result;
    }

    // Find which category needs more
    let neededCategory: 'time' | 'location' | 'object' | null = null;
    if (counts.time < 2) neededCategory = 'time';
    else if (counts.location < 2) neededCategory = 'location';
    else if (counts.object < 2) neededCategory = 'object';

    if (!neededCategory) break;

    // Find a candidate for this category
    const existingIds = new Set(result.map(c => c.id));
    const candidate = allCandidates.find(
      c => c.category === neededCategory && !existingIds.has(c.id)
    );

    if (!candidate) break;

    // Validate it's consistent
    if (checkSolutionAgainstClues(ctx.solution, [candidate], entities)) {
      result.push(candidate);
    }
  }

  return validateCategoryBalance(result) ? result : null;
}

/**
 * Remove clues that don't change the solution path (Section 7)
 */
function pruneRedundantClues(clues: AlibiClue[], ctx: ClueSelectionContext): AlibiClue[] {
  const entities = {
    people: ctx.people,
    locations: ctx.locations,
    times: ctx.times,
    objects: ctx.objects,
  };

  const result = [...clues];

  for (let i = result.length - 1; i >= 0; i--) {
    const testClues = [...result.slice(0, i), ...result.slice(i + 1)];
    if (testClues.length === 0) continue;

    // Check if still uniquely solvable without this clue
    const solveResult = simulateHumanSolve({
      id: 'test',
      index: 0,
      difficulty: 'medium',
      people: ctx.people,
      locations: ctx.locations,
      times: ctx.times,
      objects: ctx.objects,
      solution: ctx.solution,
      clues: testClues,
      finalQuestion: '',
      finalAnswerPerson: '',
    });

    if (
      solveResult.solvable &&
      countForcedMoves(solveResult.steps) >= ALIBI_RULES.MIN_FORCED_MOVES &&
      countValidSolutions(testClues, entities) === 1
    ) {
      // This clue was redundant
      result.splice(i, 1);
    }
  }

  return result;
}

/**
 * Estimate difficulty based on clue count and types
 */
export function estimateDifficulty(clues: AlibiClue[]): Difficulty {
  const anchorCount = clues.filter(c => c.tier === 'anchor').length;
  const relationalCount = clues.filter(c => c.tier === 'relational').length;
  const totalClues = clues.length;

  // More anchors = easier, more relationals = harder
  if (anchorCount >= 5 && relationalCount === 0) return 'easy';
  if (totalClues <= 5 || relationalCount >= 2) return 'hard';
  return 'medium';
}

/**
 * Validate a complete puzzle against all rules
 */
export function validatePuzzle(
  clues: AlibiClue[],
  ctx: ClueSelectionContext
): PuzzleValidation {
  const entities = {
    people: ctx.people,
    locations: ctx.locations,
    times: ctx.times,
    objects: ctx.objects,
  };

  // Count anchors per category
  const anchorCounts = { time: 0, location: 0, object: 0 };
  for (const clue of clues) {
    if (clue.tier === 'anchor') {
      if (clue.category === 'time') anchorCounts.time++;
      else if (clue.category === 'location') anchorCounts.location++;
      else if (clue.category === 'object') anchorCounts.object++;
    }
  }

  // Check category balance
  const categoryBalance = { time: 0, location: 0, object: 0 };
  for (const clue of clues) {
    if (clue.category === 'time' || clue.category === 'cross') categoryBalance.time++;
    if (clue.category === 'location' || clue.category === 'cross') categoryBalance.location++;
    if (clue.category === 'object' || clue.category === 'cross') categoryBalance.object++;
  }

  // Run human solver
  const solveResult = simulateHumanSolve({
    id: 'test',
    index: 0,
    difficulty: 'medium',
    ...ctx,
    clues,
    finalQuestion: '',
    finalAnswerPerson: '',
  });

  const forcedMoveCount = countForcedMoves(solveResult.steps);
  const isUnique = countValidSolutions(clues, entities) === 1;

  return {
    hasMinimumAnchors:
      anchorCounts.time >= ALIBI_RULES.MIN_ANCHORS.time &&
      anchorCounts.location >= ALIBI_RULES.MIN_ANCHORS.location &&
      anchorCounts.object >= ALIBI_RULES.MIN_ANCHORS.object,
    hasForcedProgressPath: solveResult.solvable,
    forcedMoveCount,
    isUnique,
    categoryBalance,
    finalQuestionInevitable: true, // Validated separately in solutionGenerator
  };
}

// Legacy compatibility
export function selectMinimalClueSet(
  ctx: ClueSelectionContext,
  seed: number,
  targetDifficulty: Difficulty = 'medium'
): AlibiClue[] {
  const result = selectHumanSolvableClueSet(ctx, seed, targetDifficulty);
  if (result) return result;

  // Fallback: generate a basic clue set (may not be ideal)
  console.warn('Failed to generate human-solvable puzzle, using fallback');
  const candidates = generateAllCandidateClues(ctx, seed);
  return [
    ...candidates.anchors.time.slice(0, 2),
    ...candidates.anchors.location.slice(0, 2),
    ...candidates.anchors.object.slice(0, 2),
    ...candidates.forcedNegatives.slice(0, 2),
  ];
}
