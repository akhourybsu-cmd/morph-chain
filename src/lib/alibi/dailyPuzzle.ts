import { AlibiPuzzle, Difficulty } from './types';
import { generateEntities, generateSolution, generateFinalQuestion } from './solutionGenerator';
import { selectMinimalClueSet, estimateDifficulty } from './clueSelection';

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

export function generateDailyPuzzle(dateStr: string): AlibiPuzzle {
  const seed = dateToSeed(dateStr);
  const index = getPuzzleIndex(dateStr);

  // Generate entities and solution
  const entities = generateEntities(seed);
  const solution = generateSolution(entities, seed);

  // Select clues
  const clues = selectMinimalClueSet(
    { ...entities, solution },
    seed,
    'medium'
  );

  // Generate final question
  const { question, answer } = generateFinalQuestion(entities, solution, seed);

  // Estimate difficulty based on clue count
  const difficulty: Difficulty = estimateDifficulty(clues.length);

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
    finalQuestion: question,
    finalAnswerPerson: answer,
  };
}

export function generatePracticePuzzle(): AlibiPuzzle {
  // Use current timestamp as seed for random puzzle
  const seed = Date.now();
  const entities = generateEntities(seed);
  const solution = generateSolution(entities, seed);

  const clues = selectMinimalClueSet(
    { ...entities, solution },
    seed,
    'medium'
  );

  const { question, answer } = generateFinalQuestion(entities, solution, seed);
  const difficulty: Difficulty = estimateDifficulty(clues.length);

  return {
    id: `practice-${seed}`,
    index: 0,
    difficulty,
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

export function getTodayDateStr(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export function loadDailyPuzzle(): AlibiPuzzle {
  const dateStr = getTodayDateStr();
  return generateDailyPuzzle(dateStr);
}
