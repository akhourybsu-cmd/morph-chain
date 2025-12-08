import { useState, useEffect, useMemo, useRef } from "react";
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
import { ChainAchievementPopup } from "@/components/chain/ChainAchievementPopup";
import { WinCelebration } from "@/components/chain/WinCelebration";
import { AchievementGallery } from "@/components/chain/AchievementGallery";

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
import {
  checkChainAchievements,
  getChainAchievements,
  getNewChainAchievements,
  saveChainAchievements,
  ChainAchievementContext,
} from "@/lib/chainAchievements";

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

  // Achievement and celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const [achievementQueue, setAchievementQueue] = useState<string[]>([]);
  const [currentAchievement, setCurrentAchievement] = useState<string | null>(null);
  const gameStartTime = useRef<number>(Date.now());

  // Power-ups removed for Core spec - 5L now uses same rules as 4L

  // Modals
  const [menuOpen, setMenuOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputedWord, setDisputedWord] = useState<string | undefined>();
  const [achievementsOpen, setAchievementsOpen] = useState(false);

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
    // Core spec: 4L and 5L both require exactly one letter change
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

      // Hard mode check
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

      // Vibration feedback
      if (settings.vibration && navigator.vibrate) {
        navigator.vibrate(closerToGoal ? 10 : 20);
      }

      // Check for dead-end (word with no valid next moves)
      if (word !== puzzle.goalWord && updatedMoves.length < puzzle.maxMoves) {
        // Core spec: both 4L and 5L use one-letter changes only
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

      // Check win condition
      if (word === puzzle.goalWord) {
        setGameCompleted(true);
        setGameWon(true);
        setShowCelebration(true);
        
        // Calculate time elapsed
        const timeElapsedSeconds = Math.floor((Date.now() - gameStartTime.current) / 1000);
        
        // Check for worse moves (moved away from goal)
        const hadWorseMove = updatedMoves.some(m => m.isWorse);
        
        // Get updated stats for achievement checking
        const currentStats = loadStats();
        const lengthKey = puzzle.wordLength as 4 | 5;
        const newTotalWins = currentStats.overall.won + 1;
        const newStreak = currentStats.byLength[lengthKey].currentStreak + 1;
        
        // Check if won both lengths today
        const otherLength = puzzle.wordLength === 4 ? 5 : 4;
        const otherState = loadGameState(otherLength);
        const wonBothToday = otherState?.date === puzzle.date && otherState?.won === true;
        
        // Check achievements
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
    const lengths: Array<4 | 5> = [4, 5];
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
    setShowCelebration(false);
    setAchievementQueue([]);
    setCurrentAchievement(null);
    setError("");
    setCurrentInput("");
    setInvalidGuessCount(0);
    gameStartTime.current = Date.now();
    clearGameState(puzzle.wordLength);
  };

  // Handle achievement queue
  useEffect(() => {
    if (achievementQueue.length > 0 && !currentAchievement) {
      // Show next achievement after a delay
      const timer = setTimeout(() => {
        setCurrentAchievement(achievementQueue[0]);
        setAchievementQueue(prev => prev.slice(1));
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [achievementQueue, currentAchievement]);

  const handleAchievementComplete = () => {
    setCurrentAchievement(null);
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
          puzzle.puzzleIndex || 0,
          puzzle.minDistance,
          stats.byLength[selectedLength].currentStreak
        )
      : "",
    [moves.length, gameWon, puzzle.date, puzzle.wordLength, puzzle.maxMoves, puzzle.puzzleIndex, puzzle.minDistance, stats.byLength, selectedLength, moves]
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
        streak={stats.byLength[selectedLength].currentStreak}
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
            <div className="bg-card border border-chain/20 rounded-lg p-3 text-sm animate-fade-in md:p-4">
              <div className="flex items-start gap-2 md:gap-3">
                <div className="text-xl md:text-2xl">💡</div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground text-xs md:text-sm">
                    Change <strong className="text-chain">ONE</strong> letter each step. Every step must be a real word.
                  </p>
                  <p className="text-muted-foreground text-[11px] md:text-xs">
                    Example: COLD → C<span className="text-chain">O</span>RD → C<span className="text-chain">A</span>RD → C<span className="text-chain">A</span>R<span className="text-chain">E</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!gameCompleted && (
          <>
            <div className="px-3 py-3 space-y-2 md:px-6 md:py-4 md:space-y-3">
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
            streak={stats.byLength[selectedLength].currentStreak}
          />
        )}
        
        {/* Win celebration effects */}
        {showCelebration && gameWon && (
          <WinCelebration
            movesUsed={moves.length}
            minDistance={puzzle.minDistance}
            streak={stats.byLength[selectedLength].currentStreak}
          />
        )}
        
        {/* Achievement popup */}
        {currentAchievement && (
          <ChainAchievementPopup
            achievementId={currentAchievement}
            onComplete={handleAchievementComplete}
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

      {/* Footer - visible on desktop always, on mobile when keyboard is hidden */}
      {(gameCompleted || !settings.useOnScreenKeyboard) && (
        <footer className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border py-3 px-3 md:py-4 md:px-6 z-10">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xs md:text-sm text-muted-foreground">
              New puzzle in {getTimeUntilMidnight()}
            </p>
          </div>
        </footer>
      )}
      {!gameCompleted && settings.useOnScreenKeyboard && (
        <footer className="hidden md:block fixed bottom-0 left-0 right-0 bg-card border-t border-border py-4 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-sm text-muted-foreground">
              New puzzle in {getTimeUntilMidnight()}
            </p>
          </div>
        </footer>
      )}

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
        onOpenAchievements={() => setAchievementsOpen(true)}
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

      <AchievementGallery
        open={achievementsOpen}
        onOpenChange={setAchievementsOpen}
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
