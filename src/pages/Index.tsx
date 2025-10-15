import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { GameHeader } from "@/components/GameHeader";
import { PuzzleTopBar } from "@/components/PuzzleTopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";
import { LengthPills } from "@/components/LengthPills";
import { PuzzleHero } from "@/components/PuzzleHero";
import OnScreenKeyboard from "@/components/OnScreenKeyboard";
import { MoveLog, Move } from "@/components/MoveLog";
import { ResultPanel } from "@/components/ResultPanel";
import { GameMenuSheet } from "@/components/GameMenuSheet";
import { backgroundThemes, BackgroundTheme } from "@/components/SettingsModal";
import { StatsModal } from "@/components/StatsModal";
import { HowToPlayModal } from "@/components/HowToPlayModal";
import { WordDisputeModal } from "@/components/WordDisputeModal";
import { MobileActionBar } from "@/components/MobileActionBar";
import { MorphPowerups } from "@/components/MorphPowerups";
import { useToast } from "@/hooks/use-toast";
import {
  getDailyPuzzle,
  isValidWord,
  isOneLetterDifferent,
  isTwoLettersDifferent,
  getHints,
  calculateDistance,
  generateShareText,
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
import { saveDispute } from "@/lib/disputeStorage";
import { isRateLimited } from "@/lib/rateLimit";
import { syncStatsToSupabase } from "@/lib/supabaseSync";
import { saveSessionToSupabase } from "@/lib/sessionSync";

const Index = () => {
  const navigate = useNavigate();
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
  const [simpleMode, setSimpleMode] = useState(false);

  // Power-ups (5L only)
  const [doubleSwapUsed, setDoubleSwapUsed] = useState(false);
  const [letterSwapUsed, setLetterSwapUsed] = useState(false);
  const [doubleSwapActive, setDoubleSwapActive] = useState(false);
  const [letterSwapActive, setLetterSwapActive] = useState(false);
  const [swapSelection, setSwapSelection] = useState<number[]>([]);
  const [shake, setShake] = useState(false);

  // Modals
  const [menuOpen, setMenuOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputedWord, setDisputedWord] = useState<string | undefined>();

  // Settings
  const [settings, setSettings] = useState(loadSettings());
  const [stats, setStats] = useState(loadStats());
  const [invalidGuessCount, setInvalidGuessCount] = useState(0);

  // Handle length change
  const handleLengthChange = (newLength: 4 | 5) => {
    setSelectedLength(newLength);
    const newPuzzle = getDailyPuzzle(newLength);
    setPuzzle(newPuzzle);
    setInvalidGuessCount(0);
    
    // Load saved state for this length
    const savedState = loadGameState(newLength);
    // Validate saved state matches current puzzle (date, length, AND start word)
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
      // Reset for new puzzle or invalid saved state
      if (savedState && savedState.date === newPuzzle.date && savedState.moves[0]?.from !== newPuzzle.startWord) {
        // Clear outdated state from old puzzle configuration
        clearGameState(newLength);
      }
      setMoves([]);
      setCurrentWord(newPuzzle.startWord);
      setUsedWords(new Set([newPuzzle.startWord]));
      setGameCompleted(false);
      setGameWon(false);
    }
    setError("");
    
    // Reset power-ups
    setDoubleSwapUsed(false);
    setLetterSwapUsed(false);
    setDoubleSwapActive(false);
    setLetterSwapActive(false);
    setSwapSelection([]);
  };

  // Load saved game state on mount
  useEffect(() => {
    handleLengthChange(selectedLength);
    
    // Show help modal on first visit
    const hasSeenHelp = localStorage.getItem("morphchain_seen_help");
    if (!hasSeenHelp) {
      setHelpOpen(true);
      localStorage.setItem("morphchain_seen_help", "true");
    }
  }, []);

  const submitGuess = (word: string) => {
    const wordToSubmit = word;
    setError("");
    
    // Rate limiting: 6 requests per 15 seconds
    if (isRateLimited('guess')) {
      setError("Too many attempts. Please wait a moment.");
      return;
    }
    
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      // Validation rules:
      // 4L: always one letter
      // 5L: one letter (removed two-letter first move rule, now using power-ups)
      // 6L: two letters anytime
      const allowTwoLetters = 
        (puzzle.wordLength === 5 && doubleSwapActive) || 
        (puzzle.wordLength === 6);
      
      const isValid = allowTwoLetters
        ? (isOneLetterDifferent(currentWord, wordToSubmit) || isTwoLettersDifferent(currentWord, wordToSubmit))
        : isOneLetterDifferent(currentWord, wordToSubmit);
      
      if (!isValid) {
        setInvalidGuessCount(prev => prev + 1);
        if (allowTwoLetters) {
          setError("Must change 1 or 2 letters");
        } else {
          setError("Must change exactly 1 letter");
        }
        setCurrentInput("");
        setIsLoading(false);
        return;
      }

      if (!isValidWord(wordToSubmit, puzzle.wordLength)) {
        setInvalidGuessCount(prev => prev + 1);
        setError("Not in our modern-English list");
        setCurrentInput("");
        
        // If letter swap was active, consume it and show shake feedback
        if (letterSwapActive) {
          setLetterSwapActive(false);
          setLetterSwapUsed(true);
          setSwapSelection([]);
          setShake(true);
          setTimeout(() => setShake(false), 500);
        }
        
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

      // Hard mode check
      if (settings.hardMode && !closerToGoal && newDistance !== 0) {
        setInvalidGuessCount(prev => prev + 1);
        setError("Hard Mode: must get closer each step.");
        setIsLoading(false);
        return;
      }

      // Valid move
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
      
      // Deactivate and mark power-ups as used
      if (doubleSwapActive) {
        setDoubleSwapActive(false);
        setDoubleSwapUsed(true);
      }
      if (letterSwapActive) {
        setLetterSwapActive(false);
        setLetterSwapUsed(true);
        setSwapSelection([]);
      }

      // Vibration feedback
      if (settings.vibration && navigator.vibrate) {
        navigator.vibrate(closerToGoal ? 10 : 20);
      }

      // Check for dead-end (word with no valid next moves)
      if (word !== puzzle.goalWord && updatedMoves.length < puzzle.maxMoves) {
        // Dead-end rules match submit validation:
        // 4L: always one letter only
        // 5L: after first move, one letter only (first move already done)
        // 6L: one or two letters anytime
        const allowTwoLetters = puzzle.wordLength === 6;
        const hasNext = hasValidNextMove(word, updatedUsedWords, puzzle.wordLength, allowTwoLetters);
        
        if (!hasNext) {
          toast({
            title: "Dead End!",
            description: "This word has no valid next moves. You're stuck!",
            variant: "destructive",
            duration: 4000,
          });
        }
      }

      // Check win condition
      if (word === puzzle.goalWord) {
        setGameCompleted(true);
        setGameWon(true);
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
        // Save session to backend
        saveSessionToSupabase(
          puzzle.date,
          puzzle.wordLength,
          updatedMoves,
          true,
          true,
          0,
          invalidGuessCount
        );
      } else if (updatedMoves.length >= puzzle.maxMoves) {
        // Out of moves
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
        // Save session to backend
        saveSessionToSupabase(
          puzzle.date,
          puzzle.wordLength,
          updatedMoves,
          true,
          false,
          0,
          invalidGuessCount
        );
      } else {
        // Save in-progress state
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
  };

  const handleSubmit = () => {
    if (!currentInput.trim() || gameCompleted || isLoading) return;
    submitGuess(currentInput.trim().toUpperCase());
  };

  const handleKeyPress = (key: string) => {
    if (currentInput.length < puzzle.wordLength) {
      setCurrentInput(currentInput + key);
    }
  };

  const handleBackspace = () => {
    setCurrentInput(currentInput.slice(0, -1));
  };

  const handleDoubleSwap = () => {
    if (doubleSwapUsed || gameCompleted) return;
    setDoubleSwapActive(!doubleSwapActive);
    if (letterSwapActive) {
      setLetterSwapActive(false);
      setSwapSelection([]);
    }
  };

  const handleLetterSwap = () => {
    if (letterSwapUsed || gameCompleted) return;
    const newState = !letterSwapActive;
    setLetterSwapActive(newState);
    setSwapSelection([]); // Clear selection when toggling
    if (doubleSwapActive) {
      setDoubleSwapActive(false);
    }
    
    // If we have a full swap selection when toggling off, perform the swap
    if (!newState && swapSelection.length === 2) {
      const wordArray = currentWord.split('');
      const [i, j] = swapSelection;
      [wordArray[i], wordArray[j]] = [wordArray[j], wordArray[i]];
      const swappedWord = wordArray.join('');
      
      // Validate and submit the swapped word
      if (isValidWord(swappedWord, puzzle.wordLength)) {
        submitGuess(swappedWord);
        setLetterSwapUsed(true);
      } else {
        setError("Swapped word is not valid");
        setLetterSwapUsed(true);
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    }
  };

  const handleTileClick = (index: number) => {
    if (!letterSwapActive || gameCompleted) return;
    
    const newSelection = [...swapSelection];
    const existingIndex = newSelection.indexOf(index);
    
    if (existingIndex >= 0) {
      // Deselect if already selected
      newSelection.splice(existingIndex, 1);
    } else if (newSelection.length < 2) {
      // Select if less than 2 selected
      newSelection.push(index);
    }
    
    setSwapSelection(newSelection);
  };

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

  const updateStats = (won: boolean, movesCount: number) => {
    const newStats = { ...stats };
    const lengthKey = puzzle.wordLength as 4 | 5;
    
    // Update overall stats
    newStats.overall.played += 1;
    if (won) {
      newStats.overall.won += 1;
      newStats.overall.distribution[movesCount - 1] += 1;
      if (settings.hardMode) {
        newStats.overall.hardModeStreak += 1;
      }
    }
    
    // Update per-length stats
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
    
    // Update overall streak (win in ANY length counts)
    const today = puzzle.date;
    if (stats.lastPlayedDate !== today) {
      // New day
      if (won) {
        newStats.overall.currentStreak += 1;
        newStats.overall.maxStreak = Math.max(newStats.overall.maxStreak, newStats.overall.currentStreak);
      } else if (!hasWonAnyLengthToday(today)) {
        newStats.overall.currentStreak = 0;
      }
    } else if (won && newStats.overall.currentStreak === 0) {
      // First win today after a loss
      newStats.overall.currentStreak = 1;
    }
    
    newStats.lastPlayedDate = today;
    setStats(newStats);
    saveStats(newStats);
    syncStatsToSupabase();
  };
  
  const hasWonAnyLengthToday = (date: string): boolean => {
    const lengths: Array<4 | 5 | 6> = [4, 5, 6];
    return lengths.some(length => {
      const state = loadGameState(length);
      return state?.date === date && state?.won;
    });
  };

  const handlePlayAgain = () => {
    // Reset game (practice mode)
    setMoves([]);
    setCurrentWord(puzzle.startWord);
    setUsedWords(new Set([puzzle.startWord]));
    setGameCompleted(false);
    setGameWon(false);
    setError("");
    setCurrentInput("");
    setInvalidGuessCount(0);
    setDoubleSwapUsed(false);
    setLetterSwapUsed(false);
    setDoubleSwapActive(false);
    setLetterSwapActive(false);
    setSwapSelection([]);
    clearGameState(puzzle.wordLength);
  };

  const handleToggleSetting = (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    saveSettings(newSettings);
    syncStatsToSupabase();
  };

  const handleChangeBackgroundTheme = (theme: BackgroundTheme) => {
    const newSettings = { ...settings, backgroundTheme: theme };
    setSettings(newSettings);
    saveSettings(newSettings);
    
    // Apply theme to document root - with safety check
    const themeConfig = backgroundThemes[theme];
    if (themeConfig) {
      document.documentElement.style.setProperty('--background', themeConfig.bg);
    }
  };

  // Apply saved theme on mount
  useEffect(() => {
    const savedTheme = settings.backgroundTheme as BackgroundTheme;
    // Validate that the saved theme exists, fallback to midnight if not
    const validTheme = savedTheme && backgroundThemes[savedTheme] ? savedTheme : "midnight";
    const themeColor = backgroundThemes[validTheme].bg;
    document.documentElement.style.setProperty('--background', themeColor);
    
    // Update settings if theme was invalid
    if (validTheme !== savedTheme) {
      const newSettings = { ...settings, backgroundTheme: validTheme };
      setSettings(newSettings);
      saveSettings(newSettings);
    }
  }, []);

  const handleResetData = () => {
    if (confirm("Are you sure? This will erase all your stats and progress.")) {
      resetAllData();
      setStats(loadStats());
      setSettings(loadSettings());
      setMoves([]);
      setCurrentWord(puzzle.startWord);
      setUsedWords(new Set([puzzle.startWord]));
      setGameCompleted(false);
      setGameWon(false);
      setMenuOpen(false);
      toast({ title: "All data has been reset" });
    }
  };

  const handleDisputeWord = (word: string) => {
    setDisputedWord(word);
    setDisputeOpen(true);
  };

  const handleSubmitDispute = (word: string, reason: string) => {
    saveDispute({ word, reason });
    toast({ 
      title: "Report Submitted", 
      description: "Thank you for helping us improve word quality!" 
    });
  };

  // Define getLengthStatus before using it in useMemo
  const getLengthStatus = (length: 4 | 5): "empty" | "won" | "failed" | "in-progress" => {
    const state = loadGameState(length);
    if (!state || state.date !== puzzle.date) return "empty";
    if (state.completed) return state.won ? "won" : "failed";
    if (state.moves.length > 0) return "in-progress";
    return "empty";
  };

  // Memoize expensive share text generation
  const shareText = useMemo(() => 
    moves.length > 0 
      ? generateShareText(
          puzzle.date,
          moves.length,
          gameWon,
          puzzle.wordLength,
          moves.map((m) => m.hints),
          puzzle.maxMoves,
          puzzle.puzzleIndex || 0
        )
      : "",
    [moves.length, gameWon, puzzle.date, puzzle.wordLength, puzzle.maxMoves, puzzle.puzzleIndex, moves]
  );

  // Memoize length status checks to avoid repeated localStorage reads
  const lengthStatuses = useMemo(() => ({
    4: getLengthStatus(4),
    5: getLengthStatus(5),
  }), [puzzle.date]);

  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto pb-[280px] md:pb-24">
      <GameHeader
        onOpenSettings={() => setMenuOpen(true)}
        onOpenStats={() => setStatsOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
      />

      <PuzzleTopBar
        puzzleNumber={puzzle.puzzleIndex || 0}
        date={puzzle.date}
        movesUsed={moves.length}
        moveCap={puzzle.maxMoves}
      />

      <div className="px-3 py-2 md:px-4 md:py-3">
        <LengthPills
          selectedLength={selectedLength}
          onLengthChange={handleLengthChange}
          statuses={lengthStatuses}
        />
      </div>

      <main className="flex-1">
        <PuzzleHero
          startWord={puzzle.startWord}
          goalWord={puzzle.goalWord}
          movesUsed={moves.length}
          maxMoves={puzzle.maxMoves}
        />

        {!gameCompleted && moves.length === 0 && (
          <div className="px-3 mb-3 md:px-6 md:mb-4">
            <div className="bg-card border border-primary/20 rounded-lg p-3 text-sm animate-slide-in md:p-4">
              <div className="flex items-start gap-2 md:gap-3">
                <div className="text-xl md:text-2xl">💡</div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground text-xs md:text-sm">
                     {puzzle.wordLength === 4 ? (
                      <>Change <strong>ONE</strong> letter each step. Every step must be a real word.</>
                    ) : puzzle.wordLength === 5 ? (
                      <>Change <strong>ONE</strong> letter each step. Use power-ups to change two letters or swap positions. Every step must be a real word.</>
                    ) : (
                      <>Change <strong>ONE or TWO</strong> letters each step. Every step must be a real word.</>
                    )}
                  </p>
                  <p className="text-muted-foreground text-[11px] md:text-xs">
                    Example: COLD → C<span className="text-warning">O</span>RD → C<span className="text-warning">A</span>RD → C<span className="text-warning">A</span>R<span className="text-warning">E</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!gameCompleted && (
          <>
            {puzzle.wordLength === 5 && (
              <MorphPowerups
                doubleSwapUsed={doubleSwapUsed}
                letterSwapUsed={letterSwapUsed}
                doubleSwapActive={doubleSwapActive}
                letterSwapActive={letterSwapActive}
                onDoubleSwap={handleDoubleSwap}
                onLetterSwap={handleLetterSwap}
                disabled={gameCompleted}
              />
            )}
            
            <div className="px-3 py-3 space-y-2 md:px-6 md:py-4 md:space-y-3">
              {letterSwapActive && (
                <div className="bg-primary/10 border border-primary rounded-lg p-3 mb-3 text-sm animate-fade-in">
                  <p className="text-center font-medium">
                    Tap two letters on the current word to swap their positions
                  </p>
                </div>
              )}
              
              {letterSwapActive && (
                <div className={`flex gap-2 justify-center mb-3 ${shake ? 'animate-shake' : ''}`}>
                  {currentWord.split('').map((letter, index) => (
                    <button
                      key={index}
                      onClick={() => handleTileClick(index)}
                      className={`
                        w-12 h-12 md:w-14 md:h-14 rounded-lg font-mono font-bold text-lg
                        transition-all duration-200 border-2
                        ${swapSelection.includes(index)
                          ? 'bg-primary text-primary-foreground border-primary scale-110 shadow-lg'
                          : 'bg-card border-border hover:border-primary hover:scale-105'
                        }
                      `}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              )}
              
              {!letterSwapActive && (
                <div className="space-y-2 md:space-y-3">
                  <div className="flex gap-1.5 md:gap-2">
                    <Input
                      value={currentWord}
                      disabled
                      className="flex-1 font-mono uppercase tracking-tiles bg-muted/30 border-muted cursor-not-allowed text-sm md:text-base h-10 md:h-11"
                      placeholder="Previous"
                      aria-label="Previous word"
                    />
                    
                    <span className="flex items-center text-lg md:text-2xl text-muted-foreground">→</span>
                    
                    <Input
                      value={currentInput}
                      onChange={(e) => {
                        if (!settings.useOnScreenKeyboard) {
                          const value = e.target.value.toUpperCase();
                          if (value.length <= currentWord.length) {
                            setCurrentInput(value);
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (!settings.useOnScreenKeyboard && e.key === 'Enter') {
                          handleSubmit();
                        }
                      }}
                      disabled={settings.useOnScreenKeyboard ?? true}
                      className="flex-1 font-mono uppercase tracking-tiles text-sm md:text-base h-10 md:h-11 bg-background"
                      placeholder="..."
                      maxLength={currentWord.length}
                      aria-label="Next word"
                      autoFocus={!settings.useOnScreenKeyboard}
                    />
                  </div>

                  <div className="flex items-center text-xs md:text-sm">
                    <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                      {error && (
                        <div
                          className="flex items-center gap-1 md:gap-1.5 text-destructive animate-slide-in truncate"
                          role="alert"
                        >
                          <AlertCircle className="h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0" />
                          <span className="truncate text-[11px] md:text-sm">{error}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <MoveLog
          moves={moves}
          simpleMode={simpleMode}
          colorblindMode={settings.colorblindMode}
          onDisputeWord={handleDisputeWord}
        />

        {gameCompleted && (
          <ResultPanel
            won={gameWon}
            movesUsed={moves.length}
            goalWord={puzzle.goalWord}
            minDistance={puzzle.minDistance}
            shareText={shareText}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </main>

      {/* Fixed keyboard at bottom */}
      {!gameCompleted && settings.useOnScreenKeyboard && (
        <div className="fixed bottom-2 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border pb-safe">
          <OnScreenKeyboard
            onKeyPress={handleKeyPress}
            onBackspace={handleBackspace}
            onEnter={handleSubmit}
            disabled={gameCompleted || isLoading}
            usedLetters={usedLetters}
            correctLetters={correctLetters}
            wrongPositionLetters={wrongPositionLetters}
          />
        </div>
      )}

      <footer className="hidden md:block fixed bottom-0 left-0 right-0 bg-card border-t border-border py-2 px-3 md:py-4 md:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs md:text-sm text-muted-foreground">
            New puzzle in {getTimeUntilMidnight()}
          </p>
        </div>
      </footer>

      <GameMenuSheet
        open={menuOpen}
        onOpenChange={setMenuOpen}
        hardMode={settings.hardMode}
        onToggleHardMode={() => handleToggleSetting("hardMode")}
        colorblindMode={settings.colorblindMode}
        onToggleColorblindMode={() => handleToggleSetting("colorblindMode")}
        vibration={settings.vibration}
        onToggleVibration={() => handleToggleSetting("vibration")}
        useOnScreenKeyboard={settings.useOnScreenKeyboard ?? true}
        onToggleOnScreenKeyboard={() => handleToggleSetting("useOnScreenKeyboard")}
        backgroundTheme={(settings.backgroundTheme as BackgroundTheme) || "midnight"}
        onChangeBackgroundTheme={handleChangeBackgroundTheme}
        onResetData={handleResetData}
      />

      <HowToPlayModal open={helpOpen} onOpenChange={setHelpOpen} />

      <WordDisputeModal 
        open={disputeOpen} 
        onOpenChange={setDisputeOpen}
        word={disputedWord}
        onSubmitDispute={handleSubmitDispute}
      />

      <StatsModal
        open={statsOpen}
        onOpenChange={setStatsOpen}
        stats={stats}
      />
    </div>
  );
};

const getTimeUntilMidnight = (): string => {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
};

export default Index;
