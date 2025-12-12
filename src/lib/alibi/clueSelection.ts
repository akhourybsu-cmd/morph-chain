/**
 * Clue Selection - V1.0 Ruleset + Deductive Logic Edition
 * 
 * Core Philosophy: Every puzzle must be solvable by a human using only
 * forced logical deductions, with no guessing, backtracking, or hypothesis testing.
 * 
 * Deductive Logic Edition Additions:
 * - Answer obfuscation: No clue may directly state the answer
 * - Deduction depth: Answer requires ≥2 forced deductions
 * - Cross-category requirement: Answer must involve different category reasoning
 * 
 * Selection Process:
 * 1. Pick final question FIRST
 * 2. Filter out answer-revealing clues
 * 3. Start with mandatory anchors (Section 2)
 * 4. Add clues in tier order (Section 3)
 * 5. Validate forced progress at each step (Section 4)
 * 6. Ensure category balance (Section 5)
 * 7. Validate answer obfuscation and deduction depth
 * 8. Prune redundant clues (Section 7)
 */

import { AlibiClue, AlibiSolution, Difficulty, ALIBI_RULES, PuzzleValidation, FinalQuestion } from './types';
import { generateAllCandidateClues, GeneratedClues, ProtectedAnswer } from './clueTemplates';
import { countValidSolutions, checkSolutionAgainstClues } from './constraintSolver';
import { simulateHumanSolve, countForcedMoves, validateSolverResult, clueRevealsAnswer, validateCrossCategoryDeduction } from './humanLogicSolver';
import { seededShuffle } from './entityPools';

interface ClueSelectionContext {
  people: string[];
  locations: string[];
  times: string[];
  objects: string[];
  solution: AlibiSolution;
}

/**
 * Check if any clue in the set directly reveals the final answer
 */
function checkAnswerObfuscation(
  clues: AlibiClue[],
  finalQuestion: FinalQuestion
): boolean {
  for (const clue of clues) {
    if (clueRevealsAnswer(clue, finalQuestion)) {
      return false; // Answer is revealed by a clue
    }
  }
  return true; // Answer is properly obfuscated
}

/**
 * Select a minimal clue set that guarantees human solvability
 * with answer obfuscation and deduction depth requirements
 * Returns null if no valid puzzle can be generated
 */
export function selectHumanSolvableClueSet(
  ctx: ClueSelectionContext,
  seed: number,
  targetDifficulty: Difficulty = 'medium',
  finalQuestion?: FinalQuestion
): AlibiClue[] | null {
  // Build protected answer if we have a final question
  const protectedAnswer: ProtectedAnswer | undefined = finalQuestion ? {
    person: finalQuestion.answer,
    category: finalQuestion.targetCategory,
    value: finalQuestion.targetValue,
  } : undefined;

  // Generate candidates, filtering out answer-revealing clues
  const candidates = generateAllCandidateClues(ctx, seed, protectedAnswer);
  const entities = {
    people: ctx.people,
    locations: ctx.locations,
    times: ctx.times,
    objects: ctx.objects,
  };

  // STEP 1: Select mandatory anchors (Section 2)
  const anchors = selectMandatoryAnchors(candidates, seed, protectedAnswer);
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
    
    // Skip clues that would reveal the answer
    if (finalQuestion && clueRevealsAnswer(candidate, finalQuestion)) continue;

    // Add candidate
    selectedClues.push(candidate);

    // Check if now human-solvable
    const solveResult = simulateHumanSolve({
      id: 'test',
      index: 0,
      difficulty: 'medium',
      ...ctx,
      clues: selectedClues,
      finalQuestion: finalQuestion?.questionText || '',
      finalAnswerPerson: finalQuestion?.answer || '',
    }, finalQuestion);

    if (solveResult.solvable) {
      const forcedMoves = countForcedMoves(solveResult.steps);
      const isUnique = countValidSolutions(selectedClues, entities) === 1;

      // Check deduction depth requirement (answer needs ≥2 deductions)
      const meetsDepthRequirement = finalQuestion 
        ? (solveResult.answerRevealedAtStep ?? 0) >= ALIBI_RULES.MIN_DEDUCTION_DEPTH
        : true;
      
      // Check cross-category requirement
      const meetsCrossCategoryRequirement = finalQuestion
        ? solveResult.crossCategoryUsedForAnswer ?? false
        : true;

      if (
        isUnique && 
        forcedMoves >= ALIBI_RULES.MIN_FORCED_MOVES &&
        meetsDepthRequirement &&
        meetsCrossCategoryRequirement
      ) {
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
    const balanced = balanceCategories(selectedClues, candidates, ctx, seed, protectedAnswer);
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
    finalQuestion: finalQuestion?.questionText || '',
    finalAnswerPerson: finalQuestion?.answer || '',
  }, finalQuestion);

  if (!finalResult.solvable) return null;

  const forcedMoves = countForcedMoves(finalResult.steps);
  if (forcedMoves < ALIBI_RULES.MIN_FORCED_MOVES) return null;

  if (countValidSolutions(selectedClues, entities) !== 1) return null;

  // Validate answer obfuscation
  if (finalQuestion && !checkAnswerObfuscation(selectedClues, finalQuestion)) {
    return null;
  }

  // Validate deduction depth
  if (finalQuestion) {
    const answerStep = finalResult.answerRevealedAtStep ?? 0;
    if (answerStep < ALIBI_RULES.MIN_DEDUCTION_DEPTH) {
      return null;
    }
  }

  // Validate cross-category requirement
  if (finalQuestion && !finalResult.crossCategoryUsedForAnswer) {
    return null;
  }

  // STEP 5: Prune redundant clues (Section 7) - only for hard difficulty
  if (targetDifficulty === 'hard') {
    const pruned = pruneRedundantClues(selectedClues, ctx, finalQuestion);
    return pruned;
  }

  return selectedClues;
}

/**
 * Select exactly one anchor per category (Section 2)
 * Filters out anchors that would reveal the protected answer
 */
function selectMandatoryAnchors(
  candidates: GeneratedClues, 
  seed: number,
  protectedAnswer?: ProtectedAnswer
): AlibiClue[] | null {
  // Filter out any anchors that reveal the protected answer
  const filterAnchors = (anchors: AlibiClue[]): AlibiClue[] => {
    if (!protectedAnswer) return anchors;
    return anchors.filter(a => {
      const person = a.entities?.people?.[0];
      if (person !== protectedAnswer.person) return true;
      
      if (protectedAnswer.category === 'time' && a.category === 'time') {
        return !a.entities?.times?.includes(protectedAnswer.value);
      }
      if (protectedAnswer.category === 'location' && a.category === 'location') {
        return !a.entities?.locations?.includes(protectedAnswer.value);
      }
      if (protectedAnswer.category === 'object' && a.category === 'object') {
        return !a.entities?.objects?.includes(protectedAnswer.value);
      }
      return true;
    });
  };

  const timeAnchors = seededShuffle(filterAnchors(candidates.anchors.time), seed);
  const locationAnchors = seededShuffle(filterAnchors(candidates.anchors.location), seed + 100);
  const objectAnchors = seededShuffle(filterAnchors(candidates.anchors.object), seed + 200);

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
export function validateCategoryBalance(clues: AlibiClue[]): boolean {
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
  seed: number,
  protectedAnswer?: ProtectedAnswer
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
    const candidate = allCandidates.find(c => {
      if (c.category !== neededCategory) return false;
      if (existingIds.has(c.id)) return false;
      
      // Skip if it reveals the protected answer
      if (protectedAnswer) {
        const person = c.entities?.people?.[0];
        if (person === protectedAnswer.person) {
          if (neededCategory === protectedAnswer.category) {
            const values = neededCategory === 'time' ? c.entities?.times :
                          neededCategory === 'location' ? c.entities?.locations :
                          c.entities?.objects;
            if (values?.includes(protectedAnswer.value)) {
              return false;
            }
          }
        }
      }
      
      return true;
    });

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
function pruneRedundantClues(
  clues: AlibiClue[], 
  ctx: ClueSelectionContext,
  finalQuestion?: FinalQuestion
): AlibiClue[] {
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
      finalQuestion: finalQuestion?.questionText || '',
      finalAnswerPerson: finalQuestion?.answer || '',
    }, finalQuestion);

    // Check all requirements are still met
    if (
      solveResult.solvable &&
      countForcedMoves(solveResult.steps) >= ALIBI_RULES.MIN_FORCED_MOVES &&
      countValidSolutions(testClues, entities) === 1 &&
      (finalQuestion ? (solveResult.answerRevealedAtStep ?? 0) >= ALIBI_RULES.MIN_DEDUCTION_DEPTH : true) &&
      (finalQuestion ? solveResult.crossCategoryUsedForAnswer : true)
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
 * Validate a complete puzzle against all rules including Deductive Logic Edition
 */
export function validatePuzzle(
  clues: AlibiClue[],
  ctx: ClueSelectionContext,
  finalQuestion?: FinalQuestion
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

  // Run human solver with answer tracking
  const solveResult = simulateHumanSolve({
    id: 'test',
    index: 0,
    difficulty: 'medium',
    ...ctx,
    clues,
    finalQuestion: finalQuestion?.questionText || '',
    finalAnswerPerson: finalQuestion?.answer || '',
  }, finalQuestion);

  const forcedMoveCount = countForcedMoves(solveResult.steps);
  const isUnique = countValidSolutions(clues, entities) === 1;
  
  // Deductive Logic Edition validations
  const answerObfuscated = finalQuestion 
    ? checkAnswerObfuscation(clues, finalQuestion)
    : true;
    
  const answerRevealedAtStep = solveResult.answerRevealedAtStep ?? 0;
  
  const requiresCrossCategoryDeduction = finalQuestion
    ? solveResult.crossCategoryUsedForAnswer ?? false
    : true;

  return {
    hasMinimumAnchors:
      anchorCounts.time >= ALIBI_RULES.MIN_ANCHORS.time &&
      anchorCounts.location >= ALIBI_RULES.MIN_ANCHORS.location &&
      anchorCounts.object >= ALIBI_RULES.MIN_ANCHORS.object,
    hasForcedProgressPath: solveResult.solvable,
    forcedMoveCount,
    isUnique,
    categoryBalance,
    finalQuestionInevitable: solveResult.solvable && isUnique,
    // Deductive Logic Edition
    answerObfuscated,
    answerRevealedAtStep,
    requiresCrossCategoryDeduction,
    deductionDepth: answerRevealedAtStep,
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
