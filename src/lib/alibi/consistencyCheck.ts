import { AlibiPuzzle, GridState, CellState } from './types';

interface ConsistencyResult {
  isConsistent: boolean;
  conflicts: Array<{
    grid: 'location' | 'time' | 'object';
    row: string;
    col: string;
    issue: 'wrong_confirmed' | 'wrong_ruled_out';
  }>;
}

export function checkConsistency(
  puzzle: AlibiPuzzle,
  grids: {
    location: GridState;
    time: GridState;
    object: GridState;
  }
): ConsistencyResult {
  const conflicts: ConsistencyResult['conflicts'] = [];

  // Check location grid
  checkGrid(
    grids.location,
    puzzle.solution.personToLocation,
    'location',
    conflicts
  );

  // Check time grid
  checkGrid(
    grids.time,
    puzzle.solution.personToTime,
    'time',
    conflicts
  );

  // Check object grid
  checkGrid(
    grids.object,
    puzzle.solution.personToObject,
    'object',
    conflicts
  );

  return {
    isConsistent: conflicts.length === 0,
    conflicts,
  };
}

function checkGrid(
  grid: GridState,
  solution: Record<string, string>,
  gridType: 'location' | 'time' | 'object',
  conflicts: ConsistencyResult['conflicts']
): void {
  for (const row of grid.rows) {
    for (const col of grid.cols) {
      const cellState = grid.cells[row]?.[col] || 'unknown';
      const correctValue = solution[row];
      const isCorrectPair = correctValue === col;

      if (cellState === 'confirmed' && !isCorrectPair) {
        conflicts.push({
          grid: gridType,
          row,
          col,
          issue: 'wrong_confirmed',
        });
      } else if (cellState === 'ruled_out' && isCorrectPair) {
        conflicts.push({
          grid: gridType,
          row,
          col,
          issue: 'wrong_ruled_out',
        });
      }
    }
  }
}

// Check if the puzzle is completely solved
export function checkWinCondition(
  puzzle: AlibiPuzzle,
  grids: {
    location: GridState;
    time: GridState;
    object: GridState;
  }
): boolean {
  // First check if all grids are complete
  if (!isGridComplete(grids.location)) return false;
  if (!isGridComplete(grids.time)) return false;
  if (!isGridComplete(grids.object)) return false;

  // Then check if the solution is correct
  const consistency = checkConsistency(puzzle, grids);
  return consistency.isConsistent;
}

function isGridComplete(grid: GridState): boolean {
  // Each row should have exactly one confirmed
  for (const row of grid.rows) {
    const confirmedCount = grid.cols.filter(
      col => grid.cells[row]?.[col] === 'confirmed'
    ).length;
    if (confirmedCount !== 1) return false;
  }

  // Each column should have exactly one confirmed
  for (const col of grid.cols) {
    const confirmedCount = grid.rows.filter(
      row => grid.cells[row]?.[col] === 'confirmed'
    ).length;
    if (confirmedCount !== 1) return false;
  }

  return true;
}

// Get the user's current answer mapping from grids
export function extractUserSolution(grids: {
  location: GridState;
  time: GridState;
  object: GridState;
}): {
  personToLocation: Record<string, string>;
  personToTime: Record<string, string>;
  personToObject: Record<string, string>;
} {
  const personToLocation: Record<string, string> = {};
  const personToTime: Record<string, string> = {};
  const personToObject: Record<string, string> = {};

  for (const row of grids.location.rows) {
    for (const col of grids.location.cols) {
      if (grids.location.cells[row]?.[col] === 'confirmed') {
        personToLocation[row] = col;
        break;
      }
    }
  }

  for (const row of grids.time.rows) {
    for (const col of grids.time.cols) {
      if (grids.time.cells[row]?.[col] === 'confirmed') {
        personToTime[row] = col;
        break;
      }
    }
  }

  for (const row of grids.object.rows) {
    for (const col of grids.object.cols) {
      if (grids.object.cells[row]?.[col] === 'confirmed') {
        personToObject[row] = col;
        break;
      }
    }
  }

  return { personToLocation, personToTime, personToObject };
}
