// Grid constraint validation and repair logic
import { Tile } from './gridGenerator';
import { SeededRandom } from './seededRNG';
import {
  VOWELS,
  SUPPORT_LETTERS,
  HARD_CLUSTER,
  MAX_HARD_CLUSTER_IN_3x3,
  MAX_VOWEL_RUN,
  GRID_SIZE,
  LETTER_WEIGHTS
} from './gridConfig';
import { isVowelChar } from './gridGenerator';

export function validateGridConstraints(grid: Tile[][]): boolean {
  // 1. Check each row has at least one vowel
  for (let row = 0; row < GRID_SIZE; row++) {
    if (!grid[row].some(tile => tile.isVowel)) {
      return false;
    }
  }
  
  // 2. Check each column has at least one vowel
  for (let col = 0; col < GRID_SIZE; col++) {
    let hasVowel = false;
    for (let row = 0; row < GRID_SIZE; row++) {
      if (grid[row][col].isVowel) {
        hasVowel = true;
        break;
      }
    }
    if (!hasVowel) return false;
  }
  
  // 3. Check no 3x3 block is vowel-free
  for (let startRow = 0; startRow <= GRID_SIZE - 3; startRow++) {
    for (let startCol = 0; startCol <= GRID_SIZE - 3; startCol++) {
      let hasVowel = false;
      for (let r = startRow; r < startRow + 3; r++) {
        for (let c = startCol; c < startCol + 3; c++) {
          if (grid[r][c].isVowel) {
            hasVowel = true;
            break;
          }
        }
        if (hasVowel) break;
      }
      if (!hasVowel) return false;
    }
  }
  
  // 4. Check no runs of 3+ consecutive vowels (horizontal or vertical)
  if (hasVowelRuns(grid)) return false;
  
  // 5. Check each row has at least one support letter
  for (let row = 0; row < GRID_SIZE; row++) {
    if (!grid[row].some(tile => SUPPORT_LETTERS.includes(tile.char))) {
      return false;
    }
  }
  
  // 6. Check no 3x3 has too many hard consonants
  for (let startRow = 0; startRow <= GRID_SIZE - 3; startRow++) {
    for (let startCol = 0; startCol <= GRID_SIZE - 3; startCol++) {
      let hardCount = 0;
      for (let r = startRow; r < startRow + 3; r++) {
        for (let c = startCol; c < startCol + 3; c++) {
          if (HARD_CLUSTER.includes(grid[r][c].char)) {
            hardCount++;
          }
        }
      }
      if (hardCount > MAX_HARD_CLUSTER_IN_3x3) return false;
    }
  }
  
  return true;
}

function hasVowelRuns(grid: Tile[][]): boolean {
  // Check horizontal runs
  for (let row = 0; row < GRID_SIZE; row++) {
    let consecutiveVowels = 0;
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col].isVowel) {
        consecutiveVowels++;
        if (consecutiveVowels > MAX_VOWEL_RUN) return true;
      } else {
        consecutiveVowels = 0;
      }
    }
  }
  
  // Check vertical runs
  for (let col = 0; col < GRID_SIZE; col++) {
    let consecutiveVowels = 0;
    for (let row = 0; row < GRID_SIZE; row++) {
      if (grid[row][col].isVowel) {
        consecutiveVowels++;
        if (consecutiveVowels > MAX_VOWEL_RUN) return true;
      } else {
        consecutiveVowels = 0;
      }
    }
  }
  
  return false;
}

export function repairGridConstraints(grid: Tile[][], rng: SeededRandom): Tile[][] {
  const newGrid = grid.map(row => row.map(tile => ({ ...tile })));
  
  // Repair vowel-free rows
  for (let row = 0; row < GRID_SIZE; row++) {
    if (!newGrid[row].some(tile => tile.isVowel)) {
      // Find best position to flip to vowel
      const col = findBestConsonantToFlip(newGrid, row, -1, rng);
      if (col !== -1) {
        const vowel = rng.choice(LETTER_WEIGHTS.vowels);
        newGrid[row][col].char = vowel;
        newGrid[row][col].isVowel = true;
      }
    }
  }
  
  // Repair vowel-free columns
  for (let col = 0; col < GRID_SIZE; col++) {
    let hasVowel = false;
    for (let row = 0; row < GRID_SIZE; row++) {
      if (newGrid[row][col].isVowel) {
        hasVowel = true;
        break;
      }
    }
    if (!hasVowel) {
      const row = findBestConsonantToFlip(newGrid, -1, col, rng);
      if (row !== -1) {
        const vowel = rng.choice(LETTER_WEIGHTS.vowels);
        newGrid[row][col].char = vowel;
        newGrid[row][col].isVowel = true;
      }
    }
  }
  
  // Break vowel runs
  breakVowelRuns(newGrid, rng);
  
  // Add support letters to rows that need them
  for (let row = 0; row < GRID_SIZE; row++) {
    if (!newGrid[row].some(tile => SUPPORT_LETTERS.includes(tile.char))) {
      const col = rng.nextInt(0, GRID_SIZE);
      const supportLetter = rng.choice(SUPPORT_LETTERS);
      newGrid[row][col].char = supportLetter;
      newGrid[row][col].isVowel = isVowelChar(supportLetter);
    }
  }
  
  return newGrid;
}

function findBestConsonantToFlip(grid: Tile[][], targetRow: number, targetCol: number, rng: SeededRandom): number {
  const candidates: number[] = [];
  
  if (targetRow !== -1) {
    // Find consonants in the row
    for (let col = 0; col < GRID_SIZE; col++) {
      if (!grid[targetRow][col].isVowel) {
        candidates.push(col);
      }
    }
    return candidates.length > 0 ? candidates[rng.nextInt(0, candidates.length)] : -1;
  } else {
    // Find consonants in the column
    for (let row = 0; row < GRID_SIZE; row++) {
      if (!grid[row][targetCol].isVowel) {
        candidates.push(row);
      }
    }
    return candidates.length > 0 ? candidates[rng.nextInt(0, candidates.length)] : -1;
  }
}

function breakVowelRuns(grid: Tile[][], rng: SeededRandom): void {
  // Break horizontal runs
  for (let row = 0; row < GRID_SIZE; row++) {
    let runStart = -1;
    let runLength = 0;
    
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col].isVowel) {
        if (runStart === -1) runStart = col;
        runLength++;
      } else {
        if (runLength > MAX_VOWEL_RUN) {
          // Break the run by flipping middle vowel to consonant
          const flipCol = runStart + Math.floor(runLength / 2);
          const consonant = rng.choice(LETTER_WEIGHTS.consonants);
          grid[row][flipCol].char = consonant;
          grid[row][flipCol].isVowel = false;
        }
        runStart = -1;
        runLength = 0;
      }
    }
    
    // Handle run at end of row
    if (runLength > MAX_VOWEL_RUN) {
      const flipCol = runStart + Math.floor(runLength / 2);
      const consonant = rng.choice(LETTER_WEIGHTS.consonants);
      grid[row][flipCol].char = consonant;
      grid[row][flipCol].isVowel = false;
    }
  }
  
  // Break vertical runs (similar logic)
  for (let col = 0; col < GRID_SIZE; col++) {
    let runStart = -1;
    let runLength = 0;
    
    for (let row = 0; row < GRID_SIZE; row++) {
      if (grid[row][col].isVowel) {
        if (runStart === -1) runStart = row;
        runLength++;
      } else {
        if (runLength > MAX_VOWEL_RUN) {
          const flipRow = runStart + Math.floor(runLength / 2);
          const consonant = rng.choice(LETTER_WEIGHTS.consonants);
          grid[flipRow][col].char = consonant;
          grid[flipRow][col].isVowel = false;
        }
        runStart = -1;
        runLength = 0;
      }
    }
    
    if (runLength > MAX_VOWEL_RUN) {
      const flipRow = runStart + Math.floor(runLength / 2);
      const consonant = rng.choice(LETTER_WEIGHTS.consonants);
      grid[flipRow][col].char = consonant;
      grid[flipRow][col].isVowel = false;
    }
  }
}

export function generateSafeTemplate(rng: SeededRandom): Tile[][] {
  // Generate a guaranteed safe template with proper vowel distribution
  const template = [
    [false, true, false, true, false],
    [true, false, false, false, true],
    [false, false, true, false, false],
    [true, false, false, false, true],
    [false, true, false, true, false]
  ];
  
  const grid: Tile[][] = [];
  
  for (let row = 0; row < GRID_SIZE; row++) {
    const gridRow: Tile[] = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      const isVowel = template[row][col];
      const char = isVowel 
        ? rng.choice(LETTER_WEIGHTS.vowels)
        : rng.choice(LETTER_WEIGHTS.consonants);
      
      gridRow.push({
        id: `${row}-${col}`,
        char,
        isVowel,
        isPower: false,
        morphCount: 0,
        stabilized: false,
        row,
        col,
        progress: 0
      });
    }
    grid.push(gridRow);
  }
  
  return grid;
}
