import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { 
  AlibiPuzzle, 
  AlibiGameState, 
  GridState, 
  GridType, 
  CellState,
  REVEAL_THRESHOLD 
} from '@/lib/alibi/types';
import { loadDailyPuzzle, generatePracticePuzzle, getTodayDateStr } from '@/lib/alibi/dailyPuzzle';
import { checkConsistency, checkWinCondition, extractUserSolution } from '@/lib/alibi/consistencyCheck';
import { 
  createEmptyGridState, 
  saveGameState, 
  loadGameState, 
  updateStatsAfterGame,
  checkAndClearVersionedCache,
} from '@/lib/alibi/storage';
import { useAlibiSettings } from './useAlibiSettings';

interface UseAlibiGameOptions {
  mode: 'daily' | 'practice';
}

export function useAlibiGame({ mode }: UseAlibiGameOptions) {
  const { autoDeduction } = useAlibiSettings();
  const [puzzle, setPuzzle] = useState<AlibiPuzzle | null>(null);
  const [grids, setGrids] = useState<{
    location: GridState;
    time: GridState;
    object: GridState;
  } | null>(null);
  const [activeGrid, setActiveGrid] = useState<GridType>('location');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [consistencyChecks, setConsistencyChecks] = useState(0);
  const [isSolved, setIsSolved] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [moveHistory, setMoveHistory] = useState<AlibiGameState['moveHistory']>([]);
  const [lastConsistencyMessage, setLastConsistencyMessage] = useState<string | null>(null);
  const [questionJustRevealed, setQuestionJustRevealed] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Count total confirmations across all grids
  const totalConfirmations = useMemo(() => {
    if (!grids) return 0;
    let count = 0;
    for (const gridType of ['location', 'time', 'object'] as GridType[]) {
      const grid = grids[gridType];
      for (const row of grid.rows) {
        for (const col of grid.cols) {
          if (grid.cells[row]?.[col] === 'confirmed') {
            count++;
          }
        }
      }
    }
    return count;
  }, [grids]);
  
  // Determine if final question should be shown
  const threshold = puzzle?.revealThreshold ?? REVEAL_THRESHOLD;
  const showFinalQuestion = totalConfirmations >= threshold || isSolved;

  // Initialize puzzle
  useEffect(() => {
    const loadPuzzle = () => {
      // Check if puzzle generation version changed - clears old cached puzzles
      checkAndClearVersionedCache();
      
      const newPuzzle = mode === 'daily' ? loadDailyPuzzle() : generatePracticePuzzle();
      
      // Check for saved state
      const savedState = loadGameState(newPuzzle.id);
      
      if (savedState && savedState.grids && savedState.isSolved !== undefined) {
        setPuzzle(newPuzzle);
        setGrids(savedState.grids as typeof grids);
        setElapsedTime(savedState.elapsedTime || 0);
        setConsistencyChecks(savedState.consistencyChecks || 0);
        setIsSolved(savedState.isSolved);
        setIsComplete(savedState.isComplete || false);
        setMoveHistory(savedState.moveHistory || []);
      } else {
        // Initialize fresh grids
        const locationGrid = createEmptyGridState(newPuzzle.people, newPuzzle.locations);
        const timeGrid = createEmptyGridState(newPuzzle.people, newPuzzle.times);
        const objectGrid = createEmptyGridState(newPuzzle.people, newPuzzle.objects);
        
        setPuzzle(newPuzzle);
        setGrids({
          location: locationGrid,
          time: timeGrid,
          object: objectGrid,
        });
        setElapsedTime(0);
        setConsistencyChecks(0);
        setIsSolved(false);
        setIsComplete(false);
        setMoveHistory([]);
      }
    };

    loadPuzzle();
  }, [mode]);

  // Timer
  useEffect(() => {
    if (!isSolved && puzzle && grids) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1000);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isSolved, puzzle, grids]);

  // Save state on changes
  useEffect(() => {
    if (puzzle && grids) {
      saveGameState(puzzle.id, {
        grids,
        elapsedTime,
        consistencyChecks,
        isSolved,
        isComplete,
        moveHistory,
      });
    }
  }, [puzzle, grids, elapsedTime, consistencyChecks, isSolved, isComplete, moveHistory]);

  // Toggle cell state
  const toggleCell = useCallback((grid: GridType, row: string, col: string) => {
    if (!grids || isSolved) return;

    setGrids(prev => {
      if (!prev) return prev;
      
      const currentState = prev[grid].cells[row]?.[col] || 'unknown';
      let newState: CellState;
      
      // Cycle: unknown -> confirmed -> ruled_out -> unknown
      switch (currentState) {
        case 'unknown':
          newState = 'confirmed';
          break;
        case 'confirmed':
          newState = 'ruled_out';
          break;
        case 'ruled_out':
          newState = 'unknown';
          break;
        default:
          newState = 'unknown';
      }

      // Record move for undo
      setMoveHistory(history => [...history, {
        grid,
        row,
        col,
        prevState: currentState,
        newState,
      }]);

      const newGrids = { ...prev };
      const newCells = { ...prev[grid].cells };
      newCells[row] = { ...newCells[row], [col]: newState };
      
      // Auto-deduction when confirming
      if (autoDeduction && newState === 'confirmed') {
        // Rule out all other cells in the same row
        for (const c of prev[grid].cols) {
          if (c !== col && newCells[row][c] !== 'confirmed') {
            newCells[row][c] = 'ruled_out';
          }
        }
        // Rule out all other cells in the same column
        for (const r of prev[grid].rows) {
          if (r !== row) {
            if (!newCells[r]) newCells[r] = {};
            if (newCells[r][col] !== 'confirmed') {
              newCells[r][col] = 'ruled_out';
            }
          }
        }
      }

      newGrids[grid] = {
        ...prev[grid],
        cells: newCells,
      };

      return newGrids;
    });
  }, [grids, isSolved, autoDeduction]);

  // Check for win after grid changes
  useEffect(() => {
    if (!puzzle || !grids || isSolved) return;

    const won = checkWinCondition(puzzle, grids);
    if (won) {
      setIsSolved(true);
      setIsComplete(true);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Update stats
      if (mode === 'daily') {
        updateStatsAfterGame(true, elapsedTime, consistencyChecks, getTodayDateStr());
      }
    }
  }, [puzzle, grids, isSolved, elapsedTime, consistencyChecks, mode]);

  // Undo last move
  const undo = useCallback(() => {
    if (moveHistory.length === 0 || !grids || isSolved) return;

    const lastMove = moveHistory[moveHistory.length - 1];
    
    setGrids(prev => {
      if (!prev) return prev;
      
      const newGrids = { ...prev };
      const newCells = { ...prev[lastMove.grid].cells };
      newCells[lastMove.row] = { 
        ...newCells[lastMove.row], 
        [lastMove.col]: lastMove.prevState 
      };
      
      newGrids[lastMove.grid] = {
        ...prev[lastMove.grid],
        cells: newCells,
      };

      return newGrids;
    });

    setMoveHistory(history => history.slice(0, -1));
  }, [moveHistory, grids, isSolved]);

  // Check consistency
  const runConsistencyCheck = useCallback(() => {
    if (!puzzle || !grids) return;

    setConsistencyChecks(prev => prev + 1);
    
    const result = checkConsistency(puzzle, grids);
    
    if (result.isConsistent) {
      setLastConsistencyMessage("Everything you've marked looks correct so far!");
    } else {
      setLastConsistencyMessage("Something you've marked doesn't fit the facts. Try revisiting your ✓ and ✗.");
    }

    // Clear message after a few seconds
    setTimeout(() => setLastConsistencyMessage(null), 4000);
  }, [puzzle, grids]);

  // Reset game
  const resetGame = useCallback(() => {
    if (!puzzle) return;

    const locationGrid = createEmptyGridState(puzzle.people, puzzle.locations);
    const timeGrid = createEmptyGridState(puzzle.people, puzzle.times);
    const objectGrid = createEmptyGridState(puzzle.people, puzzle.objects);
    
    setGrids({
      location: locationGrid,
      time: timeGrid,
      object: objectGrid,
    });
    setElapsedTime(0);
    setConsistencyChecks(0);
    setIsSolved(false);
    setIsComplete(false);
    setMoveHistory([]);
    setLastConsistencyMessage(null);
  }, [puzzle]);

  // Get user's answer for the final question
  const getUserAnswer = useCallback(() => {
    if (!grids) return null;
    return extractUserSolution(grids);
  }, [grids]);

  // Track when question is first revealed for animation
  const prevShowFinalQuestion = useRef(false);
  useEffect(() => {
    if (showFinalQuestion && !prevShowFinalQuestion.current && !isSolved) {
      setQuestionJustRevealed(true);
      setTimeout(() => setQuestionJustRevealed(false), 3000);
    }
    prevShowFinalQuestion.current = showFinalQuestion;
  }, [showFinalQuestion, isSolved]);

  return {
    puzzle,
    grids,
    activeGrid,
    setActiveGrid,
    elapsedTime,
    consistencyChecks,
    isSolved,
    isComplete,
    moveHistory,
    lastConsistencyMessage,
    toggleCell,
    undo,
    runConsistencyCheck,
    resetGame,
    getUserAnswer,
    // Hidden Final Question mechanic
    totalConfirmations,
    showFinalQuestion,
    revealThreshold: threshold,
    questionJustRevealed,
  };
}
