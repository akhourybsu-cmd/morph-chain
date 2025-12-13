import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChainPrestigeHeader } from "@/components/chain/ChainPrestigeHeader";
import { ChainLengthTabs } from "@/components/chain/ChainLengthTabs";
import { ChainPuzzleDisplay } from "@/components/chain/ChainPuzzleDisplay";
import { ChainInstructionText } from "@/components/chain/ChainInstructionText";
import { ChainInputRow } from "@/components/chain/ChainInputRow";
import { ChainMoveHistory } from "@/components/chain/ChainMoveHistory";
import { ChainResultsPanel } from "@/components/chain/ChainResultsPanel";
import { GameMenuSheet } from "@/components/GameMenuSheet";
import { backgroundThemes, BackgroundTheme } from "@/components/SettingsModal";
import { StatsModal } from "@/components/StatsModal";
import { HowToPlayModal } from "@/components/HowToPlayModal";
import { WordDisputeModal } from "@/components/WordDisputeModal";
import { ChainAchievementPopup } from "@/components/chain/ChainAchievementPopup";
import { WinCelebration } from "@/components/chain/WinCelebration";
import { AchievementGallery } from "@/components/chain/AchievementGallery";
import { MorphPowerups } from "@/components/MorphPowerups";
import OnScreenKeyboard from "@/components/OnScreenKeyboard";
import { useChainLayout } from "@/hooks/useChainLayout";

import { useToast } from "@/hooks/use-toast";
import { useChainSettings } from "@/hooks/useChainSettings";
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
import {
  playMorphSuccess,
  playMorphError,
  playWin,
  playLose,
  initAudio as initChainAudio,
} from "@/lib/chain/audioManager";

interface Move {
  id: string;
  from: string;
  to: string;
  hints: Array<"match" | "present" | "miss">;
  closerToGoal: boolean;
  isComplete: boolean;
  isWorse: boolean;
  timestamp: Date;
}

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings: audioSettings, toggleSound } = useChainSettings();
  const [selectedLength, setSelectedLength] = useState<4 | 5>(4);
  const layout = useChainLayout(selectedLength);
  const inputRowRef = useRef<HTMLDivElement>(null);
  const [puzzle, setPuzzle] = useState(getDailyPuzzle(4));
  const [moves, setMoves] = useState<Move[]>([]);
  const [currentWord, setCurrentWord] = useState(puzzle.startWord);
  const [usedWords, setUsedWords] = useState(new Set([puzzle.startWord]));
  const [currentInput, setCurrentInput] = useState("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  // Achievement and celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const [achievementQueue, setAchievementQueue] = useState<string[]>([]);
  const [currentAchievement, setCurrentAchievement] = useState<string | null>(null);
  const gameStartTime = useRef<number>(Date.now());

  // Double Swap power-up for 5L only - earned after 3 consecutive single-letter moves
  const [doubleSwapUsed, setDoubleSwapUsed] = useState(false);
  const [consecutiveSingleSwaps, setConsecutiveSingleSwaps] = useState(0);
  const doubleSwapReady = consecutiveSingleSwaps >= 3 && !doubleSwapUsed;
  
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

  // Initialize audio on first interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      initChainAudio();
      window.removeEventListener('click', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    return () => window.removeEventListener('click', handleFirstInteraction);
  }, []);

  // Handle length change
  const handleLengthChange = (newLength: 4 | 5) => {
    setSelectedLength(newLength);
    const newPuzzle = getDailyPuzzle(newLength);
    setPuzzle(newPuzzle);
    setInvalidGuessCount(0);
    
    // Load saved state for this length
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
    setDoubleSwapUsed(false);
    setConsecutiveSingleSwaps(0);
  };

  // Load saved game state on mount
  useEffect(() => {
    handleLengthChange(selectedLength);
    
    const hasSeenHelp = localStorage.getItem("morphchain_seen_help");
    if (!hasSeenHelp) {
      setHelpOpen(true);
      localStorage.setItem("morphchain_seen_help", "true");
    }
  }, []);

  const submitGuess = (word: string) => {
    const wordToSubmit = word;
    setError("");
    
    if (isRateLimited('guess')) {
      setError("Too many attempts. Please wait a moment.");
      return;
    }
    
    setIsLoading(true);

    setTimeout(() => {
      const isOneDiff = isOneLetterDifferent(currentWord, wordToSubmit);
      const isTwoDiff = isTwoLettersDifferent(currentWord, wordToSubmit);
      
      const allowTwoLetters = selectedLength === 5 && doubleSwapReady;
      const isValid = allowTwoLetters ? (isOneDiff || isTwoDiff) : isOneDiff;
      
      if (!isValid) {
        setInvalidGuessCount(prev => prev + 1);
        const errorMsg = allowTwoLetters 
          ? "Must change 1 or 2 letters" 
          : "Must change exactly 1 letter";
        setError(errorMsg);
        setCurrentInput("");
        setIsLoading(false);
        if (audioSettings.soundEnabled) playMorphError();
        return;
      }

      if (!isValidWord(wordToSubmit, puzzle.wordLength)) {
        setInvalidGuessCount(prev => prev + 1);
        setError("Not in our modern-English list");
        setCurrentInput("");
        setIsLoading(false);
        if (audioSettings.soundEnabled) playMorphError();
        return;
      }

      if (usedWords.has(wordToSubmit)) {
        setInvalidGuessCount(prev => prev + 1);
        setError("Already used");
        setCurrentInput("");
        setIsLoading(false);
        if (audioSettings.soundEnabled) playMorphError();
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
        if (audioSettings.soundEnabled) playMorphError();
        return;
      }

      // Proactive dead-end check BEFORE committing the move
      const wouldBeUsedWords = new Set([...usedWords, wordToSubmit]);
      const canUseTwoLetters = selectedLength === 5 && !doubleSwapUsed && !(isTwoDiff && doubleSwapReady);
      const wouldHaveNextMove = wordToSubmit === puzzle.goalWord || 
        (moves.length + 1 >= puzzle.maxMoves) || 
        hasValidNextMove(wordToSubmit, wouldBeUsedWords, puzzle.wordLength, canUseTwoLetters);
      
      if (!wouldHaveNextMove) {
        toast({
          title: "⚠️ Dead End Ahead",
          description: "This move leaves no valid next steps. Consider a different word.",
          variant: "destructive",
          duration: 5000,
        });
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

      // Consume double swap ONLY after a valid two-letter move is committed
      if (selectedLength === 5) {
        if (isTwoDiff && doubleSwapReady) {
          setDoubleSwapUsed(true);
          setConsecutiveSingleSwaps(0);
        } else if (isOneDiff) {
          setConsecutiveSingleSwaps(prev => prev + 1);
        }
      }

      // Play success sound for valid morph
      if (audioSettings.soundEnabled) playMorphSuccess();

      if (settings.vibration && navigator.vibrate) {
        navigator.vibrate(closerToGoal ? 10 : 20);
      }

      if (word === puzzle.goalWord) {
        setGameCompleted(true);
        setGameWon(true);
        setShowCelebration(true);
        if (audioSettings.soundEnabled) playWin();
        
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
      } else if (updatedMoves.length >= puzzle.maxMoves) {
        setGameCompleted(true);
        setGameWon(false);
        if (audioSettings.soundEnabled) playLose();
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
    if (stats.lastPlayedDate !== today) {
      if (won) {
        newStats.overall.currentStreak += 1;
        newStats.overall.maxStreak = Math.max(newStats.overall.maxStreak, newStats.overall.currentStreak);
      } else if (!hasWonAnyLengthToday(today)) {
        newStats.overall.currentStreak = 0;
      }
    } else if (won && newStats.overall.currentStreak === 0) {
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

  // Removed: handlePlayAgain function - users should use archive instead

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
    
    const themeConfig = backgroundThemes[theme];
    if (themeConfig) {
      document.documentElement.style.setProperty('--background', themeConfig.bg);
    }
  };

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

  const getLengthStatus = (length: 4 | 5): "empty" | "won" | "failed" | "in-progress" => {
    const state = loadGameState(length);
    if (!state || state.date !== puzzle.date) return "empty";
    if (state.completed) return state.won ? "won" : "failed";
    if (state.moves.length > 0) return "in-progress";
    return "empty";
  };

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

  const lengthStatuses = useMemo(() => ({
    4: getLengthStatus(4),
    5: getLengthStatus(5),
  }), [puzzle.date]);

  // Calculate keyboard height for proper spacing
  const keyboardHeight = settings.useOnScreenKeyboard && !gameCompleted ? 200 : 0;
  const footerHeight = 48;
  const bottomPadding = keyboardHeight + footerHeight + layout.safeAreaBottom;

  return (
    <div 
      className="min-h-dvh max-h-dvh flex flex-col overflow-hidden"
      style={{ 
        background: 'hsl(var(--chain-page-bg))',
        paddingTop: layout.isIOS ? `${layout.safeAreaTop}px` : 'env(safe-area-inset-top)',
      }}
    >
      <ChainPrestigeHeader
        onOpenMenu={() => setMenuOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
        soundEnabled={audioSettings.soundEnabled}
        onToggleSound={toggleSound}
      />

      <ChainLengthTabs
        selectedLength={selectedLength}
        onLengthChange={handleLengthChange}
        statuses={lengthStatuses}
      />

      <main 
        className="flex-1 max-w-lg mx-auto w-full overflow-y-auto overflow-x-hidden"
        style={{ paddingBottom: `${bottomPadding}px` }}
      >
        <ChainPuzzleDisplay
          startWord={puzzle.startWord}
          goalWord={puzzle.goalWord}
          movesUsed={moves.length}
          maxMoves={puzzle.maxMoves}
        />

        {!gameCompleted && moves.length === 0 && (
          <ChainInstructionText />
        )}

        {!gameCompleted && (
          <div ref={inputRowRef}>
            <ChainInputRow
              currentWord={currentWord}
              wordLength={puzzle.wordLength}
              currentInput={currentInput}
              onInputChange={setCurrentInput}
              onSubmit={handleSubmit}
              error={error}
              disabled={gameCompleted}
              isLoading={isLoading}
              useOnScreenKeyboard={settings.useOnScreenKeyboard}
            />
            
            {/* Double Swap power-up for 5L only */}
            {selectedLength === 5 && (
              <div className="px-[var(--chain-h-padding,16px)]">
                <MorphPowerups
                  doubleSwapUsed={doubleSwapUsed}
                  consecutiveSingleSwaps={consecutiveSingleSwaps}
                  doubleSwapReady={doubleSwapReady}
                  disabled={gameCompleted}
                />
              </div>
            )}
          </div>
        )}

        <ChainMoveHistory
          moves={moves}
          colorblindMode={settings.colorblindMode}
          onDisputeWord={handleDisputeWord}
        />

        {gameCompleted && (
          <ChainResultsPanel
            won={gameWon}
            movesUsed={moves.length}
            goalWord={puzzle.goalWord}
            minDistance={puzzle.minDistance}
            shareText={shareText}
            streak={stats.byLength[selectedLength].currentStreak}
          />
        )}
        
        {showCelebration && gameWon && (
          <WinCelebration
            movesUsed={moves.length}
            minDistance={puzzle.minDistance}
            streak={stats.byLength[selectedLength].currentStreak}
          />
        )}
        
        {currentAchievement && (
          <ChainAchievementPopup
            achievementId={currentAchievement}
            onComplete={handleAchievementComplete}
          />
        )}
      </main>

      {/* Fixed keyboard at bottom */}
      {!gameCompleted && settings.useOnScreenKeyboard && (
        <div className="fixed bottom-0 left-0 right-0 bg-[hsl(var(--chain-page-bg))]/95 backdrop-blur-sm border-t border-[hsl(var(--chain-card-border))] pb-safe">
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

      {/* Footer */}
      {(gameCompleted || !settings.useOnScreenKeyboard) && (
        <footer className="fixed bottom-0 left-0 right-0 bg-[hsl(var(--chain-card-bg))]/95 backdrop-blur-sm border-t border-[hsl(var(--chain-card-border))] py-3 px-3 md:py-4 md:px-6">
          <div className="max-w-lg mx-auto text-center">
            <p className="text-xs text-[hsl(var(--chain-text-muted))]">
              New puzzle in {getTimeUntilMidnight()}
            </p>
          </div>
        </footer>
      )}
      
      {!gameCompleted && settings.useOnScreenKeyboard && (
        <footer className="hidden md:block fixed bottom-0 left-0 right-0 bg-[hsl(var(--chain-card-bg))] border-t border-[hsl(var(--chain-card-border))] py-4 px-6">
          <div className="max-w-lg mx-auto text-center">
            <p className="text-sm text-[hsl(var(--chain-text-muted))]">
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
