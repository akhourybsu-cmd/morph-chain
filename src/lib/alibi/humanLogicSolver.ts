/**
 * Human Logic Solver - V1.0 Ruleset + Deductive Logic Edition
 * 
 * Simulates human deduction step-by-step.
 * At every step, there must be at least one forced deduction.
 * No guessing, backtracking, or hypothesis testing allowed.
 * 
 * Deductive Logic Edition Additions:
 * - Tracks when the final answer becomes known
 * - Validates cross-category deduction requirement
 * - Ensures answer is not known from anchors alone
 */

import { AlibiClue, AlibiPuzzle, DeductionStep, CellState, FinalQuestion } from './types';

interface SolverGrid {
  cells: Record<string, Record<string, CellState>>;
}

interface SolverState {
  location: SolverGrid;
  time: SolverGrid;
  object: SolverGrid;
}

interface ParsedConstraint {
  type: 'confirm' | 'eliminate' | 'relative' | 'cross';
  grid?: 'location' | 'time' | 'object';
  person?: string;
  value?: string;
  person2?: string;
  location?: string;
  object?: string;
  direction?: 'before' | 'after';
  gap?: number;
}

export interface SolveResult {
  solvable: boolean;
  steps: DeductionStep[];
  stuckAt?: number;
  // Deductive Logic Edition tracking
  answerRevealedAtStep?: number;
  crossCategoryUsedForAnswer?: boolean;
  categoriesUsedBeforeAnswer?: Set<string>;
}

// Initialize empty grids
function initializeState(people: string[], locations: string[], times: string[], objects: string[]): SolverState {
  const createGrid = (rows: string[], cols: string[]): SolverGrid => {
    const cells: Record<string, Record<string, CellState>> = {};
    for (const row of rows) {
      cells[row] = {};
      for (const col of cols) {
        cells[row][col] = 'unknown';
      }
    }
    return { cells };
  };

  return {
    location: createGrid(people, locations),
    time: createGrid(people, times),
    object: createGrid(people, objects),
  };
}

// Parse clue text into constraints
function parseClue(clue: AlibiClue, entities: {
  people: string[];
  locations: string[];
  times: string[];
  objects: string[];
}): ParsedConstraint[] {
  const constraints: ParsedConstraint[] = [];
  const text = clue.text;

  // Direct positive: Person at location
  for (const person of entities.people) {
    for (const location of entities.locations) {
      if (text.includes(`${person} was at the ${location}`) ||
          text.includes(`${person} visited the ${location}`) ||
          text.includes(`${person} spent time at the ${location}`)) {
        constraints.push({ type: 'confirm', grid: 'location', person, value: location });
      }
    }
  }

  // Direct positive: Person had object
  for (const person of entities.people) {
    for (const object of entities.objects) {
      if (text.includes(`${person} had the ${object}`) ||
          text.includes(`${person} was carrying the ${object}`) ||
          text === `The ${object} belonged to ${person}.`) {
        constraints.push({ type: 'confirm', grid: 'object', person, value: object });
      }
    }
  }

  // Direct positive: Person at time
  for (const person of entities.people) {
    for (const time of entities.times) {
      if (text.includes(`${person} was seen at ${time}`) ||
          text.includes(`${person} arrived at ${time}`)) {
        constraints.push({ type: 'confirm', grid: 'time', person, value: time });
      }
    }
  }

  // Object at location (cross-category)
  for (const object of entities.objects) {
    for (const location of entities.locations) {
      if (text.includes(`The ${object} was seen at the ${location}`) ||
          text.includes(`Someone with the ${object} was at the ${location}`)) {
        constraints.push({ type: 'cross', object, location });
      }
    }
  }

  // Direct negative: Person wasn't at locations
  const wasntAtMatch = text.match(/^(\w+) wasn't at the (\w+) or the (\w+)\.$/);
  if (wasntAtMatch) {
    const [, person, loc1, loc2] = wasntAtMatch;
    if (entities.people.includes(person)) {
      if (entities.locations.includes(loc1)) {
        constraints.push({ type: 'eliminate', grid: 'location', person, value: loc1 });
      }
      if (entities.locations.includes(loc2)) {
        constraints.push({ type: 'eliminate', grid: 'location', person, value: loc2 });
      }
    }
  }

  // Direct negative: Person didn't have object(s)
  const didNotHaveMatch = text.match(/^(\w+) did not have the (\w+)\.$/);
  if (didNotHaveMatch) {
    const [, person, object] = didNotHaveMatch;
    if (entities.people.includes(person) && entities.objects.includes(object)) {
      constraints.push({ type: 'eliminate', grid: 'object', person, value: object });
    }
  }

  // Direct negative: Person didn't have two objects
  const didNotHaveTwoMatch = text.match(/^(\w+) did not have the (\w+) or the (\w+)\.$/);
  if (didNotHaveTwoMatch) {
    const [, person, obj1, obj2] = didNotHaveTwoMatch;
    if (entities.people.includes(person)) {
      if (entities.objects.includes(obj1)) {
        constraints.push({ type: 'eliminate', grid: 'object', person, value: obj1 });
      }
      if (entities.objects.includes(obj2)) {
        constraints.push({ type: 'eliminate', grid: 'object', person, value: obj2 });
      }
    }
  }

  // Direct negative: Person wasn't at time
  for (const person of entities.people) {
    for (const time of entities.times) {
      if (text === `${person} wasn't seen at ${time}.`) {
        constraints.push({ type: 'eliminate', grid: 'time', person, value: time });
      }
    }
  }

  // Direct negative: Person wasn't at two times
  const wasntAtTimeMatch = text.match(/^(\w+) wasn't seen at (.+) or (.+)\.$/);
  if (wasntAtTimeMatch) {
    const [, person, time1, time2] = wasntAtTimeMatch;
    if (entities.people.includes(person)) {
      if (entities.times.includes(time1)) {
        constraints.push({ type: 'eliminate', grid: 'time', person, value: time1 });
      }
      if (entities.times.includes(time2)) {
        constraints.push({ type: 'eliminate', grid: 'time', person, value: time2 });
      }
    }
  }

  // Relational: Person arrived earlier/later than Person2
  const earlierMatch = text.match(/^(\w+) arrived earlier than (\w+)\.$/);
  if (earlierMatch) {
    const [, p1, p2] = earlierMatch;
    if (entities.people.includes(p1) && entities.people.includes(p2)) {
      constraints.push({ type: 'relative', person: p1, person2: p2, direction: 'before' });
    }
  }

  const laterMatch = text.match(/^(\w+) arrived later than (\w+)\.$/);
  if (laterMatch) {
    const [, p1, p2] = laterMatch;
    if (entities.people.includes(p1) && entities.people.includes(p2)) {
      constraints.push({ type: 'relative', person: p1, person2: p2, direction: 'after' });
    }
  }

  // Exact time gap
  const exactGapMatch = text.match(/^(\w+) arrived exactly (\d+) time slots? before (\w+)\.$/);
  if (exactGapMatch) {
    const [, p1, gapStr, p2] = exactGapMatch;
    if (entities.people.includes(p1) && entities.people.includes(p2)) {
      constraints.push({ type: 'relative', person: p1, person2: p2, direction: 'before', gap: parseInt(gapStr) });
    }
  }

  // Chained order: P1 before P2, who before P3
  const chainedMatch = text.match(/^(\w+) arrived before (\w+), who arrived before (\w+)\.$/);
  if (chainedMatch) {
    const [, p1, p2, p3] = chainedMatch;
    if (entities.people.includes(p1) && entities.people.includes(p2) && entities.people.includes(p3)) {
      constraints.push({ type: 'relative', person: p1, person2: p2, direction: 'before' });
      constraints.push({ type: 'relative', person: p2, person2: p3, direction: 'before' });
    }
  }

  return constraints;
}

// Get all values in a grid for a person
function getRowState(grid: SolverGrid, person: string): Record<string, CellState> {
  return grid.cells[person] || {};
}

// Get all persons for a value in a grid
function getColState(grid: SolverGrid, value: string, people: string[]): Record<string, CellState> {
  const result: Record<string, CellState> = {};
  for (const person of people) {
    result[person] = grid.cells[person]?.[value] || 'unknown';
  }
  return result;
}

// Count unknowns in a row/column
function countUnknowns(states: Record<string, CellState>): number {
  return Object.values(states).filter(s => s === 'unknown').length;
}

// Find the only unknown in a row/column
function findOnlyUnknown(states: Record<string, CellState>): string | null {
  const unknowns = Object.entries(states).filter(([, s]) => s === 'unknown');
  return unknowns.length === 1 ? unknowns[0][0] : null;
}

// Check if a cell is confirmed
function isConfirmed(grid: SolverGrid, person: string, value: string): boolean {
  return grid.cells[person]?.[value] === 'confirmed';
}

// Apply a deduction to the state
function applyDeduction(state: SolverState, step: DeductionStep): void {
  const grid = state[step.grid];
  if (step.type === 'confirm') {
    grid.cells[step.person][step.value] = 'confirmed';
  } else {
    grid.cells[step.person][step.value] = 'ruled_out';
  }
}

// Find forced deductions from one-to-one constraints
function findOneToOneDeductions(
  state: SolverState,
  grid: 'location' | 'time' | 'object',
  people: string[],
  values: string[]
): DeductionStep[] {
  const steps: DeductionStep[] = [];
  const solverGrid = state[grid];

  // Check each row (person) - if only one unknown and no confirmed, confirm it
  for (const person of people) {
    const row = getRowState(solverGrid, person);
    const hasConfirmed = Object.values(row).some(s => s === 'confirmed');
    if (!hasConfirmed) {
      const onlyUnknown = findOnlyUnknown(row);
      if (onlyUnknown) {
        steps.push({
          type: 'confirm',
          grid,
          person,
          value: onlyUnknown,
          reasoning: `Only remaining option for ${person} in ${grid} grid`,
        });
      }
    }
  }

  // Check each column (value) - if only one unknown and no confirmed, confirm it
  for (const value of values) {
    const col = getColState(solverGrid, value, people);
    const hasConfirmed = Object.values(col).some(s => s === 'confirmed');
    if (!hasConfirmed) {
      const onlyUnknown = findOnlyUnknown(col);
      if (onlyUnknown) {
        steps.push({
          type: 'confirm',
          grid,
          person: onlyUnknown,
          value,
          reasoning: `Only remaining person for ${value} in ${grid} grid`,
        });
      }
    }
  }

  // Eliminate cells in same row/column as confirmed
  for (const person of people) {
    for (const value of values) {
      if (solverGrid.cells[person][value] === 'confirmed') {
        // Eliminate other values in this person's row
        for (const otherValue of values) {
          if (otherValue !== value && solverGrid.cells[person][otherValue] === 'unknown') {
            steps.push({
              type: 'eliminate',
              grid,
              person,
              value: otherValue,
              reasoning: `${person} already confirmed for ${value}`,
            });
          }
        }
        // Eliminate other persons in this value's column
        for (const otherPerson of people) {
          if (otherPerson !== person && solverGrid.cells[otherPerson][value] === 'unknown') {
            steps.push({
              type: 'eliminate',
              grid,
              person: otherPerson,
              value,
              reasoning: `${value} already confirmed for ${person}`,
            });
          }
        }
      }
    }
  }

  return steps;
}

// Find forced deductions from clue constraints
function findClueDeductions(
  state: SolverState,
  clues: AlibiClue[],
  entities: {
    people: string[];
    locations: string[];
    times: string[];
    objects: string[];
  }
): DeductionStep[] {
  const steps: DeductionStep[] = [];

  for (const clue of clues) {
    const constraints = parseClue(clue, entities);
    
    for (const constraint of constraints) {
      if (constraint.type === 'confirm' && constraint.grid && constraint.person && constraint.value) {
        const grid = state[constraint.grid];
        if (grid.cells[constraint.person][constraint.value] === 'unknown') {
          steps.push({
            type: 'confirm',
            grid: constraint.grid,
            person: constraint.person,
            value: constraint.value,
            reasoning: `Direct anchor: "${clue.text}"`,
            clueId: clue.id,
          });
        }
      }
      
      if (constraint.type === 'eliminate' && constraint.grid && constraint.person && constraint.value) {
        const grid = state[constraint.grid];
        if (grid.cells[constraint.person][constraint.value] === 'unknown') {
          steps.push({
            type: 'eliminate',
            grid: constraint.grid,
            person: constraint.person,
            value: constraint.value,
            reasoning: `Direct negative: "${clue.text}"`,
            clueId: clue.id,
          });
        }
      }

      // Cross-category: object at location
      if (constraint.type === 'cross' && constraint.object && constraint.location) {
        const objectGrid = state.object;
        const locationGrid = state.location;
        
        for (const person of entities.people) {
          if (objectGrid.cells[person][constraint.object] === 'confirmed') {
            if (locationGrid.cells[person][constraint.location] === 'unknown') {
              steps.push({
                type: 'confirm',
                grid: 'location',
                person,
                value: constraint.location,
                reasoning: `Cross-category: ${person} has ${constraint.object}, which was at ${constraint.location}`,
                clueId: clue.id,
              });
            }
          }
          if (locationGrid.cells[person][constraint.location] === 'confirmed') {
            if (objectGrid.cells[person][constraint.object] === 'unknown') {
              steps.push({
                type: 'confirm',
                grid: 'object',
                person,
                value: constraint.object,
                reasoning: `Cross-category: ${person} was at ${constraint.location}, where the ${constraint.object} was`,
                clueId: clue.id,
              });
            }
          }
        }
      }

      // Relative time constraints
      if (constraint.type === 'relative' && constraint.person && constraint.person2) {
        const timeGrid = state.time;
        const p1 = constraint.person;
        const p2 = constraint.person2;
        const times = entities.times;

        // If p2's time is confirmed and p1 must be before
        if (constraint.direction === 'before') {
          const p2Time = times.find(t => timeGrid.cells[p2][t] === 'confirmed');
          if (p2Time) {
            const p2Index = times.indexOf(p2Time);
            // p1 must be before p2, so eliminate all times >= p2's time
            for (let i = p2Index; i < times.length; i++) {
              if (timeGrid.cells[p1][times[i]] === 'unknown') {
                steps.push({
                  type: 'eliminate',
                  grid: 'time',
                  person: p1,
                  value: times[i],
                  reasoning: `${p1} arrived before ${p2} (at ${p2Time})`,
                  clueId: clue.id,
                });
              }
            }
          }
          // If p1's time is confirmed
          const p1Time = times.find(t => timeGrid.cells[p1][t] === 'confirmed');
          if (p1Time) {
            const p1Index = times.indexOf(p1Time);
            // p2 must be after p1, so eliminate all times <= p1's time
            for (let i = 0; i <= p1Index; i++) {
              if (timeGrid.cells[p2][times[i]] === 'unknown') {
                steps.push({
                  type: 'eliminate',
                  grid: 'time',
                  person: p2,
                  value: times[i],
                  reasoning: `${p2} arrived after ${p1} (at ${p1Time})`,
                  clueId: clue.id,
                });
              }
            }
          }
        }

        if (constraint.direction === 'after') {
          const p2Time = times.find(t => timeGrid.cells[p2][t] === 'confirmed');
          if (p2Time) {
            const p2Index = times.indexOf(p2Time);
            // p1 must be after p2, so eliminate all times <= p2's time
            for (let i = 0; i <= p2Index; i++) {
              if (timeGrid.cells[p1][times[i]] === 'unknown') {
                steps.push({
                  type: 'eliminate',
                  grid: 'time',
                  person: p1,
                  value: times[i],
                  reasoning: `${p1} arrived after ${p2} (at ${p2Time})`,
                  clueId: clue.id,
                });
              }
            }
          }
        }

        // Exact gap handling
        if (constraint.gap !== undefined && constraint.direction === 'before') {
          const p2Time = times.find(t => timeGrid.cells[p2][t] === 'confirmed');
          if (p2Time) {
            const p2Index = times.indexOf(p2Time);
            const p1Index = p2Index - constraint.gap;
            if (p1Index >= 0 && p1Index < times.length) {
              if (timeGrid.cells[p1][times[p1Index]] === 'unknown') {
                steps.push({
                  type: 'confirm',
                  grid: 'time',
                  person: p1,
                  value: times[p1Index],
                  reasoning: `${p1} arrived exactly ${constraint.gap} slot(s) before ${p2}`,
                  clueId: clue.id,
                });
              }
            }
          }
        }
      }
    }
  }

  return steps;
}

// Check if puzzle is solved
function isSolved(state: SolverState, people: string[]): boolean {
  for (const grid of ['location', 'time', 'object'] as const) {
    for (const person of people) {
      const row = state[grid].cells[person];
      const hasConfirmed = Object.values(row).some(s => s === 'confirmed');
      if (!hasConfirmed) return false;
    }
  }
  return true;
}

// Remove duplicate steps
function deduplicateSteps(steps: DeductionStep[]): DeductionStep[] {
  const seen = new Set<string>();
  return steps.filter(step => {
    const key = `${step.type}-${step.grid}-${step.person}-${step.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Check if the final answer is known at current state
 */
function isAnswerKnown(
  state: SolverState,
  targetCategory: 'location' | 'time' | 'object',
  targetValue: string,
  people: string[]
): { known: boolean; answer?: string } {
  const grid = state[targetCategory];
  const col = getColState(grid, targetValue, people);
  
  // Check if someone is confirmed for this value
  const confirmed = Object.entries(col).find(([, s]) => s === 'confirmed');
  if (confirmed) {
    return { known: true, answer: confirmed[0] };
  }
  
  // Check if only one person remains unknown (all others eliminated)
  const unknowns = Object.entries(col).filter(([, s]) => s === 'unknown');
  if (unknowns.length === 1) {
    return { known: true, answer: unknowns[0][0] };
  }
  
  return { known: false };
}

/**
 * Main human logic solver with answer tracking
 * Returns solvable=true only if puzzle can be solved with forced deductions only
 */
export function simulateHumanSolve(
  puzzle: AlibiPuzzle,
  trackFinalAnswer?: FinalQuestion
): SolveResult {
  const { people, locations, times, objects, clues } = puzzle;
  const entities = { people, locations, times, objects };
  
  const state = initializeState(people, locations, times, objects);
  const allSteps: DeductionStep[] = [];
  const categoriesUsed = new Set<string>();
  
  let answerRevealedAtStep: number | undefined;
  let crossCategoryUsedForAnswer = false;
  
  const MAX_ITERATIONS = 100;
  let iteration = 0;
  let confirmCount = 0;
  
  while (!isSolved(state, people) && iteration < MAX_ITERATIONS) {
    iteration++;
    
    // Find all possible forced deductions
    const clueSteps = findClueDeductions(state, clues, entities);
    const locationSteps = findOneToOneDeductions(state, 'location', people, locations);
    const timeSteps = findOneToOneDeductions(state, 'time', people, times);
    const objectSteps = findOneToOneDeductions(state, 'object', people, objects);
    
    const allPossible = deduplicateSteps([
      ...clueSteps,
      ...locationSteps,
      ...timeSteps,
      ...objectSteps,
    ]);
    
    // Filter to only new deductions (not already applied)
    const newSteps = allPossible.filter(step => {
      const currentState = state[step.grid].cells[step.person][step.value];
      if (step.type === 'confirm') return currentState === 'unknown';
      if (step.type === 'eliminate') return currentState === 'unknown';
      return false;
    });
    
    if (newSteps.length === 0) {
      // No forced deduction available - stuck!
      return {
        solvable: false,
        steps: allSteps,
        stuckAt: allSteps.length,
        answerRevealedAtStep,
        crossCategoryUsedForAnswer,
        categoriesUsedBeforeAnswer: categoriesUsed,
      };
    }
    
    // Apply all new deductions
    for (const step of newSteps) {
      applyDeduction(state, step);
      allSteps.push(step);
      
      // Track which categories are being used
      categoriesUsed.add(step.grid);
      
      if (step.type === 'confirm') {
        confirmCount++;
      }
      
      // Track when answer is revealed (if tracking)
      if (trackFinalAnswer && answerRevealedAtStep === undefined) {
        const answerCheck = isAnswerKnown(
          state, 
          trackFinalAnswer.targetCategory, 
          trackFinalAnswer.targetValue, 
          people
        );
        if (answerCheck.known && answerCheck.answer === trackFinalAnswer.answer) {
          answerRevealedAtStep = confirmCount;
          // Check if cross-category reasoning was used
          crossCategoryUsedForAnswer = categoriesUsed.has(
            trackFinalAnswer.targetCategory === 'location' ? 'object' :
            trackFinalAnswer.targetCategory === 'object' ? 'location' :
            'location'  // For time, check if location or object was used
          ) || categoriesUsed.has(
            trackFinalAnswer.targetCategory === 'time' ? 'object' : 
            'time'
          );
        }
      }
    }
  }
  
  const solved = isSolved(state, people);
  
  return {
    solvable: solved,
    steps: allSteps,
    stuckAt: solved ? undefined : allSteps.length,
    answerRevealedAtStep,
    crossCategoryUsedForAnswer,
    categoriesUsedBeforeAnswer: categoriesUsed,
  };
}

/**
 * Count forced moves (confirm steps only, as they represent "aha" moments)
 */
export function countForcedMoves(steps: DeductionStep[]): number {
  return steps.filter(s => s.type === 'confirm').length;
}

/**
 * Validate that solution matches expected
 */
export function validateSolverResult(
  steps: DeductionStep[],
  expectedSolution: AlibiPuzzle['solution'],
  people: string[]
): boolean {
  // Build solution from steps
  const derived: Record<string, Record<string, string>> = {
    location: {},
    time: {},
    object: {},
  };
  
  for (const step of steps) {
    if (step.type === 'confirm') {
      derived[step.grid][step.person] = step.value;
    }
  }
  
  // Compare with expected
  for (const person of people) {
    if (derived.location[person] !== expectedSolution.personToLocation[person]) return false;
    if (derived.time[person] !== expectedSolution.personToTime[person]) return false;
    if (derived.object[person] !== expectedSolution.personToObject[person]) return false;
  }
  
  return true;
}

/**
 * Check if a clue directly reveals the final answer
 * Used for answer obfuscation validation
 */
export function clueRevealsAnswer(
  clue: AlibiClue,
  finalQuestion: FinalQuestion
): boolean {
  const { targetCategory, targetValue, answer } = finalQuestion;
  
  // Check if clue directly links answer person to target value
  if (clue.entities?.people?.includes(answer)) {
    if (targetCategory === 'time' && clue.entities?.times?.includes(targetValue)) {
      return clue.tier === 'anchor' && clue.category === 'time';
    }
    if (targetCategory === 'location' && clue.entities?.locations?.includes(targetValue)) {
      return clue.tier === 'anchor' && clue.category === 'location';
    }
    if (targetCategory === 'object' && clue.entities?.objects?.includes(targetValue)) {
      return clue.tier === 'anchor' && clue.category === 'object';
    }
  }
  
  return false;
}

/**
 * Validate cross-category deduction requirement
 * Returns true if at least one deduction before the answer uses a different category
 */
export function validateCrossCategoryDeduction(
  steps: DeductionStep[],
  answerRevealedAtStep: number,
  questionCategory: 'location' | 'time' | 'object'
): boolean {
  // Look at all steps up to (not including) the answer reveal
  const relevantSteps = steps.slice(0, answerRevealedAtStep);
  
  // Check if any step used a different category
  for (const step of relevantSteps) {
    if (step.grid !== questionCategory) {
      return true;
    }
  }
  
  return false;
}
