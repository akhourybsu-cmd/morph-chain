import { AlibiClue, AlibiSolution, Difficulty } from './types';
import { generateCandidateClues, getCluesByType } from './clueTemplates';
import { countValidSolutions, checkSolutionAgainstClues } from './constraintSolver';
import { seededShuffle } from './entityPools';

interface ClueSelectionContext {
  people: string[];
  locations: string[];
  times: string[];
  objects: string[];
  solution: AlibiSolution;
}

export function selectMinimalClueSet(
  ctx: ClueSelectionContext,
  seed: number,
  targetDifficulty: Difficulty = 'medium'
): AlibiClue[] {
  const candidateClues = generateCandidateClues(ctx, seed);
  
  // Separate clues by type for balanced selection
  const directPositive = getCluesByType(candidateClues, 'direct_positive');
  const directNegative = getCluesByType(candidateClues, 'direct_negative');
  const relational = getCluesByType(candidateClues, 'relational');

  // Shuffle each type
  const shuffledPositive = seededShuffle(directPositive, seed + 100);
  const shuffledNegative = seededShuffle(directNegative, seed + 200);
  const shuffledRelational = seededShuffle(relational, seed + 300);

  const selectedClues: AlibiClue[] = [];
  const entities = {
    people: ctx.people,
    locations: ctx.locations,
    times: ctx.times,
    objects: ctx.objects,
  };

  // Start with a mix of clue types
  const cluePool = [
    ...shuffledPositive.slice(0, 8),
    ...shuffledNegative.slice(0, 6),
    ...shuffledRelational.slice(0, 4),
  ];

  // Shuffle the mixed pool
  const shuffledPool = seededShuffle(cluePool, seed + 400);

  // Add clues until we have exactly one solution
  for (const clue of shuffledPool) {
    // Verify this clue is consistent with the solution
    if (!checkSolutionAgainstClues(ctx.solution, [clue], entities)) {
      continue;
    }

    selectedClues.push(clue);

    // Check if we have a unique solution
    const solutionCount = countValidSolutions(selectedClues, entities);
    
    if (solutionCount === 1) {
      break;
    }
  }

  // If we still don't have a unique solution, add more clues
  if (countValidSolutions(selectedClues, entities) !== 1) {
    const remainingClues = shuffledPool.filter(c => !selectedClues.includes(c));
    for (const clue of remainingClues) {
      if (!checkSolutionAgainstClues(ctx.solution, [clue], entities)) {
        continue;
      }
      selectedClues.push(clue);
      if (countValidSolutions(selectedClues, entities) === 1) {
        break;
      }
    }
  }

  // Try to remove redundant clues (makes puzzle harder)
  if (targetDifficulty === 'hard') {
    const minimalClues = removeRedundantClues(selectedClues, entities);
    return minimalClues;
  }

  // For easy/medium, keep a few extra clues
  return selectedClues;
}

function removeRedundantClues(clues: AlibiClue[], entities: {
  people: string[];
  locations: string[];
  times: string[];
  objects: string[];
}): AlibiClue[] {
  const result = [...clues];

  for (let i = result.length - 1; i >= 0; i--) {
    const testClues = [...result.slice(0, i), ...result.slice(i + 1)];
    if (testClues.length === 0) continue;

    const solutionCount = countValidSolutions(testClues, entities);
    if (solutionCount === 1) {
      // This clue was redundant
      result.splice(i, 1);
    }
  }

  return result;
}

export function estimateDifficulty(clueCount: number): Difficulty {
  if (clueCount <= 5) return 'hard';
  if (clueCount <= 7) return 'medium';
  return 'easy';
}
