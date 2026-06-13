// Shift & Spark mechanic for MORPH GRID with self-balancing
import { Tile } from './gridGenerator';
import { SeededRandom } from './seededRNG';
import { getRandomLetter, isVowelChar } from './gridGenerator';
import {
  MIN_VOWELS_GLOBAL,
  MAX_VOWELS_GLOBAL,
  MAX_VOWEL_RUN,
  LETTER_WEIGHTS,
  GRID_SIZE
} from './gridConfig';

interface Coord {
  row: number;
  col: number;
}

export function morphGrid(
  grid: Tile[][],
  usedCoords: Coord[],
  rng: SeededRandom
): Tile[][] {
  const newGrid = grid.map(row => row.map(tile => ({ ...tile })));
  const usedSet = new Set(usedCoords.map(c => `${c.row}-${c.col}`));
  
  // Count current vowels for balancing
  let currentVowels = countVowels(newGrid);
  const needMoreVowels = currentVowels < MIN_VOWELS_GLOBAL;
  const needFewerVowels = currentVowels > MAX_VOWELS_GLOBAL;
  
  // Step 1: Replace used tiles with new random letters (with balancing bias)
  for (const coord of usedCoords) {
    const tile = newGrid[coord.row][coord.col];
    
    // Apply balancing bias when generating new letter
    let shouldBeVowel: boolean;
    if (needMoreVowels) {
      shouldBeVowel = rng.next() < 0.75; // 75% vowels when low
    } else if (needFewerVowels) {
      shouldBeVowel = rng.next() < 0.15; // 15% vowels when high
    } else {
      shouldBeVowel = rng.next() < 0.4; // 40% normal
    }
    
    tile.char = getRandomLetter(shouldBeVowel, rng);
    tile.isVowel = isVowelChar(tile.char);
    tile.morphCount = 0;
    tile.stabilized = false;
    
    // Update vowel count
    if (tile.isVowel) currentVowels++;
    
    // 5% chance for power tile (max 2 on grid)
    const powerCount = countPowerTiles(newGrid);
    if (powerCount < 2 && rng.next() < 0.05) {
      tile.isPower = true;
    }
  }
  
  // Step 2: Neighbor ripple (orthogonal only) with balancing
  for (const coord of usedCoords) {
    const neighbors = getOrthogonalNeighbors(coord);
    
    for (const n of neighbors) {
      const neighborKey = `${n.row}-${n.col}`;
      if (usedSet.has(neighborKey)) continue;
      
      const tile = newGrid[n.row][n.col];
      const oldIsVowel = tile.isVowel;
      
      // Mutate based on type with balancing bias
      if (tile.isVowel && rng.next() < 0.6) {
        tile.char = getRandomLetter(true, rng);
      } else if (!tile.isVowel && rng.next() < 0.4) {
        tile.char = getRandomLetter(false, rng);
      }
      
      tile.isVowel = isVowelChar(tile.char);
      
      // Update vowel count if changed
      if (!oldIsVowel && tile.isVowel) currentVowels++;
      if (oldIsVowel && !tile.isVowel) currentVowels--;
    }
  }
  
  // Step 3: Update morph counts and stabilization
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const key = `${row}-${col}`;
      const tile = newGrid[row][col];
      
      if (!usedSet.has(key)) {
        tile.morphCount++;
        if (tile.morphCount >= 2) {
          tile.stabilized = true;
        }
      }
    }
  }
  
  // Step 4: Self-balancing corrections (preserve progress colors)
  applyBalancingCorrections(newGrid, rng);
  
  return newGrid;
}

function applyBalancingCorrections(grid: Tile[][], rng: SeededRandom): void {
  // Row/column safety: ensure no vowel-free lines
  ensureRowsHaveVowels(grid, rng);
  ensureColumnsHaveVowels(grid, rng);

  // Break any runs of 3+ consecutive vowels
  breakVowelRuns(grid, rng);
}

function flipToVowels(grid: Tile[][], count: number, rng: SeededRandom): void {
  const candidates: Tile[] = [];
  
  // Find consonants to flip (prefer purple/stabilized tiles)
  for (const row of grid) {
    for (const tile of row) {
      if (!tile.isVowel) {
        candidates.push(tile);
      }
    }
  }
  
  // Sort by impact (purple > blue > orange, stabilized > not)
  candidates.sort((a, b) => {
    if (a.progress !== b.progress) return b.progress - a.progress;
    if (a.stabilized !== b.stabilized) return a.stabilized ? -1 : 1;
    return 0;
  });
  
  for (let i = 0; i < Math.min(count, candidates.length); i++) {
    const tile = candidates[i];
    tile.char = rng.choice(LETTER_WEIGHTS.vowels);
    tile.isVowel = true;
  }
}

function flipToConsonants(grid: Tile[][], count: number, rng: SeededRandom): void {
  const candidates: Tile[] = [];
  
  // Find vowels to flip (prefer purple/stabilized tiles)
  for (const row of grid) {
    for (const tile of row) {
      if (tile.isVowel) {
        candidates.push(tile);
      }
    }
  }
  
  candidates.sort((a, b) => {
    if (a.progress !== b.progress) return b.progress - a.progress;
    if (a.stabilized !== b.stabilized) return a.stabilized ? -1 : 1;
    return 0;
  });
  
  for (let i = 0; i < Math.min(count, candidates.length); i++) {
    const tile = candidates[i];
    tile.char = rng.choice(LETTER_WEIGHTS.consonants);
    tile.isVowel = false;
  }
}

function ensureRowsHaveVowels(grid: Tile[][], rng: SeededRandom): void {
  for (let row = 0; row < GRID_SIZE; row++) {
    const hasVowel = grid[row].some(tile => tile.isVowel);
    if (!hasVowel) {
      // Flip a random consonant in this row to a vowel
      const consonants = grid[row].filter(tile => !tile.isVowel);
      if (consonants.length > 0) {
        const tile = consonants[rng.nextInt(0, consonants.length)];
        tile.char = rng.choice(LETTER_WEIGHTS.vowels);
        tile.isVowel = true;
      }
    }
  }
}

function ensureColumnsHaveVowels(grid: Tile[][], rng: SeededRandom): void {
  for (let col = 0; col < GRID_SIZE; col++) {
    let hasVowel = false;
    for (let row = 0; row < GRID_SIZE; row++) {
      if (grid[row][col].isVowel) {
        hasVowel = true;
        break;
      }
    }
    
    if (!hasVowel) {
      // Find consonants in this column
      const consonants: { row: number, tile: Tile }[] = [];
      for (let row = 0; row < GRID_SIZE; row++) {
        if (!grid[row][col].isVowel) {
          consonants.push({ row, tile: grid[row][col] });
        }
      }
      
      if (consonants.length > 0) {
        const selected = consonants[rng.nextInt(0, consonants.length)];
        selected.tile.char = rng.choice(LETTER_WEIGHTS.vowels);
        selected.tile.isVowel = true;
      }
    }
  }
}

function breakVowelRuns(grid: Tile[][], rng: SeededRandom): void {
  // Break a detected run by flipping every (MAX_VOWEL_RUN+1)th tile,
  // ensuring no group of MAX_VOWEL_RUN+1 consecutive vowels survives.
  const breakRun = (coords: { row: number; col: number }[], runStart: number, runLength: number) => {
    let i = MAX_VOWEL_RUN; // first flip at runStart + MAX_VOWEL_RUN
    while (i < runLength) {
      const { row, col } = coords[runStart + i];
      grid[row][col].char = rng.choice(LETTER_WEIGHTS.consonants);
      grid[row][col].isVowel = false;
      i += MAX_VOWEL_RUN + 1;
    }
  };

  // Check horizontal runs
  for (let row = 0; row < GRID_SIZE; row++) {
    const coords = Array.from({ length: GRID_SIZE }, (_, col) => ({ row, col }));
    let runStart = -1, runLength = 0;
    for (let col = 0; col <= GRID_SIZE; col++) {
      if (col < GRID_SIZE && grid[row][col].isVowel) {
        if (runStart === -1) runStart = col;
        runLength++;
      } else if (runStart !== -1) {
        if (runLength > MAX_VOWEL_RUN) breakRun(coords, runStart, runLength);
        runStart = -1; runLength = 0;
      }
    }
  }

  // Check vertical runs
  for (let col = 0; col < GRID_SIZE; col++) {
    const coords = Array.from({ length: GRID_SIZE }, (_, row) => ({ row, col }));
    let runStart = -1, runLength = 0;
    for (let row = 0; row <= GRID_SIZE; row++) {
      if (row < GRID_SIZE && grid[row][col].isVowel) {
        if (runStart === -1) runStart = row;
        runLength++;
      } else if (runStart !== -1) {
        if (runLength > MAX_VOWEL_RUN) breakRun(coords, runStart, runLength);
        runStart = -1; runLength = 0;
      }
    }
  }
}

function countVowels(grid: Tile[][]): number {
  let count = 0;
  for (const row of grid) {
    for (const tile of row) {
      if (tile.isVowel) count++;
    }
  }
  return count;
}

function getOrthogonalNeighbors(coord: Coord): Coord[] {
  const neighbors: Coord[] = [];
  const directions = [
    { row: -1, col: 0 }, // North
    { row: 1, col: 0 },  // South
    { row: 0, col: -1 }, // West
    { row: 0, col: 1 }   // East
  ];
  
  for (const dir of directions) {
    const row = coord.row + dir.row;
    const col = coord.col + dir.col;
    if (row >= 0 && row < 5 && col >= 0 && col < 5) {
      neighbors.push({ row, col });
    }
  }
  
  return neighbors;
}

function countPowerTiles(grid: Tile[][]): number {
  let count = 0;
  for (const row of grid) {
    for (const tile of row) {
      if (tile.isPower) count++;
    }
  }
  return count;
}

export function morphPowerRow(
  grid: Tile[][],
  rowIndex: number,
  rng: SeededRandom
): Tile[][] {
  const newGrid = grid.map(row => row.map(tile => ({ ...tile })));
  
  for (let col = 0; col < 5; col++) {
    const tile = newGrid[rowIndex][col];
    if (tile.isPower) {
      // Consume the power tile — clear the flag so it doesn't trigger again
      tile.isPower = false;
    } else {
      tile.char = getRandomLetter(rng.next() < 0.4, rng);
      tile.isVowel = isVowelChar(tile.char);
      tile.morphCount = 0;
      tile.stabilized = false;
    }
  }
  
  return newGrid;
}
