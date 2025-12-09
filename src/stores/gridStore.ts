// Zustand store for MORPH GRID game state
import { create } from 'zustand';
import { Tile } from '@/lib/grid/gridGenerator';
import { generateDailyGrid } from '@/lib/grid/gridGenerator';
import { SeededRandom } from '@/lib/grid/seededRNG';
import { morphGrid, morphPowerRow } from '@/lib/grid/morphMechanics';
import { isValidWord } from '@/lib/grid/dictionary';
import { recordGridPlayStart, recordGridSubmit, recordGridWin, saveGridGameState, loadGridGameState, clearGridGameState, type SubmittedWord } from '@/lib/gridStorage';

interface LastSubmission {
  wordLength: number;
  usedTileIds: string[];
  upgradedTileIds: string[];
  timestamp: number;
}

interface GridState {
  grid: Tile[][];
  selected: Tile[];
  submittedWords: SubmittedWord[];
  moves: number;
  purpleCount: number;
  dailySeed: string;
  rng: SeededRandom | null;
  isPlaying: boolean;
  isEnded: boolean;
  morphCount: number;
  stabilizationCount: number;
  startTime: number | null;
  lastSubmission: LastSubmission | null;
  
  // Actions
  initializeGame: (date: string) => void;
  selectTile: (tile: Tile) => void;
  setSelected: (tiles: Tile[]) => void;
  clearSelection: () => void;
  submitWord: () => boolean;
  endGame: () => void;
  resetGame: () => void;
  resetDaily: () => void;
  clearLastSubmission: () => void;
}

export const useGridStore = create<GridState>((set, get) => ({
  grid: [],
  selected: [],
  submittedWords: [],
  moves: 0,
  purpleCount: 0,
  dailySeed: '',
  rng: null,
  isPlaying: false,
  isEnded: false,
  morphCount: 0,
  stabilizationCount: 0,
  startTime: null,
  lastSubmission: null,
  
  initializeGame: (date: string) => {
    // Try to load saved state first
    const savedState = loadGridGameState(date);
    
    if (savedState && savedState.dailySeed === date) {
      // Restore from saved state
      const rng = new SeededRandom(date + '-morph');
      set({
        grid: savedState.grid,
        selected: savedState.selected,
        submittedWords: savedState.submittedWords,
        moves: savedState.moves,
        purpleCount: savedState.purpleCount,
        dailySeed: date,
        rng,
        isPlaying: true,
        isEnded: false,
        morphCount: savedState.morphCount,
        stabilizationCount: savedState.stabilizationCount,
        startTime: savedState.startTime
      });
      console.log('Restored Grid game state for', date);
    } else {
      // Start fresh game
      const grid = generateDailyGrid(date);
      const rng = new SeededRandom(date + '-morph');
      
      set({
        grid,
        selected: [],
        submittedWords: [],
        moves: 0,
        purpleCount: 0,
        dailySeed: date,
        rng,
        isPlaying: true,
        isEnded: false,
        morphCount: 0,
        stabilizationCount: 0,
        startTime: Date.now()
      });
      
      // Record play start for stats
      recordGridPlayStart(date);
    }
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
  
  setSelected: (tiles: Tile[]) => {
    set({ selected: tiles });
  },
  
  clearSelection: () => {
    set({ selected: [] });
  },
  
  submitWord: () => {
    const { selected, grid, rng, submittedWords, morphCount, stabilizationCount, isEnded } = get();
    
    // Prevent submissions after game ends
    if (isEnded) {
      console.log('Game already ended, no more submissions allowed');
      return false;
    }
    
    if (selected.length < 3 || !rng) return false;
    
    const word = selected.map(t => t.char).join('');
    
    if (!isValidWord(word)) {
      return false;
    }
    
    // Step 1: Advance progress for all used tiles
    const newGrid = grid.map(row => row.map(tile => {
      const isUsed = selected.some(s => s.id === tile.id);
      if (isUsed) {
        return {
          ...tile,
          progress: Math.min(2, tile.progress + 1) as 0 | 1 | 2
        };
      }
      return { ...tile };
    }));
    
    // Step 2: Morph the grid (letters change, neighbors mutate)
    const usedCoords = selected.map(t => ({ row: t.row, col: t.col }));
    let morphedGrid = morphGrid(newGrid, usedCoords, rng);
    
    // Step 3: Check for power tile usage
    const hasPowerTile = selected.some(t => t.isPower);
    if (hasPowerTile) {
      const powerTile = selected.find(t => t.isPower);
      if (powerTile) {
        morphedGrid = morphPowerRow(morphedGrid, powerTile.row, rng);
      }
    }
    
    // Step 4: Cascade Upgrade bonus for 5+ letter words
    const wordLength = selected.length;
    const usedTileIds = selected.map(t => t.id);
    let upgradedTileIds: string[] = [];
    
    if (wordLength >= 5) {
      const bonusTiles = wordLength === 5 ? 1 : wordLength === 6 ? 2 : 3;
      
      // Find non-purple tiles that weren't just used
      const usedIds = new Set(usedTileIds);
      const upgradeCandidates: { row: number; col: number; id: string }[] = [];
      
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          const tile = morphedGrid[row][col];
          if (tile.progress < 2 && !usedIds.has(tile.id)) {
            upgradeCandidates.push({ row, col, id: tile.id });
          }
        }
      }
      
      // Randomly upgrade tiles using the RNG
      const shuffled = [...upgradeCandidates];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng.next() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      const tilesToUpgrade = shuffled.slice(0, bonusTiles);
      upgradedTileIds = tilesToUpgrade.map(t => t.id);
      
      for (const { row, col } of tilesToUpgrade) {
        morphedGrid[row][col] = {
          ...morphedGrid[row][col],
          progress: Math.min(2, morphedGrid[row][col].progress + 1) as 0 | 1 | 2
        };
      }
    }
    
    const newPurpleCount = morphedGrid.flat().filter(t => t.progress === 2).length;
    const isWin = newPurpleCount === 25;
    
    // Track stats
    const usedPowerRow = selected.some(t => t.isPower);
    const stabilizedFreed = selected.filter(t => t.stabilized).length;
    recordGridSubmit(word, usedPowerRow, stabilizedFreed);
    
    const newMoves = get().moves + 1;
    const newMorphCount = morphCount + 1;
    const newStabilizationCount = countStabilized(morphedGrid);
    const newSubmittedWords = [...submittedWords, { word, timestamp: Date.now() }];
    
    set({
      grid: morphedGrid,
      selected: [],
      submittedWords: newSubmittedWords,
      moves: newMoves,
      purpleCount: newPurpleCount,
      morphCount: newMorphCount,
      stabilizationCount: newStabilizationCount,
      isEnded: isWin,
      lastSubmission: {
        wordLength,
        usedTileIds,
        upgradedTileIds,
        timestamp: Date.now()
      }
    });
    
    // Save game state
    const currentState = get();
    saveGridGameState({
      grid: morphedGrid,
      selected: [],
      submittedWords: newSubmittedWords,
      moves: newMoves,
      purpleCount: newPurpleCount,
      dailySeed: currentState.dailySeed,
      morphCount: newMorphCount,
      stabilizationCount: newStabilizationCount,
      startTime: currentState.startTime || Date.now()
    });
    
    // Record win if game complete
    if (isWin) {
      const state = get();
      const timeToComplete = state.startTime ? Date.now() - state.startTime : undefined;
      
      recordGridWin({
        dateSeed: state.dailySeed,
        moves: state.moves,
        wordsUsed: state.submittedWords.length,
        timeToCompleteMs: timeToComplete,
      });
      
      // Clear saved game state on win
      clearGridGameState(state.dailySeed);
      
      // Store entry ID for leaderboard highlighting
      if (typeof window !== 'undefined') {
        const entries = JSON.parse(localStorage.getItem(`morphGrid_leaderboard_${state.dailySeed}`) || '[]');
        if (entries.length > 0) {
          localStorage.setItem('morphGrid_myEntryId', entries[entries.length - 1].id);
        }
      }
    }
    
    return true;
  },
  
  endGame: () => {
    set({ isEnded: true, isPlaying: false });
  },
  
  resetGame: () => {
    const { dailySeed } = get();
    clearGridGameState(dailySeed);
    set({ startTime: Date.now() });
    get().initializeGame(dailySeed);
  },
  
  resetDaily: () => {
    const { dailySeed } = get();
    clearGridGameState(dailySeed);
    set({ startTime: Date.now() });
    get().initializeGame(dailySeed);
  },
  
  clearLastSubmission: () => {
    set({ lastSubmission: null });
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
