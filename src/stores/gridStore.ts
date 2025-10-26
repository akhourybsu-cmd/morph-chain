// Zustand store for MORPH GRID game state
import { create } from 'zustand';
import { Tile } from '@/lib/grid/gridGenerator';
import { generateDailyGrid } from '@/lib/grid/gridGenerator';
import { SeededRandom } from '@/lib/grid/seededRNG';
import { morphGrid, morphPowerRow } from '@/lib/grid/morphMechanics';
import { calculateWordScore, WordScore } from '@/lib/grid/scoring';
import { isValidWord } from '@/lib/grid/dictionary';

interface SubmittedWord {
  word: string;
  score: WordScore;
  timestamp: number;
}

interface GridState {
  grid: Tile[][];
  selected: Tile[];
  submittedWords: SubmittedWord[];
  totalScore: number;
  dailySeed: string;
  rng: SeededRandom | null;
  isPlaying: boolean;
  isEnded: boolean;
  morphCount: number;
  stabilizationCount: number;
  
  // Actions
  initializeGame: (date: string) => void;
  selectTile: (tile: Tile) => void;
  clearSelection: () => void;
  submitWord: () => boolean;
  endGame: () => void;
  resetGame: () => void;
}

export const useGridStore = create<GridState>((set, get) => ({
  grid: [],
  selected: [],
  submittedWords: [],
  totalScore: 0,
  dailySeed: '',
  rng: null,
  isPlaying: false,
  isEnded: false,
  morphCount: 0,
  stabilizationCount: 0,
  
  initializeGame: (date: string) => {
    const grid = generateDailyGrid(date);
    const rng = new SeededRandom(date + '-morph');
    
    set({
      grid,
      selected: [],
      submittedWords: [],
      totalScore: 0,
      dailySeed: date,
      rng,
      isPlaying: true,
      isEnded: false,
      morphCount: 0,
      stabilizationCount: 0
    });
  },
  
  selectTile: (tile: Tile) => {
    const { selected, grid } = get();
    
    // If clicking the last selected tile, remove it (undo)
    if (selected.length > 0 && selected[selected.length - 1].id === tile.id) {
      set({ selected: selected.slice(0, -1) });
      return;
    }
    
    // Check if tile is already in selection
    if (selected.some(t => t.id === tile.id)) {
      return;
    }
    
    // Check adjacency (only if not the first tile)
    if (selected.length > 0) {
      const lastTile = selected[selected.length - 1];
      if (!isAdjacent(lastTile, tile)) {
        return;
      }
    }
    
    set({ selected: [...selected, tile] });
  },
  
  clearSelection: () => {
    set({ selected: [] });
  },
  
  submitWord: () => {
    const { selected, grid, rng, submittedWords, totalScore, morphCount, stabilizationCount } = get();
    
    if (selected.length < 3 || !rng) return false;
    
    const word = selected.map(t => t.char).join('');
    
    if (!isValidWord(word)) {
      return false;
    }
    
    // Check if word already submitted
    if (submittedWords.some(w => w.word === word)) {
      return false;
    }
    
    // Calculate ripple mutations (count neighbors of used tiles)
    const usedCoords = selected.map(t => ({ row: t.row, col: t.col }));
    const rippleMutations = countPotentialMutations(grid, usedCoords);
    
    // Check if word contains power tile
    const hasPowerTile = selected.some(t => t.isPower);
    const powerTileRow = hasPowerTile ? selected.find(t => t.isPower)?.row : null;
    
    // Calculate score
    const scoreBreakdown = calculateWordScore(word, selected, rippleMutations, hasPowerTile);
    
    // Morph the grid
    let newGrid = morphGrid(grid, usedCoords, rng);
    
    // If power tile was used, morph its entire row
    if (powerTileRow !== null) {
      newGrid = morphPowerRow(newGrid, powerTileRow, rng);
    }
    
    // Count stabilizations
    const newStabilizations = countStabilized(newGrid);
    
    set({
      grid: newGrid,
      selected: [],
      submittedWords: [...submittedWords, {
        word,
        score: scoreBreakdown,
        timestamp: Date.now()
      }],
      totalScore: totalScore + scoreBreakdown.total,
      morphCount: morphCount + 1,
      stabilizationCount: newStabilizations
    });
    
    return true;
  },
  
  endGame: () => {
    set({ isEnded: true, isPlaying: false });
  },
  
  resetGame: () => {
    const { dailySeed } = get();
    get().initializeGame(dailySeed);
  }
}));

// Helper functions
function isAdjacent(tile1: Tile, tile2: Tile): boolean {
  const rowDiff = Math.abs(tile1.row - tile2.row);
  const colDiff = Math.abs(tile1.col - tile2.col);
  
  // Adjacent if within 1 row and 1 col (includes diagonals)
  return rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff > 0);
}

function countPotentialMutations(grid: Tile[][], usedCoords: { row: number, col: number }[]): number {
  const usedSet = new Set(usedCoords.map(c => `${c.row}-${c.col}`));
  const mutatedSet = new Set<string>();
  
  for (const coord of usedCoords) {
    const neighbors = [
      { row: coord.row - 1, col: coord.col },
      { row: coord.row + 1, col: coord.col },
      { row: coord.row, col: coord.col - 1 },
      { row: coord.row, col: coord.col + 1 }
    ];
    
    for (const n of neighbors) {
      if (n.row >= 0 && n.row < 5 && n.col >= 0 && n.col < 5) {
        const key = `${n.row}-${n.col}`;
        if (!usedSet.has(key)) {
          mutatedSet.add(key);
        }
      }
    }
  }
  
  return mutatedSet.size;
}

function countStabilized(grid: Tile[][]): number {
  let count = 0;
  for (const row of grid) {
    for (const tile of row) {
      if (tile.stabilized) count++;
    }
  }
  return count;
}
