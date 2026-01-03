/**
 * Solution Generator - V1.0 Ruleset + Deductive Logic Edition
 * 
 * Section 6: Final Question Rules
 * - The answer must be inevitable (deducible before asked)
 * - Only ask Person at Location/Time/Object questions
 * 
 * Deductive Logic Edition:
 * - Final question is picked FIRST before clue generation
 * - No clue may directly reveal the answer
 * - Answer must require cross-category deduction
 */

import { AlibiSolution, AlibiClue, FinalQuestion, FinalQuestionType } from './types';
import { 
  PERSON_NAMES, 
  LOCATION_POOL, 
  TIME_POOL, 
  OBJECT_POOL,
  pickDistinct,
  sortTimes,
  seededShuffle
} from './entityPools';
import { simulateHumanSolve, SolveResult } from './humanLogicSolver';

export interface PuzzleEntities {
  people: string[];
  locations: string[];
  times: string[];
  objects: string[];
}

export function generateEntities(seed: number): PuzzleEntities {
  const people = pickDistinct(PERSON_NAMES, 4, seed);
  const locations = pickDistinct(LOCATION_POOL, 4, seed + 1000);
  const times = sortTimes(pickDistinct(TIME_POOL, 4, seed + 2000));
  const objects = pickDistinct(OBJECT_POOL, 4, seed + 3000);

  return { people, locations, times, objects };
}

export function generateSolution(entities: PuzzleEntities, seed: number): AlibiSolution {
  const { people, locations, times, objects } = entities;

  // Shuffle each category to create random assignments
  const shuffledLocations = seededShuffle(locations, seed + 4000);
  const shuffledTimes = seededShuffle(times, seed + 5000);
  const shuffledObjects = seededShuffle(objects, seed + 6000);

  const personToLocation: Record<string, string> = {};
  const personToTime: Record<string, string> = {};
  const personToObject: Record<string, string> = {};

  people.forEach((person, i) => {
    personToLocation[person] = shuffledLocations[i];
    personToTime[person] = shuffledTimes[i];
    personToObject[person] = shuffledObjects[i];
  });

  return {
    personToLocation,
    personToTime,
    personToObject,
  };
}

// Seeded random helper
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface FinalQuestionCandidate {
  question: string;
  answer: string;
  type: FinalQuestionType;
  targetCategory: 'location' | 'time' | 'object';
  targetValue: string;
  isNegative?: boolean;
}

/**
 * Generate all possible final questions for a puzzle
 * Called FIRST before clue selection to establish protected answer
 * V3.0: Includes negative question types for Hard mode
 */
export function generateFinalQuestionCandidates(
  entities: PuzzleEntities,
  solution: AlibiSolution,
  includeNegative: boolean = false
): FinalQuestionCandidate[] {
  const candidates: FinalQuestionCandidate[] = [];

  // Location questions
  for (const location of entities.locations) {
    const answer = Object.entries(solution.personToLocation)
      .find(([, loc]) => loc === location)?.[0];
    if (answer) {
      candidates.push({
        question: `Who was at the ${location}?`,
        answer,
        type: 'person_at_location',
        targetCategory: 'location',
        targetValue: location,
      });
    }
  }

  // Time questions
  for (const time of entities.times) {
    const answer = Object.entries(solution.personToTime)
      .find(([, t]) => t === time)?.[0];
    if (answer) {
      candidates.push({
        question: `Who was seen at ${time}?`,
        answer,
        type: 'person_at_time',
        targetCategory: 'time',
        targetValue: time,
      });
    }
  }

  // Object questions
  for (const object of entities.objects) {
    const answer = Object.entries(solution.personToObject)
      .find(([, obj]) => obj === object)?.[0];
    if (answer) {
      candidates.push({
        question: `Who had the ${object}?`,
        answer,
        type: 'person_with_object',
        targetCategory: 'object',
        targetValue: object,
      });
    }
  }

  // V3.0: Add "Who arrived last?" and "Who arrived first?" questions
  const sortedByTime = [...entities.people].sort((a, b) => {
    const timeA = entities.times.indexOf(solution.personToTime[a]);
    const timeB = entities.times.indexOf(solution.personToTime[b]);
    return timeA - timeB;
  });

  const firstPerson = sortedByTime[0];
  const lastPerson = sortedByTime[sortedByTime.length - 1];

  candidates.push({
    question: `Who arrived first?`,
    answer: firstPerson,
    type: 'who_arrived_first',
    targetCategory: 'time',
    targetValue: solution.personToTime[firstPerson],
  });

  candidates.push({
    question: `Who arrived last?`,
    answer: lastPerson,
    type: 'who_arrived_last',
    targetCategory: 'time',
    targetValue: solution.personToTime[lastPerson],
  });

  // V3.0: Negative questions for Hard mode
  if (includeNegative) {
    // "Who could NOT have had the X?" - answer is everyone except the actual owner
    // We phrase it as "Who definitely did NOT have the X?" where answer is first non-owner
    for (const object of entities.objects) {
      const owner = Object.entries(solution.personToObject)
        .find(([, obj]) => obj === object)?.[0];
      if (owner) {
        // The "answer" for a negative question is the owner (the one who DID have it)
        // The question asks who didn't - but we need one answer for validation
        // So we use the owner as the "protected" answer still
        candidates.push({
          question: `Who could NOT have had the ${object}?`,
          answer: owner, // Protected answer is still the owner
          type: 'person_not_with_object',
          targetCategory: 'object',
          targetValue: object,
          isNegative: true,
        });
      }
    }

    // "Who was NOT at the X?"
    for (const location of entities.locations) {
      const occupant = Object.entries(solution.personToLocation)
        .find(([, loc]) => loc === location)?.[0];
      if (occupant) {
        candidates.push({
          question: `Who was NOT at the ${location}?`,
          answer: occupant,
          type: 'person_not_at_location',
          targetCategory: 'location',
          targetValue: location,
          isNegative: true,
        });
      }
    }
  }

  return candidates;
}

/**
 * Pick a final question for the puzzle
 * This is called FIRST, before clue generation
 * V3.0: Supports difficulty-based question selection
 */
export function pickFinalQuestion(
  entities: PuzzleEntities,
  solution: AlibiSolution,
  seed: number,
  preferNegative: boolean = false
): FinalQuestion | null {
  const candidates = generateFinalQuestionCandidates(entities, solution, preferNegative);
  if (candidates.length === 0) return null;

  // Shuffle and pick one
  const rand = seededRandom(seed + 7000);
  
  // V3.0: For Hard mode, prefer negative questions
  let shuffled = [...candidates].sort(() => rand() - 0.5);
  
  if (preferNegative) {
    // Move negative questions to the front
    const negative = shuffled.filter(c => c.isNegative);
    const positive = shuffled.filter(c => !c.isNegative);
    shuffled = [...negative, ...positive];
  }
  
  const chosen = shuffled[0];
  return {
    type: chosen.type,
    targetCategory: chosen.targetCategory,
    targetValue: chosen.targetValue,
    questionText: chosen.question,
    answer: chosen.answer,
    isNegative: chosen.isNegative,
  };
}

/**
 * Generate final question with inevitability validation (Section 6)
 * The answer must be deducible from clues before the question is asked
 * 
 * Note: This is now a validation function, as the question is picked first
 */
export function generateFinalQuestion(
  entities: PuzzleEntities,
  solution: AlibiSolution,
  clues: AlibiClue[],
  seed: number
): { question: string; answer: string } | null {
  const candidates = generateFinalQuestionCandidates(entities, solution);
  if (candidates.length === 0) return null;

  const rand = seededRandom(seed);
  const shuffled = [...candidates].sort(() => rand() - 0.5);

  // Validate inevitability: After solving, only one person should be possible
  for (const candidate of shuffled) {
    const finalQuestion: FinalQuestion = {
      type: candidate.type,
      targetCategory: candidate.targetCategory,
      targetValue: candidate.targetValue,
      questionText: candidate.question,
      answer: candidate.answer,
    };

    if (validateQuestionInevitability(candidate, entities, solution, clues, finalQuestion)) {
      return {
        question: candidate.question,
        answer: candidate.answer,
      };
    }
  }

  // If no inevitable question found, return the first one (fallback)
  if (candidates.length > 0) {
    return {
      question: candidates[0].question,
      answer: candidates[0].answer,
    };
  }

  return null;
}

/**
 * Validate that the question answer is inevitable given the clues
 * Also validates deduction depth and cross-category requirements
 */
function validateQuestionInevitability(
  candidate: FinalQuestionCandidate,
  entities: PuzzleEntities,
  solution: AlibiSolution,
  clues: AlibiClue[],
  finalQuestion: FinalQuestion
): boolean {
  // Run human solver to get the deduced state
  const solveResult = simulateHumanSolve({
    id: 'test',
    index: 0,
    people: entities.people,
    locations: entities.locations,
    times: entities.times,
    objects: entities.objects,
    solution,
    clues,
    finalQuestion: candidate.question,
    finalAnswerPerson: candidate.answer,
  }, finalQuestion);

  if (!solveResult.solvable) return false;

  // Check that the solve result confirms the answer
  const confirmSteps = solveResult.steps.filter(s => s.type === 'confirm');
  
  // Find the confirmation for this question
  const gridType = candidate.targetCategory;
  const relevantConfirm = confirmSteps.find(
    s => s.grid === gridType && s.value === candidate.targetValue
  );

  // The answer must be confirmed before we ask
  if (relevantConfirm?.person !== candidate.answer) return false;

  // Validate deduction depth (answer needs ≥2 deductions)
  const answerStep = solveResult.answerRevealedAtStep ?? 0;
  if (answerStep < 2) return false;

  // Validate cross-category reasoning was used
  if (!solveResult.crossCategoryUsedForAnswer) return false;

  return true;
}

// Legacy version without clues parameter (for backward compatibility)
export function generateFinalQuestionLegacy(
  entities: PuzzleEntities,
  solution: AlibiSolution,
  seed: number
): { question: string; answer: string } {
  const rand = seededRandom(seed);

  const questionTypes = [
    () => {
      const obj = entities.objects[Math.floor(rand() * entities.objects.length)];
      const answer = Object.entries(solution.personToObject)
        .find(([_, o]) => o === obj)?.[0] || '';
      return { question: `Who had the ${obj}?`, answer };
    },
    () => {
      const loc = entities.locations[Math.floor(rand() * entities.locations.length)];
      const answer = Object.entries(solution.personToLocation)
        .find(([_, l]) => l === loc)?.[0] || '';
      return { question: `Who was at the ${loc}?`, answer };
    },
    () => {
      const time = entities.times[Math.floor(rand() * entities.times.length)];
      const answer = Object.entries(solution.personToTime)
        .find(([_, t]) => t === time)?.[0] || '';
      return { question: `Who was seen at ${time}?`, answer };
    },
  ];

  const questionType = questionTypes[Math.floor(rand() * questionTypes.length)];
  return questionType();
}
