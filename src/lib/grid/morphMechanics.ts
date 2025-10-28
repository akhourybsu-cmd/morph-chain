// Shift & Spark mechanic for MORPH GRID
import { Tile } from './gridGenerator';
import { SeededRandom } from './seededRNG';
import { getRandomLetter, isVowelChar } from './gridGenerator';

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
  
  // Step 1: Replace used tiles with new random letters
  const usedSet = new Set(usedCoords.map(c => `${c.row}-${c.col}`));
  
  for (const coord of usedCoords) {
    const tile = newGrid[coord.row][coord.col];
    tile.char = getRandomLetter(rng.next() < 0.4, rng);
    tile.isVowel = isVowelChar(tile.char);
    tile.morphCount = 0;
    tile.stabilized = false;
    // PRESERVE progress state - morphing doesn't change color
    
    // 5% chance for power tile (max 2 on grid)
    const powerCount = countPowerTiles(newGrid);
    if (powerCount < 2 && rng.next() < 0.05) {
      tile.isPower = true;
    }
  }
  
  // Step 2: Neighbor ripple (orthogonal only)
  for (const coord of usedCoords) {
    const neighbors = getOrthogonalNeighbors(coord);
    
    for (const n of neighbors) {
      const neighborKey = `${n.row}-${n.col}`;
      if (usedSet.has(neighborKey)) continue; // Skip tiles that were used
      
      const tile = newGrid[n.row][n.col];
      
      // Mutate based on type
      if (tile.isVowel && rng.next() < 0.6) {
        // 60% chance to mutate to another vowel
        tile.char = getRandomLetter(true, rng);
      } else if (!tile.isVowel && rng.next() < 0.4) {
        // 40% chance to mutate to another consonant
        tile.char = getRandomLetter(false, rng);
      }
      
      tile.isVowel = isVowelChar(tile.char);
    }
  }
  
  // Step 3: Update morph counts and stabilization
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
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
  
  return newGrid;
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
    if (!tile.isPower) { // Don't morph the power tile itself again
      tile.char = getRandomLetter(rng.next() < 0.4, rng);
      tile.isVowel = isVowelChar(tile.char);
      tile.morphCount = 0;
      tile.stabilized = false;
    }
  }
  
  return newGrid;
}
