import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  getDailyPuzzle,
  isValidWord,
  isOneLetterDifferent,
  getHints,
  calculateDistance,
  hasValidNextMove,
} from "@/lib/gameLogic";
import {
  loadStats,
  saveStats,
  loadSettings,
  saveSettings,
  loadGameState,
  saveGameState,
  clearGameState,
  resetAllData,
} from "@/lib/storage";
import { isRateLimited } from "@/lib/rateLimit";
import { syncStatsToSupabase } from "@/lib/supabaseSync";
import { saveSessionToSupabase } from "@/lib/sessionSync";
import {
  checkChainAchievements,
  getChainAchievements,
  getNewChainAchievements,
  saveChainAchievements,
  ChainAchievementContext,
} from "@/lib/chainAchievements";
import { Move } from "@/components/MoveLog";
import { BackgroundTheme, backgroundThemes } from "@/components/SettingsModal";

export const useChainGame = () => {
  const { toast } = useToast();
  const [selectedLength, setSelectedLength] = useState<4 | 5>(4);
  const [puzzle, setPuzzle] = useState(getDailyPuzzle(4));
  const [moves, setMoves] = useState<Move[]>([]);
  const [currentWord, setCurrentWord] = useState(puzzle.startWord);
  const [usedWords, setUsedWords] = useState(new Set([puzzle.startWord]));
  const [currentInput, setCurrentInput] = useState("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [achievementQueue, setAchievementQueue] = useState<string[]>([]);
  const [currentAchievement, setCurrentAchievement] = useState<string | null>(null);
  const gameStartTime = useRef<number>(Date.now());
  const [settings, setSettings] = useState(loadSettings());
  const [stats, setStats] = useState(loadStats());
  const [invalidGuessCount, setInvalidGuessCount] = useState(0);

  // Handle length change
  const handleLengthChange = useCallback((newLength: 4 | 5) => {
    setSelectedLength(newLength);
    const newPuzzle = getDailyPuzzle(newLength);
    setPuzzle(newPuzzle);
    setInvalidGuessCount(0);
    
    const savedState = loadGameState(newLength);
    const isValidSavedState = 
      savedState && 
      savedState.date === newPuzzle.date && 
      savedState.wordLength === newLength &&
      savedState.moves.length > 0 &&
      savedState.moves[0]?.from === newPuzzle.startWord;
    
    if (isValidSavedState) {
      const restoredMoves: Move[] = savedState.moves.map((m, i) => {
        const moveDistance = calculateDistance(m.to, newPuzzle.goalWord);
        const prevDistance = calculateDistance(m.from, newPuzzle.goalWord);
        return {
          id: `move-${i}`,
          from: m.from,
          to: m.to,
          hints: getHints(m.to, newPuzzle.goalWord),
          closerToGoal: moveDistance < prevDistance,
          isComplete: m.to === newPuzzle.goalWord,
          isWorse: moveDistance > prevDistance,
          timestamp: new Date(m.timestamp),
        };
      });

      setMoves(restoredMoves);
      setCurrentWord(savedState.moves[savedState.moves.length - 1]?.to || newPuzzle.startWord);
      setUsedWords(new Set([newPuzzle.startWord, ...savedState.moves.map((m) => m.to)]));
      setGameCompleted(savedState.completed);
      setGameWon(savedState.won);
    } else {
      if (savedState && savedState.date === newPuzzle.date && savedState.moves[0]?.from !== newPuzzle.startWord) {
        clearGameState(newLength);
      }
      setMoves([]);
      setCurrentWord(newPuzzle.startWord);
      setUsedWords(new Set([newPuzzle.startWord]));
      setGameCompleted(false);
      setGameWon(false);
    }
    setError("");
  }, []);

  // Load saved game state on mount
  useEffect(() => {
    handleLengthChange(selectedLength);
    
    const hasSeenHelp = localStorage.getItem("morphchain_seen_help");
    if (!hasSeenHelp) {
      localStorage.setItem("morphchain_seen_help", "true");
    }
  }, []);

  const submitGuess = useCallback((word: string) => {
    const wordToSubmit = word;
    setError("");
    
    if (isRateLimited('guess')) {
      setError("Too many attempts. Please wait a moment.");
      return;
    }
    
    setIsLoading(true);

    setTimeout(() => {
      const isValid = isOneLetterDifferent(currentWord, wordToSubmit);
      
      if (!isValid) {
        setInvalidGuessCount(prev => prev + 1);
        setError("Must change exactly 1 letter");
        setCurrentInput("");
        setIsLoading(false);
        return;
      }

      if (!isValidWord(wordToSubmit, puzzle.wordLength)) {
        setInvalidGuessCount(prev => prev + 1);
        setError("Not in our modern-English list");
        setCurrentInput("");
        setIsLoading(false);
        return;
      }

      if (usedWords.has(wordToSubmit)) {
        setInvalidGuessCount(prev => prev + 1);
        setError("Already used");
        setCurrentInput("");
        setIsLoading(false);
        return;
      }

      const currentDistance = calculateDistance(currentWord, puzzle.goalWord);
      const newDistance = calculateDistance(wordToSubmit, puzzle.goalWord);
      const closerToGoal = newDistance < currentDistance;
      const isComplete = wordToSubmit === puzzle.goalWord;
      const isWorse = newDistance > currentDistance;

      if (settings.hardMode && !closerToGoal && newDistance !== 0) {
        setInvalidGuessCount(prev => prev + 1);
        setError("Hard Mode: must get closer each step.");
        setIsLoading(false);
        return;
      }

      const newMove: Move = {
        id: `move-${moves.length}`,
        from: currentWord,
        to: wordToSubmit,
        hints: getHints(wordToSubmit, puzzle.goalWord),
        closerToGoal,
        isComplete,
        isWorse,
        timestamp: new Date(),
      };

      const updatedMoves = [...moves, newMove];
      const updatedUsedWords = new Set([...usedWords, wordToSubmit]);
      setMoves(updatedMoves);
      setCurrentWord(wordToSubmit);
      setUsedWords(updatedUsedWords);

      if (settings.vibration && navigator.vibrate) {
        navigator.vibrate(closerToGoal ? 10 : 20);
      }

      if (word !== puzzle.goalWord && updatedMoves.length < puzzle.maxMoves) {
        const hasNext = hasValidNextMove(word, updatedUsedWords, puzzle.wordLength, false);
        
        if (!hasNext) {
          toast({
            title: "Dead End!",
            description: "This word has no valid next moves. You're stuck!",
            variant: "destructive",
            duration: 4000,
          });
        }
      }

      if (word === puzzle.goalWord) {
        handleWin(updatedMoves);
      } else if (updatedMoves.length >= puzzle.maxMoves) {
        handleLoss(updatedMoves);
      } else {
        saveGameState({
          date: puzzle.date,
          wordLength: puzzle.wordLength,
          moves: updatedMoves.map((m) => ({
            from: m.from,
            to: m.to,
            timestamp: m.timestamp.toISOString(),
          })),
          completed: false,
          won: false,
        });
      }

      setIsLoading(false);
      setCurrentInput("");
    }, 200);
  }, [currentWord, moves, puzzle, settings, usedWords, toast]);

  const handleWin = useCallback((updatedMoves: Move[]) => {
    setGameCompleted(true);
    setGameWon(true);
    setShowCelebration(true);
    
    const timeElapsedSeconds = Math.floor((Date.now() - gameStartTime.current) / 1000);
    const hadWorseMove = updatedMoves.some(m => m.isWorse);
    
    const currentStats = loadStats();
    const lengthKey = puzzle.wordLength as 4 | 5;
    const newTotalWins = currentStats.overall.won + 1;
    const newStreak = currentStats.byLength[lengthKey].currentStreak + 1;
    
    const otherLength = puzzle.wordLength === 4 ? 5 : 4;
    const otherState = loadGameState(otherLength);
    const wonBothToday = otherState?.date === puzzle.date && otherState?.won === true;
    
    const achievementContext: ChainAchievementContext = {
      won: true,
      movesUsed: updatedMoves.length,
      minDistance: puzzle.minDistance,
      maxMoves: puzzle.maxMoves,
      hardMode: settings.hardMode,
      currentStreak: newStreak,
      totalWins: newTotalWins,
      wordLength: puzzle.wordLength as 4 | 5,
      wonBothToday,
      timeElapsedSeconds,
      hadWorseMove,
    };
    
    const earnedAchievements = checkChainAchievements(achievementContext);
    const alreadyUnlocked = getChainAchievements();
    const newAchievements = getNewChainAchievements(earnedAchievements, alreadyUnlocked);
    
    if (newAchievements.length > 0) {
      saveChainAchievements(newAchievements);
      setAchievementQueue(newAchievements);
    }
    
    updateStats(true, updatedMoves.length);
    saveGameState({
      date: puzzle.date,
      wordLength: puzzle.wordLength,
      moves: updatedMoves.map((m) => ({
        from: m.from,
        to: m.to,
        timestamp: m.timestamp.toISOString(),
      })),
      completed: true,
      won: true,
    });
    
    saveSessionToSupabase(
      puzzle.date,
      puzzle.wordLength,
      updatedMoves,
      true,
      true,
      0,
      invalidGuessCount
    );
  }, [puzzle, settings, invalidGuessCount]);

  const handleLoss = useCallback((updatedMoves: Move[]) => {
    setGameCompleted(true);
    setGameWon(false);
    updateStats(false, updatedMoves.length);
    saveGameState({
      date: puzzle.date,
      wordLength: puzzle.wordLength,
      moves: updatedMoves.map((m) => ({
        from: m.from,
        to: m.to,
        timestamp: m.timestamp.toISOString(),
      })),
      completed: true,
      won: false,
    });
    
    saveSessionToSupabase(
      puzzle.date,
      puzzle.wordLength,
      updatedMoves,
      true,
      false,
      0,
      invalidGuessCount
    );
  }, [puzzle, invalidGuessCount]);

  const updateStats = useCallback((won: boolean, movesCount: number) => {
    const newStats = { ...stats };
    const lengthKey = puzzle.wordLength as 4 | 5;
    
    newStats.overall.played += 1;
    if (won) {
      newStats.overall.won += 1;
      newStats.overall.distribution[movesCount - 1] += 1;
      if (settings.hardMode) {
        newStats.overall.hardModeStreak += 1;
      }
    }
    
    newStats.byLength[lengthKey].played += 1;
    if (won) {
      newStats.byLength[lengthKey].won += 1;
      newStats.byLength[lengthKey].distribution[movesCount - 1] += 1;
      newStats.byLength[lengthKey].currentStreak += 1;
      newStats.byLength[lengthKey].maxStreak = Math.max(
        newStats.byLength[lengthKey].maxStreak,
        newStats.byLength[lengthKey].currentStreak
      );
    } else {
      newStats.byLength[lengthKey].currentStreak = 0;
    }
    
    const today = puzzle.date;
    const hasWonToday = [4, 5].some(length => {
      const state = loadGameState(length as 4 | 5);
      return state?.date === today && state?.won;
    });
    
    if (stats.lastPlayedDate !== today) {
      if (won) {
        newStats.overall.currentStreak += 1;
        newStats.overall.maxStreak = Math.max(newStats.overall.maxStreak, newStats.overall.currentStreak);
      } else if (!hasWonToday) {
        newStats.overall.currentStreak = 0;
      }
    } else if (won && newStats.overall.currentStreak === 0) {
      newStats.overall.currentStreak = 1;
    }
    
    newStats.lastPlayedDate = today;
    setStats(newStats);
    saveStats(newStats);
    syncStatsToSupabase();
  }, [stats, puzzle, settings]);

  const handleSubmit = useCallback(() => {
    if (!currentInput.trim() || gameCompleted || isLoading) return;
    submitGuess(currentInput.trim().toUpperCase());
  }, [currentInput, gameCompleted, isLoading, submitGuess]);

  const handleKeyPress = useCallback((key: string) => {
    if (currentInput.length < puzzle.wordLength) {
      setCurrentInput(currentInput + key);
    }
  }, [currentInput, puzzle.wordLength]);

  const handleBackspace = useCallback(() => {
    setCurrentInput(currentInput.slice(0, -1));
  }, [currentInput]);

  const handlePlayAgain = useCallback(() => {
    setMoves([]);
    setCurrentWord(puzzle.startWord);
    setUsedWords(new Set([puzzle.startWord]));
    setGameCompleted(false);
    setGameWon(false);
    setShowCelebration(false);
    setAchievementQueue([]);
    setCurrentAchievement(null);
    setError("");
    setCurrentInput("");
    setInvalidGuessCount(0);
    gameStartTime.current = Date.now();
    clearGameState(puzzle.wordLength);
  }, [puzzle]);

  // Handle achievement queue
  useEffect(() => {
    if (achievementQueue.length > 0 && !currentAchievement) {
      const timer = setTimeout(() => {
        setCurrentAchievement(achievementQueue[0]);
        setAchievementQueue(prev => prev.slice(1));
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [achievementQueue, currentAchievement]);

  const handleAchievementComplete = useCallback(() => {
    setCurrentAchievement(null);
  }, []);

  const handleToggleSetting = useCallback((key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    saveSettings(newSettings);
    syncStatsToSupabase();
  }, [settings]);

  const handleChangeBackgroundTheme = useCallback((theme: BackgroundTheme) => {
    const newSettings = { ...settings, backgroundTheme: theme };
    setSettings(newSettings);
    saveSettings(newSettings);
    
    const themeConfig = backgroundThemes[theme];
    if (themeConfig) {
      document.documentElement.style.setProperty('--background', themeConfig.bg);
    }
  }, [settings]);

  // Apply saved theme on mount
  useEffect(() => {
    const savedTheme = settings.backgroundTheme as BackgroundTheme;
    const validTheme = savedTheme && backgroundThemes[savedTheme] ? savedTheme : "midnight";
    const themeColor = backgroundThemes[validTheme].bg;
    document.documentElement.style.setProperty('--background', themeColor);
    
    if (validTheme !== savedTheme) {
      const newSettings = { ...settings, backgroundTheme: validTheme };
      setSettings(newSettings);
      saveSettings(newSettings);
    }
  }, []);

  const handleResetData = useCallback(() => {
    if (confirm("Are you sure? This will erase all your stats and progress.")) {
      resetAllData();
      setStats(loadStats());
      setSettings(loadSettings());
      setMoves([]);
      setCurrentWord(puzzle.startWord);
      setUsedWords(new Set([puzzle.startWord]));
      setGameCompleted(false);
      setGameWon(false);
      toast({ title: "All data has been reset" });
    }
  }, [puzzle, toast]);

  // Track letter states for keyboard feedback
  const usedLetters = useMemo(() => {
    const letters = new Set<string>();
    moves.forEach(move => {
      move.to.split('').forEach(letter => letters.add(letter));
    });
    return letters;
  }, [moves]);

  const correctLetters = useMemo(() => {
    const letters = new Set<string>();
    moves.forEach(move => {
      move.hints.forEach((hint, index) => {
        if (hint === 'match') {
          letters.add(move.to[index]);
        }
      });
    });
    return letters;
  }, [moves]);

  const wrongPositionLetters = useMemo(() => {
    const letters = new Set<string>();
    moves.forEach(move => {
      move.hints.forEach((hint, index) => {
        if (hint === 'present') {
          letters.add(move.to[index]);
        }
      });
    });
    return letters;
  }, [moves]);

  const getLengthStatus = useCallback((length: 4 | 5): "empty" | "won" | "failed" | "in-progress" => {
    const state = loadGameState(length);
    if (!state || state.date !== puzzle.date) return "empty";
    if (state.completed) return state.won ? "won" : "failed";
    if (state.moves.length > 0) return "in-progress";
    return "empty";
  }, [puzzle.date]);

  const lengthStatuses = useMemo(() => ({
    4: getLengthStatus(4),
    5: getLengthStatus(5),
  }), [getLengthStatus]);

  return {
    // State
    selectedLength,
    puzzle,
    moves,
    currentWord,
    currentInput,
    setCurrentInput,
    error,
    isLoading,
    gameCompleted,
    gameWon,
    showCelebration,
    currentAchievement,
    settings,
    stats,
    
    // Computed
    usedLetters,
    correctLetters,
    wrongPositionLetters,
    lengthStatuses,
    
    // Handlers
    handleLengthChange,
    handleSubmit,
    handleKeyPress,
    handleBackspace,
    handlePlayAgain,
    handleAchievementComplete,
    handleToggleSetting,
    handleChangeBackgroundTheme,
    handleResetData,
  };
};
