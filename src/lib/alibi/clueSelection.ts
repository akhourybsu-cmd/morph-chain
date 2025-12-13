/**
 * Clue Selection - V2.0 Enhanced Deduction Requirements
 * 
 * Core Philosophy: Every puzzle must be solvable by a human using only
 * forced logical deductions, with no guessing, backtracking, or hypothesis testing.
 * 
 * Deductive Logic Edition Requirements:
 * - Answer obfuscation: No clue may directly state the answer
 * - Deduction depth: Answer requires ≥3 deduction steps (increased from 2)
 * - Cross-category requirement: Answer must involve different category reasoning
 * - No trivial elimination: Answer cannot be determined from anchors alone
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

import { AlibiClue, AlibiSolution, ALIBI_RULES, PuzzleValidation, FinalQuestion } from './types';
import { generateAllCandidateClues, GeneratedClues, ProtectedAnswer } from './clueTemplates';
import { countValidSolutions, checkSolutionAgainstClues } from './constraintSolver';
import { 
  simulateHumanSolve, 
  countForcedMoves, 
  validateSolverResult, 
  clueRevealsAnswer, 
  validateCrossCategoryDeduction,
  checkTrivialElimination 
} from './humanLogicSolver';
import { seededShuffle } from './entityPools';

interface ClueSelectionContext {
  people: string[];
  locations: string[];
  times: string[];
  objects: string[];
  solution: AlibiSolution;
}

// Minimum deduction depth required for the answer (stricter for challenge)
const MIN_ANSWER_DEDUCTION_DEPTH = 4;

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
 * with STRICT answer obfuscation and deduction depth requirements
 * Returns null if no valid puzzle can be generated
 */
export function selectHumanSolvableClueSet(
  ctx: ClueSelectionContext,
  seed: number,
  _unused?: string, // Keep for backwards compatibility
  finalQuestion?: FinalQuestion
): AlibiClue[] | null {
  // Build protected answer if we have a final question
  const protectedAnswer: ProtectedAnswer | undefined = finalQuestion ? {
    person: finalQuestion.answer,
    category: finalQuestion.targetCategory,
    value: finalQuestion.targetValue,
  } : undefined;

  // Generate candidates, filtering out answer-revealing clues
  const candidates = generateAllCandidateClues({ ...ctx, solution: ctx.solution }, seed, protectedAnswer);
  const entities = {
    people: ctx.people,
    locations: ctx.locations,
    times: ctx.times,
    objects: ctx.objects,
  };

  // STEP 1: Select mandatory anchors (Section 2)
  const anchors = selectMandatoryAnchors(candidates, seed, protectedAnswer, finalQuestion);
  if (!anchors) return null;

  const selectedClues: AlibiClue[] = [...anchors];

  // Early check: Ensure anchors alone don't trivially reveal the answer
  if (finalQuestion && checkTrivialElimination(selectedClues, finalQuestion, entities)) {
    return null; // This anchor combination makes the answer trivial
  }

  // Build candidate pool in tier order
  const candidatePool = buildTieredCandidatePool(candidates, anchors, seed);

  // STEP 2: Add clues until human-solvable with proper depth
  let foundValidSet = false;
  
  for (const candidate of candidatePool) {
    // Skip if already selected
    if (selectedClues.some(c => c.id === candidate.id)) continue;

    // Validate clue is consistent with solution
    if (!checkSolutionAgainstClues(ctx.solution, [candidate], entities)) continue;
    
    // Skip clues that would reveal the answer
    if (finalQuestion && clueRevealsAnswer(candidate, finalQuestion)) continue;

    // Add candidate
    selectedClues.push(candidate);

    // Check if trivial elimination now occurs
    if (finalQuestion && checkTrivialElimination(selectedClues, finalQuestion, entities)) {
      // This clue makes the answer trivial - remove it and continue
      selectedClues.pop();
      continue;
    }

    // Check if now human-solvable
    const solveResult = simulateHumanSolve({
      id: 'test',
      index: 0,
      ...ctx,
      clues: selectedClues,
      finalQuestion: finalQuestion?.questionText || '',
      finalAnswerPerson: finalQuestion?.answer || '',
    }, finalQuestion);

    if (solveResult.solvable) {
      const forcedMoves = countForcedMoves(solveResult.steps);
      const isUnique = countValidSolutions(selectedClues, entities) === 1;

      // Enhanced deduction depth requirement (use answerDeductionDepth for true depth)
      const answerDepth = solveResult.answerDeductionDepth ?? solveResult.answerRevealedAtStep ?? 0;
      const meetsDepthRequirement = finalQuestion 
        ? answerDepth >= MIN_ANSWER_DEDUCTION_DEPTH
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
          foundValidSet = true;
          break;
        }
      }
    }
  }

  if (!foundValidSet) return null;

  // STEP 3: Validate category balance (Section 5)
  if (!validateCategoryBalance(selectedClues)) {
    // Try adding more clues to balance
    const balanced = balanceCategories(selectedClues, candidates, ctx, seed, protectedAnswer, finalQuestion);
    if (!balanced) return null;
    selectedClues.length = 0;
    selectedClues.push(...balanced);
  }

  // STEP 4: Final comprehensive validation
  const finalResult = simulateHumanSolve({
    id: 'test',
    index: 0,
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

  // Validate deduction depth (using enhanced tracking)
  if (finalQuestion) {
    const answerDepth = finalResult.answerDeductionDepth ?? finalResult.answerRevealedAtStep ?? 0;
    if (answerDepth < MIN_ANSWER_DEDUCTION_DEPTH) {
      return null;
    }
  }

  // Validate cross-category requirement
  if (finalQuestion && !finalResult.crossCategoryUsedForAnswer) {
    return null;
  }

  // Validate no trivial elimination
  if (finalQuestion && checkTrivialElimination(selectedClues, finalQuestion, entities)) {
    return null;
  }

  // STEP 5: Always prune redundant clues for challenging puzzles
  const pruned = pruneRedundantClues(selectedClues, ctx, finalQuestion);
  
  // STEP 6: Order clues editorially for best player experience (Rule 2)
  return orderCluesEditorially(pruned);
}

/**
 * Select exactly one anchor per category (Section 2)
 * Filters out anchors that would reveal the protected answer
 * Also ensures anchors don't make the answer trivially determinable
 */
function selectMandatoryAnchors(
  candidates: GeneratedClues, 
  seed: number,
  protectedAnswer?: ProtectedAnswer,
  finalQuestion?: FinalQuestion
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

  // Try different anchor combinations to avoid trivial elimination
  for (let t = 0; t < Math.min(timeAnchors.length, 3); t++) {
    for (let l = 0; l < Math.min(locationAnchors.length, 3); l++) {
      for (let o = 0; o < Math.min(objectAnchors.length, 3); o++) {
        const result: AlibiClue[] = [timeAnchors[t], locationAnchors[l], objectAnchors[o]];
        
        // Check if this anchor set is viable (answer person shouldn't have ALL their values anchored)
        if (protectedAnswer) {
          const anchorPeople = result.map(a => a.entities?.people?.[0]).filter(Boolean);
          const answerPersonAnchors = anchorPeople.filter(p => p === protectedAnswer.person).length;
          
          // If answer person has all 3 anchors, skip this combination
          if (answerPersonAnchors >= 3) continue;
        }
        
        return result;
      }
    }
  }

  // Fallback to first available anchors
  return [timeAnchors[0], locationAnchors[0], objectAnchors[0]];
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

  // Relationals (most restricted)
  const relationals = candidates.relationals.filter(c => !existingIds.has(c.id));

  // Advanced clues (require multi-step deduction - add after relationals)
  const advanced = candidates.advanced.filter(c => !existingIds.has(c.id));

  // Shuffle each tier
  return [
    ...seededShuffle(remainingAnchors, seed + 300),
    ...seededShuffle(cross, seed + 400),
    ...seededShuffle(negatives, seed + 500),
    ...seededShuffle(relationals, seed + 600),
    ...seededShuffle(advanced, seed + 700),
  ];
}

/**
 * Order clues editorially for best player experience (Rule 2)
 * Order: 1. Anchors → 2. Cross-category → 3. Relationals → 4. Eliminations
 */
export function orderCluesEditorially(clues: AlibiClue[]): AlibiClue[] {
  const anchors: AlibiClue[] = [];
  const crossCategory: AlibiClue[] = [];
  const relationals: AlibiClue[] = [];
  const eliminations: AlibiClue[] = [];
  const other: AlibiClue[] = [];

  for (const clue of clues) {
    if (clue.tier === 'anchor') {
      anchors.push(clue);
    } else if (clue.tier === 'cross_category') {
      crossCategory.push(clue);
    } else if (clue.tier === 'relational') {
      relationals.push(clue);
    } else if (clue.tier === 'forced_negative' || clue.type === 'direct_negative') {
      eliminations.push(clue);
    } else {
      other.push(clue);
    }
  }

  return [...anchors, ...crossCategory, ...relationals, ...eliminations, ...other];
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
  protectedAnswer?: ProtectedAnswer,
  finalQuestion?: FinalQuestion
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
      if (finalQuestion && clueRevealsAnswer(c, finalQuestion)) {
        return false;
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
    const answerDepth = solveResult.answerDeductionDepth ?? solveResult.answerRevealedAtStep ?? 0;
    
    if (
      solveResult.solvable &&
      countForcedMoves(solveResult.steps) >= ALIBI_RULES.MIN_FORCED_MOVES &&
      countValidSolutions(testClues, entities) === 1 &&
      (finalQuestion ? answerDepth >= MIN_ANSWER_DEDUCTION_DEPTH : true) &&
      (finalQuestion ? solveResult.crossCategoryUsedForAnswer : true)
    ) {
      // This clue was redundant
      result.splice(i, 1);
    }
  }

  return result;
}

/**
 * Estimate complexity score based on clue count and types (for logging only)
 */
export function estimateComplexity(clues: AlibiClue[]): number {
  const anchorCount = clues.filter(c => c.tier === 'anchor').length;
  const relationalCount = clues.filter(c => c.tier === 'relational').length;
  const crossCategoryCount = clues.filter(c => c.tier === 'cross_category').length;
  
  // Higher score = more complex
  return (clues.length * 10) + (relationalCount * 15) + (crossCategoryCount * 20) - (anchorCount * 5);
}

/**
 * Validate a complete puzzle against all rules including enhanced Deductive Logic Edition
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

  const hasMinimumAnchors = 
    anchorCounts.time >= 1 && 
    anchorCounts.location >= 1 && 
    anchorCounts.object >= 1;

  // Simulate human solve
  const solveResult = simulateHumanSolve({
    id: 'validation',
    index: 0,
    ...ctx,
    clues,
    finalQuestion: finalQuestion?.questionText || '',
    finalAnswerPerson: finalQuestion?.answer || '',
  }, finalQuestion);

  const forcedMoveCount = countForcedMoves(solveResult.steps);
  const hasForcedProgressPath = solveResult.solvable;
  const isUnique = countValidSolutions(clues, entities) === 1;

  // Category balance
  const categoryBalance = { time: 0, location: 0, object: 0 };
  for (const clue of clues) {
    if (clue.category === 'time' || clue.category === 'cross') categoryBalance.time++;
    if (clue.category === 'location' || clue.category === 'cross') categoryBalance.location++;
    if (clue.category === 'object' || clue.category === 'cross') categoryBalance.object++;
  }

  // Final question inevitability (answer must be determinable)
  const finalQuestionInevitable = solveResult.solvable && 
    (solveResult.answerRevealedAtStep !== undefined || !finalQuestion);

  // Deductive Logic Edition checks
  let answerObfuscated = true;
  let answerRevealedAtStep = solveResult.answerDeductionDepth ?? solveResult.answerRevealedAtStep ?? 0;
  let requiresCrossCategoryDeduction = solveResult.crossCategoryUsedForAnswer ?? false;
  let deductionDepth = answerRevealedAtStep;

  if (finalQuestion) {
    // Check answer obfuscation
    for (const clue of clues) {
      if (clueRevealsAnswer(clue, finalQuestion)) {
        answerObfuscated = false;
        break;
      }
    }
    
    // Check for trivial elimination
    if (checkTrivialElimination(clues, finalQuestion, entities)) {
      answerObfuscated = false;
      answerRevealedAtStep = 0;
    }
  }

  // V3.0 Puzzle Design Guardrails
  const hasNoDeadEnds = solveResult.hasNoDeadEnds ?? true;
  const allCluesContribute = clues.every(c => solveResult.cluesUsed?.has(c.id) ?? true);
  const requiresGridInteraction = (solveResult.gridInteractionCount ?? 0) >= 12; // Minimum grid marks required
  const keyInsight = solveResult.keyInsight;

  return {
    hasMinimumAnchors,
    hasForcedProgressPath,
    forcedMoveCount,
    isUnique,
    categoryBalance,
    finalQuestionInevitable,
    answerObfuscated,
    answerRevealedAtStep,
    requiresCrossCategoryDeduction,
    deductionDepth,
    hasNoDeadEnds,
    allCluesContribute,
    requiresGridInteraction,
    keyInsight,
  };
}

/**
 * Legacy compatibility - returns basic clue set
 */
export function selectMinimalClueSet(
  ctx: ClueSelectionContext,
  seed: number
): AlibiClue[] {
  const result = selectHumanSolvableClueSet(ctx, seed);
  if (result) return result;

  // Fallback: return basic anchors
  const candidates = generateAllCandidateClues({ ...ctx, solution: ctx.solution }, seed);
  return [
    ...candidates.anchors.time.slice(0, 2),
    ...candidates.anchors.location.slice(0, 2),
    ...candidates.anchors.object.slice(0, 2),
  ];
}
