// Zustand store for MORPH GRID game state
import { create } from 'zustand';
import { Tile } from '@/lib/grid/gridGenerator';
import { generateDailyGrid } from '@/lib/grid/gridGenerator';
import { SeededRandom } from '@/lib/grid/seededRNG';
import { morphGrid, morphPowerRow } from '@/lib/grid/morphMechanics';
import { calculateWordScore } from '@/lib/grid/scoring';
import { isValidWord } from '@/lib/grid/dictionary';
import { recordGridPlayStart, recordGridSubmit, recordGridWin, recordGridLoss, saveGridGameState, loadGridGameState, clearGridGameState, type SubmittedWord } from '@/lib/gridStorage';
import { checkGridAchievements, saveGridAchievements, getGridAchievements, getNewGridAchievements, updateTieredProgress, loadTieredProgress, type GridAchievementContext } from '@/lib/gridAchievements';
import { upsertGridSession } from '@/integrations/supabase/gridSession';
import { startActiveSession, updateSessionActivity, completeActiveSession } from '@/lib/activeSessionTracking';

const MAX_MOVES = 20;

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
  isWin: boolean;
  morphCount: number;
  stabilizationCount: number;
  startTime: number | null;
  lastSubmission: LastSubmission | null;
  highlightTrackerLength: number | null;
  usedPowerTile: boolean;
  usedCorner: boolean;
  usedDiagonal: boolean;
  score: number;
  newAchievements: string[];
  
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
  clearNewAchievements: () => void;
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
  usedPowerTile: false,
  usedCorner: false,
  usedDiagonal: false,
  score: 0,
  newAchievements: [],
  
  initializeGame: (date: string) => {
    // Try to load saved state first
    const savedState = loadGridGameState(date);
    
    if (savedState && savedState.dailySeed === date) {
      // Check if saved game was already ended
      if (savedState.isEnded) {
        const rng = new SeededRandom(date + '-morph');
        
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
          score: savedState.score ?? 0,
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
        score: savedState.score ?? 0,
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
      });
      
      // Record play start for stats
      recordGridPlayStart(date);
      
      // Start active session tracking
      startActiveSession({
        gameType: 'grid',
        puzzleDate: date,
      });
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
    const { selected, grid, rng, submittedWords, morphCount, stabilizationCount, isEnded, moves, usedPowerTile, usedCorner, usedDiagonal, score, dailySeed, startTime } = get();
    
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
    
    // Track corner usage (any tile in the word is a corner)
    const newUsedCorner = usedCorner || selected.some(t =>
      (t.row === 0 || t.row === 4) && (t.col === 0 || t.col === 4)
    );

    // Track diagonal usage (any adjacent pair in the word is diagonal)
    let hasDiagonalConnection = false;
    for (let i = 1; i < selected.length; i++) {
      const prev = selected[i - 1];
      const curr = selected[i];
      if (Math.abs(prev.row - curr.row) === 1 && Math.abs(prev.col - curr.col) === 1) {
        hasDiagonalConnection = true;
        break;
      }
    }
    const newUsedDiagonal = usedDiagonal || (selected.length > 1 && hasDiagonalConnection);
    
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
    const newUsedPowerTile = usedPowerTile || hasPowerTile;

    // Calculate score for this word
    const rippleCount = countPotentialMutations(grid, usedCoords);
    const wordScore = calculateWordScore(word, selected, rippleCount, hasPowerTile);
    const newScore = score + wordScore.total;

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
    
    // Track stats
    const usedPowerRow = selected.some(t => t.isPower);
    const stabilizedFreed = selected.filter(t => t.stabilized).length;
    recordGridSubmit(word, usedPowerRow, stabilizedFreed);
    
    const newMorphCount = morphCount + 1;
    const newStabilizationCount = countStabilized(morphedGrid);
    const newSubmittedWords = [...submittedWords, { word, timestamp: Date.now() }];
    
    // Check achievements when game ends
    let newAchievements: string[] = [];
    if (gameEnded) {
      const timeMs = startTime ? Date.now() - startTime : 0;
      const longestWord = Math.max(...newSubmittedWords.map(w => w.word.length));
      const tieredProgress = loadTieredProgress();
      
      const context: GridAchievementContext = {
        won: isWin,
        moves: newMoves,
        wordsSubmitted: newSubmittedWords.length,
        timeMs,
        longestWord,
        usedPowerTile: newUsedPowerTile,
        purpleCount: newPurpleCount,
        currentStreak: tieredProgress.win_streak + (isWin ? 1 : 0),
        totalWins: tieredProgress.grid_wins + (isWin ? 1 : 0),
        mutationCount: newMorphCount,
        usedCorner: newUsedCorner,
        usedDiagonal: newUsedDiagonal,
      };
      
      const earned = checkGridAchievements(context);
      const alreadyUnlocked = getGridAchievements();
      newAchievements = getNewGridAchievements(earned, alreadyUnlocked);
      
      if (newAchievements.length > 0) {
        saveGridAchievements(newAchievements);
      }
      
      // Update tiered progress
      if (isWin) {
        updateTieredProgress({
          grid_wins: tieredProgress.grid_wins + 1,
          win_streak: tieredProgress.win_streak + 1,
          max_win_streak: Math.max(tieredProgress.max_win_streak, tieredProgress.win_streak + 1),
          total_words: tieredProgress.total_words + newSubmittedWords.length,
          long_words: tieredProgress.long_words + newSubmittedWords.filter(w => w.word.length === 6).length,
          epic_words: tieredProgress.epic_words + newSubmittedWords.filter(w => w.word.length >= 7).length,
          cascade_upgrades: tieredProgress.cascade_upgrades + upgradedTileIds.length,
          efficient_wins_15: tieredProgress.efficient_wins_15 + (newMoves <= 15 ? 1 : 0),
          efficient_wins_12: tieredProgress.efficient_wins_12 + (newMoves <= 12 ? 1 : 0),
          efficient_wins_10: tieredProgress.efficient_wins_10 + (newMoves <= 10 ? 1 : 0),
          efficient_wins_8: tieredProgress.efficient_wins_8 + (newMoves <= 8 ? 1 : 0),
          speed_wins_5min: tieredProgress.speed_wins_5min + (timeMs < 300000 ? 1 : 0),
          speed_wins_3min: tieredProgress.speed_wins_3min + (timeMs < 180000 ? 1 : 0),
          speed_wins_2min: tieredProgress.speed_wins_2min + (timeMs < 120000 ? 1 : 0),
          speed_wins_90sec: tieredProgress.speed_wins_90sec + (timeMs < 90000 ? 1 : 0),
        });
      } else {
        // Reset streak on loss
        updateTieredProgress({
          win_streak: 0,
          total_words: tieredProgress.total_words + newSubmittedWords.length,
        });
      }
    }
    
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
      usedPowerTile: newUsedPowerTile,
      usedCorner: newUsedCorner,
      usedDiagonal: newUsedDiagonal,
      score: newScore,
      newAchievements,
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
      startTime: currentState.startTime || Date.now(),
      isEnded: gameEnded,
      isWin: isWin,
      score: newScore,
    });
    
    // Record win or loss
    const state = get();
    const timeToComplete = state.startTime ? Date.now() - state.startTime : undefined;
    
    if (isWin) {
      recordGridWin({
        dateSeed: state.dailySeed,
        moves: state.moves,
        wordsUsed: state.submittedWords.length,
        timeToCompleteMs: timeToComplete,
        score: state.score,
      });
      
      // Store entry ID for leaderboard highlighting
      if (typeof window !== 'undefined') {
        const entries = JSON.parse(localStorage.getItem(`morphGrid_leaderboard_${state.dailySeed}`) || '[]');
        if (entries.length > 0) {
          localStorage.setItem('morphGrid_myEntryId', entries[entries.length - 1].id);
        }
      }
    } else if (isLoss) {
      recordGridLoss({
        dateSeed: state.dailySeed,
        moves: state.moves,
        wordsUsed: state.submittedWords.length,
        purpleCount: newPurpleCount,
        timeToCompleteMs: timeToComplete,
      });
    }
    
    // Sync to backend for authenticated users
    upsertGridSession({
      date_local: state.dailySeed,
      session_id: `${state.dailySeed}-${Date.now()}`,
      moves: state.moves,
      words_used: state.submittedWords.length,
      time_to_complete_ms: timeToComplete,
      completed: true,
      won: isWin,
    });
    
    // Complete active session tracking
    completeActiveSession(
      { gameType: 'grid', puzzleDate: state.dailySeed },
      isWin,
      state.moves
    );
    
    return true;
  },
  
  endGame: () => {
    set({ isEnded: true, isPlaying: false });
  },
  
  resetGame: () => {
    const { dailySeed } = get();
    
    // Check if already completed - if so, don't allow reset
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
  },
  
  clearNewAchievements: () => {
    set({ newAchievements: [] });
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