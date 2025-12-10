// Zustand store for MORPH GRID game state
import { create } from 'zustand';
import { Tile } from '@/lib/grid/gridGenerator';
import { generateDailyGrid, generateRandomGrid } from '@/lib/grid/gridGenerator';
import { SeededRandom } from '@/lib/grid/seededRNG';
import { morphGrid, morphPowerRow } from '@/lib/grid/morphMechanics';
import { isValidWord } from '@/lib/grid/dictionary';
import { recordGridPlayStart, recordGridSubmit, recordGridWin, recordGridLoss, saveGridGameState, loadGridGameState, clearGridGameState, type SubmittedWord } from '@/lib/gridStorage';

const MAX_MOVES = 20;

interface LastSubmission {
  wordLength: number;
  usedTileIds: string[];
  upgradedTileIds: string[];
  timestamp: number;
}

interface DailyResult {
  moves: number;
  submittedWords: SubmittedWord[];
  isWin: boolean;
  purpleCount: number;
  morphCount: number;
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
  isWin: boolean;
  morphCount: number;
  stabilizationCount: number;
  startTime: number | null;
  lastSubmission: LastSubmission | null;
  highlightTrackerLength: number | null;
  isPractice: boolean;
  dailyResult: DailyResult | null;
  
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
  setHighlightTrackerLength: (length: number | null) => void;
  startPractice: () => void;
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
  isWin: false,
  morphCount: 0,
  stabilizationCount: 0,
  startTime: null,
  lastSubmission: null,
  highlightTrackerLength: null,
  isPractice: false,
  dailyResult: null,
  
  initializeGame: (date: string) => {
    // Try to load saved state first
    const savedState = loadGridGameState(date);
    
    if (savedState && savedState.dailySeed === date) {
      // Check if saved game was already ended
      if (savedState.isEnded) {
        const rng = new SeededRandom(date + '-morph');
        
        // Store daily result for viewing later
        const dailyResult: DailyResult = {
          moves: savedState.moves,
          submittedWords: savedState.submittedWords,
          isWin: savedState.isWin ?? false,
          purpleCount: savedState.purpleCount,
          morphCount: savedState.morphCount,
        };
        
        set({
          grid: savedState.grid,
          selected: [],
          submittedWords: savedState.submittedWords,
          moves: savedState.moves,
          purpleCount: savedState.purpleCount,
          dailySeed: date,
          rng,
          isPlaying: false,
          isEnded: true,
          isWin: savedState.isWin ?? false,
          morphCount: savedState.morphCount,
          stabilizationCount: savedState.stabilizationCount,
          startTime: savedState.startTime,
          isPractice: false,
          dailyResult,
        });
        return;
      }
      
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
        isWin: false,
        morphCount: savedState.morphCount,
        stabilizationCount: savedState.stabilizationCount,
        startTime: savedState.startTime,
        isPractice: false,
        dailyResult: null,
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
        isWin: false,
        morphCount: 0,
        stabilizationCount: 0,
        startTime: Date.now(),
        isPractice: false,
        dailyResult: null,
      });
      
      // Record play start for stats
      recordGridPlayStart(date);
    }
  },
  
  startPractice: () => {
    const { dailySeed, moves, submittedWords, isWin, purpleCount, morphCount, isEnded } = get();
    
    // If daily was completed, save it as dailyResult first
    let dailyResult: DailyResult | null = get().dailyResult;
    if (isEnded && !get().isPractice) {
      dailyResult = {
        moves,
        submittedWords,
        isWin,
        purpleCount,
        morphCount,
      };
    }
    
    // Generate a random grid for practice
    const practiceSeed = `practice-${Date.now()}`;
    const grid = generateRandomGrid();
    const rng = new SeededRandom(practiceSeed);
    
    set({
      grid,
      selected: [],
      submittedWords: [],
      moves: 0,
      purpleCount: 0,
      rng,
      isPlaying: true,
      isEnded: false,
      isWin: false,
      morphCount: 0,
      stabilizationCount: 0,
      startTime: Date.now(),
      isPractice: true,
      dailyResult,
    });
    
    console.log('Started practice mode');
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
    const { selected, grid, rng, submittedWords, morphCount, stabilizationCount, isEnded, moves, isPractice } = get();
    
    // Prevent submissions after game ends
    if (isEnded) {
      console.log('Game already ended, no more submissions allowed');
      return false;
    }
    
    // Minimum 4 letters required
    if (selected.length < 4 || !rng) return false;
    
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
    const newMoves = moves + 1;
    const isWin = newPurpleCount === 25;
    const isLoss = !isWin && newMoves >= MAX_MOVES;
    const gameEnded = isWin || isLoss;
    
    // Track stats ONLY for non-practice games
    if (!isPractice) {
      const usedPowerRow = selected.some(t => t.isPower);
      const stabilizedFreed = selected.filter(t => t.stabilized).length;
      recordGridSubmit(word, usedPowerRow, stabilizedFreed);
    }
    
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
      isEnded: gameEnded,
      isWin: isWin,
      lastSubmission: {
        wordLength,
        usedTileIds,
        upgradedTileIds,
        timestamp: Date.now()
      }
    });
    
    // Save game state ONLY for non-practice games
    if (!isPractice) {
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
        startTime: currentState.startTime || Date.now(),
        isEnded: gameEnded,
        isWin: isWin
      });
    }
    
    // Record win or loss ONLY for non-practice games
    if (!isPractice) {
      if (isWin) {
        const state = get();
        const timeToComplete = state.startTime ? Date.now() - state.startTime : undefined;
        
        recordGridWin({
          dateSeed: state.dailySeed,
          moves: state.moves,
          wordsUsed: state.submittedWords.length,
          timeToCompleteMs: timeToComplete,
        });
        
        // Store entry ID for leaderboard highlighting
        if (typeof window !== 'undefined') {
          const entries = JSON.parse(localStorage.getItem(`morphGrid_leaderboard_${state.dailySeed}`) || '[]');
          if (entries.length > 0) {
            localStorage.setItem('morphGrid_myEntryId', entries[entries.length - 1].id);
          }
        }
      } else if (isLoss) {
        const state = get();
        const timeToComplete = state.startTime ? Date.now() - state.startTime : undefined;
        
        recordGridLoss({
          dateSeed: state.dailySeed,
          moves: state.moves,
          wordsUsed: state.submittedWords.length,
          purpleCount: newPurpleCount,
          timeToCompleteMs: timeToComplete,
        });
      }
    }
    
    return true;
  },
  
  endGame: () => {
    set({ isEnded: true, isPlaying: false });
  },
  
  resetGame: () => {
    const { dailySeed, isPractice } = get();
    
    // If in practice mode, just start a new practice
    if (isPractice) {
      get().startPractice();
      return;
    }
    
    // For daily, check if already completed - if so, don't allow reset
    const savedState = loadGridGameState(dailySeed);
    if (savedState?.isEnded) {
      console.log('Daily already completed, cannot reset');
      // Just reopen end screen by setting isEnded
      set({ isEnded: true });
      return;
    }
    
    clearGridGameState(dailySeed);
    set({ startTime: Date.now() });
    get().initializeGame(dailySeed);
  },
  
  resetDaily: () => {
    const { dailySeed } = get();
    
    // Check if daily already completed - if so, don't allow reset
    const savedState = loadGridGameState(dailySeed);
    if (savedState?.isEnded) {
      console.log('Daily already completed, cannot reset');
      // Just reopen end screen
      set({ isEnded: true });
      return;
    }
    
    clearGridGameState(dailySeed);
    set({ startTime: Date.now() });
    get().initializeGame(dailySeed);
  },
  
  clearLastSubmission: () => {
    set({ lastSubmission: null });
  },
  
  setHighlightTrackerLength: (length: number | null) => {
    set({ highlightTrackerLength: length });
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