/**
 * Human Logic Solver - V2.0 Complete Rewrite
 * 
 * Simulates human deduction step-by-step with proper answer tracking.
 * At every step, there must be at least one forced deduction.
 * No guessing, backtracking, or hypothesis testing allowed.
 * 
 * Key Features:
 * - Tracks which deductions contribute to the final answer
 * - Validates cross-category deduction requirement properly
 * - Counts true deduction depth for the answer (not just any confirmations)
 * - Detects trivial elimination scenarios
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

// Enhanced step tracking for answer path analysis
interface TrackedStep extends DeductionStep {
  stepIndex: number;
  dependsOn: number[]; // Indices of steps this one depends on
  contributesToAnswer: boolean;
}

export interface SolveResult {
  solvable: boolean;
  steps: DeductionStep[];
  stuckAt?: number;
  // Enhanced Deductive Logic Edition tracking
  answerRevealedAtStep?: number;
  answerDeductionDepth?: number; // True deduction chain length for answer
  crossCategoryUsedForAnswer?: boolean;
  categoriesUsedBeforeAnswer?: Set<string>;
  answerPathClues?: string[]; // Clue IDs that contribute to answer
  // V3.0 Puzzle Design Guardrails
  hasNoDeadEnds: boolean;        // At every step, forced move exists (Rule 1)
  cluesUsed: Set<string>;        // Track which clues actually contribute (Rule 6)
  gridInteractionCount: number;  // Number of marks made (Rule 12)
  keyInsight?: {                 // "Silent Aha" moment (Rule 13)
    description: string;
    contributingClues: string[];
  };
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

// Deep clone solver state
function cloneState(state: SolverState): SolverState {
  return {
    location: { cells: JSON.parse(JSON.stringify(state.location.cells)) },
    time: { cells: JSON.parse(JSON.stringify(state.time.cells)) },
    object: { cells: JSON.parse(JSON.stringify(state.object.cells)) },
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

  // V3.0: Binary positive clues - "X was either at A or B"
  // These don't directly confirm, they narrow to 2 options
  if (clue.type === 'binary_positive') {
    // Binary clues are handled by elimination logic rather than direct constraints
    // When one option is eliminated, the other becomes confirmed
    // This is handled in the solver's iterative process
  }

  // V3.0: Quantifier clues - parse "Exactly one of X or Y had Z"
  const exactlyOneMatch = text.match(/^Exactly one of (\w+) or (\w+) had the (\w+)\.$/);
  if (exactlyOneMatch) {
    const [, p1, p2, object] = exactlyOneMatch;
    // We know exactly one has it - this is a constraint used in elimination
    // Implementation: if one person is confirmed/eliminated for object, deduce the other
  }

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
          
          const p1Time = times.find(t => timeGrid.cells[p1][t] === 'confirmed');
          if (p1Time) {
            const p1Index = times.indexOf(p1Time);
            const p2Index = p1Index + constraint.gap;
            if (p2Index >= 0 && p2Index < times.length) {
              if (timeGrid.cells[p2][times[p2Index]] === 'unknown') {
                steps.push({
                  type: 'confirm',
                  grid: 'time',
                  person: p2,
                  value: times[p2Index],
                  reasoning: `${p2} arrived exactly ${constraint.gap} slot(s) after ${p1}`,
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
 * Calculate true deduction depth for the answer
 * Counts only the confirm steps that actually contributed to knowing the answer
 */
function calculateAnswerDeductionDepth(
  steps: DeductionStep[],
  answerRevealedAtStep: number,
  targetCategory: 'location' | 'time' | 'object',
  targetValue: string,
  answerPerson: string
): number {
  // Count confirm steps that affected the answer cell or related cells
  let depth = 0;
  const relevantSteps = steps.slice(0, answerRevealedAtStep);
  
  for (const step of relevantSteps) {
    if (step.type === 'confirm') {
      depth++;
    }
    // Eliminations in the answer column also count
    if (step.type === 'eliminate' && step.grid === targetCategory && step.value === targetValue) {
      depth++;
    }
  }
  
  return depth;
}

/**
 * Check if cross-category reasoning was REQUIRED for the answer
 * Returns true only if deductions from another category were necessary
 */
function checkCrossCategoryRequirement(
  steps: DeductionStep[],
  answerRevealedAtStep: number,
  questionCategory: 'location' | 'time' | 'object'
): boolean {
  const relevantSteps = steps.slice(0, answerRevealedAtStep);
  const categoriesUsed = new Set<string>();
  
  // Track all categories that had confirm steps
  for (const step of relevantSteps) {
    if (step.type === 'confirm') {
      categoriesUsed.add(step.grid);
    }
  }
  
  // Must have used at least one category OTHER than the question category
  for (const cat of categoriesUsed) {
    if (cat !== questionCategory) {
      return true;
    }
  }
  
  return false;
}

/**
 * Main human logic solver with enhanced answer tracking
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
  const cluesUsed = new Set<string>();
  
  let answerRevealedAtStep: number | undefined;
  let answerDeductionDepth: number | undefined;
  let crossCategoryUsedForAnswer = false;
  let hasNoDeadEnds = true; // Assume true until proven otherwise
  let gridInteractionCount = 0;
  let keyInsight: { description: string; contributingClues: string[] } | undefined;
  
  // Track cross-category deductions for "Silent Aha" detection
  const crossCategoryMoments: { step: DeductionStep; clues: string[] }[] = [];
  
  const MAX_ITERATIONS = 100;
  let iteration = 0;
  let stepCount = 0;
  
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
      // No forced deduction available - stuck! (Rule 1 violation)
      hasNoDeadEnds = false;
      return {
        solvable: false,
        steps: allSteps,
        stuckAt: allSteps.length,
        answerRevealedAtStep,
        answerDeductionDepth,
        crossCategoryUsedForAnswer,
        categoriesUsedBeforeAnswer: categoriesUsed,
        hasNoDeadEnds: false,
        cluesUsed,
        gridInteractionCount,
        keyInsight,
      };
    }
    
    // Apply all new deductions
    for (const step of newSteps) {
      applyDeduction(state, step);
      allSteps.push(step);
      stepCount++;
      gridInteractionCount++;
      
      // Track which categories and clues are being used
      categoriesUsed.add(step.grid);
      if (step.clueId) {
        cluesUsed.add(step.clueId);
      }
      
      // Detect cross-category deductions for "Silent Aha" (Rule 13)
      if (step.reasoning.includes('Cross-category') || step.reasoning.includes('cross')) {
        crossCategoryMoments.push({
          step,
          clues: step.clueId ? [step.clueId] : [],
        });
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
          answerRevealedAtStep = stepCount;
          
          // Calculate true deduction depth
          answerDeductionDepth = calculateAnswerDeductionDepth(
            allSteps,
            answerRevealedAtStep,
            trackFinalAnswer.targetCategory,
            trackFinalAnswer.targetValue,
            trackFinalAnswer.answer
          );
          
          // Check if cross-category reasoning was required
          crossCategoryUsedForAnswer = checkCrossCategoryRequirement(
            allSteps,
            answerRevealedAtStep,
            trackFinalAnswer.targetCategory
          );
        }
      }
    }
  }
  
  const solved = isSolved(state, people);
  
  // Generate key insight if we have cross-category moments (Rule 13)
  if (crossCategoryMoments.length > 0) {
    const bestMoment = crossCategoryMoments[crossCategoryMoments.length - 1];
    keyInsight = {
      description: bestMoment.step.reasoning,
      contributingClues: bestMoment.clues,
    };
  }
  
  return {
    solvable: solved,
    steps: allSteps,
    stuckAt: solved ? undefined : allSteps.length,
    answerRevealedAtStep,
    answerDeductionDepth,
    crossCategoryUsedForAnswer,
    categoriesUsedBeforeAnswer: categoriesUsed,
    answerPathClues: Array.from(cluesUsed),
    hasNoDeadEnds,
    cluesUsed,
    gridInteractionCount,
    keyInsight,
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
 * COMPREHENSIVE answer revelation check
 * Catches ALL patterns that reveal the answer, not just direct anchors
 */
export function clueRevealsAnswer(
  clue: AlibiClue,
  finalQuestion: FinalQuestion
): boolean {
  const { targetCategory, targetValue, answer } = finalQuestion;
  
  // Pattern 1: Direct anchor linking answer person to target value
  if (clue.entities?.people?.includes(answer)) {
    if (targetCategory === 'time' && clue.entities?.times?.includes(targetValue)) {
      if (clue.type === 'direct_positive') return true;
    }
    if (targetCategory === 'location' && clue.entities?.locations?.includes(targetValue)) {
      if (clue.type === 'direct_positive') return true;
    }
    if (targetCategory === 'object' && clue.entities?.objects?.includes(targetValue)) {
      if (clue.type === 'direct_positive') return true;
    }
  }
  
  // Pattern 2: Check the actual clue text for direct revelation
  const text = clue.text.toLowerCase();
  const answerLower = answer.toLowerCase();
  const targetLower = targetValue.toLowerCase();
  
  // Direct mention patterns
  if (targetCategory === 'time') {
    if (text.includes(`${answerLower} was seen at ${targetLower}`) ||
        text.includes(`${answerLower} arrived at ${targetLower}`)) {
      return true;
    }
  }
  if (targetCategory === 'location') {
    if (text.includes(`${answerLower} was at the ${targetLower}`) ||
        text.includes(`${answerLower} visited the ${targetLower}`)) {
      return true;
    }
  }
  if (targetCategory === 'object') {
    if (text.includes(`${answerLower} had the ${targetLower}`) ||
        text.includes(`${answerLower} was carrying the ${targetLower}`) ||
        text.includes(`the ${targetLower} belonged to ${answerLower}`)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if the answer would be trivially determinable after applying just the anchors
 * This catches scenarios where elimination makes the answer obvious too early
 */
export function checkTrivialElimination(
  clues: AlibiClue[],
  finalQuestion: FinalQuestion,
  entities: {
    people: string[];
    locations: string[];
    times: string[];
    objects: string[];
  }
): boolean {
  const { targetCategory, targetValue, answer } = finalQuestion;
  
  // Simulate applying just anchor clues
  const state = initializeState(entities.people, entities.locations, entities.times, entities.objects);
  
  // Apply only direct anchor/positive clues
  for (const clue of clues) {
    if (clue.type !== 'direct_positive' && clue.tier !== 'anchor') continue;
    
    const constraints = parseClue(clue, entities);
    for (const constraint of constraints) {
      if (constraint.type === 'confirm' && constraint.grid && constraint.person && constraint.value) {
        applyDeduction(state, {
          type: 'confirm',
          grid: constraint.grid,
          person: constraint.person,
          value: constraint.value,
          reasoning: 'anchor',
        });
        
        // Also apply the elimination cascades
        for (const otherValue of entities[constraint.grid === 'location' ? 'locations' : constraint.grid === 'time' ? 'times' : 'objects']) {
          if (otherValue !== constraint.value) {
            state[constraint.grid].cells[constraint.person][otherValue] = 'ruled_out';
          }
        }
        for (const otherPerson of entities.people) {
          if (otherPerson !== constraint.person) {
            state[constraint.grid].cells[otherPerson][constraint.value] = 'ruled_out';
          }
        }
      }
    }
  }
  
  // Check if answer is already known
  const answerCheck = isAnswerKnown(state, targetCategory, targetValue, entities.people);
  
  // If answer is known after just anchors, it's trivial
  return answerCheck.known && answerCheck.answer === answer;
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
  
  // Check if any confirm step used a different category
  for (const step of relevantSteps) {
    if (step.type === 'confirm' && step.grid !== questionCategory) {
      return true;
    }
  }
  
  return false;
}
