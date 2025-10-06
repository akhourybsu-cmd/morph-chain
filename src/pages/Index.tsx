import { useState, useEffect, useMemo } from "react";
import { GameHeader } from "@/components/GameHeader";
import { DailyBanner } from "@/components/DailyBanner";
import { PuzzleHero } from "@/components/PuzzleHero";
import { InputRow } from "@/components/InputRow";
import { MoveLog, Move } from "@/components/MoveLog";
import { ResultPanel } from "@/components/ResultPanel";
import { SettingsModal, backgroundThemes, BackgroundTheme } from "@/components/SettingsModal";
import { StatsModal } from "@/components/StatsModal";
import { HowToPlayModal } from "@/components/HowToPlayModal";
import { WordDisputeModal } from "@/components/WordDisputeModal";
import { LengthSwitcher } from "@/components/LengthSwitcher";
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
  const { toast } = useToast();
  const [selectedLength, setSelectedLength] = useState<4 | 5 | 6>(4);
  const [puzzle, setPuzzle] = useState(getDailyPuzzle(4));
  const [moves, setMoves] = useState<Move[]>([]);
  const [currentWord, setCurrentWord] = useState(puzzle.startWord);
  const [usedWords, setUsedWords] = useState(new Set([puzzle.startWord]));
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [simpleMode, setSimpleMode] = useState(false);

  // Modals
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputedWord, setDisputedWord] = useState<string | undefined>();

  // Settings
  const [settings, setSettings] = useState(loadSettings());
  const [stats, setStats] = useState(loadStats());
  const [invalidGuessCount, setInvalidGuessCount] = useState(0);

  // Handle length change
  const handleLengthChange = (newLength: 4 | 5 | 6) => {
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

  const handleSubmit = (word: string) => {
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
      // 5L: two letters on first move only
      // 6L: two letters anytime
      const isFirstMove = moves.length === 0;
      const allowTwoLetters = 
        (puzzle.wordLength === 5 && isFirstMove) || 
        (puzzle.wordLength === 6);
      
      const isValid = allowTwoLetters
        ? (isOneLetterDifferent(currentWord, word) || isTwoLettersDifferent(currentWord, word))
        : isOneLetterDifferent(currentWord, word);
      
      if (!isValid) {
        setInvalidGuessCount(prev => prev + 1);
        if (allowTwoLetters) {
          setError("Must change one or two letters.");
        } else {
          setError("Must change exactly one letter.");
        }
        setIsLoading(false);
        return;
      }

      if (!isValidWord(word, puzzle.wordLength)) {
        setInvalidGuessCount(prev => prev + 1);
        setError("Not in word list.");
        setIsLoading(false);
        return;
      }

      if (usedWords.has(word)) {
        setInvalidGuessCount(prev => prev + 1);
        setError("You already used that word.");
        setIsLoading(false);
        return;
      }

      const currentDistance = calculateDistance(currentWord, puzzle.goalWord);
      const newDistance = calculateDistance(word, puzzle.goalWord);
      const closerToGoal = newDistance < currentDistance;
      const isComplete = word === puzzle.goalWord;
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
        to: word,
        hints: getHints(word, puzzle.goalWord),
        closerToGoal,
        isComplete,
        isWorse,
        timestamp: new Date(),
      };

      const updatedMoves = [...moves, newMove];
      const updatedUsedWords = new Set([...usedWords, word]);
      setMoves(updatedMoves);
      setCurrentWord(word);
      setUsedWords(updatedUsedWords);

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
    }, 200);
  };

  const updateStats = (won: boolean, movesCount: number) => {
    const newStats = { ...stats };
    const lengthKey = puzzle.wordLength as 4 | 5 | 6;
    
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
    setInvalidGuessCount(0);
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
      setSettingsOpen(false);
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
  const getLengthStatus = (length: 4 | 5 | 6): "empty" | "won" | "failed" | "in-progress" => {
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
    6: getLengthStatus(6),
  }), [puzzle.date]);

  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto">
      <GameHeader
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenStats={() => setStatsOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
      />

      <div className="px-3 py-2 space-y-2 md:px-4 md:py-3 md:space-y-3">
        <LengthSwitcher
          selectedLength={selectedLength}
          onLengthChange={handleLengthChange}
          statuses={lengthStatuses}
        />

        <DailyBanner
          date={puzzle.date}
          wordLength={puzzle.wordLength}
          maxMoves={puzzle.maxMoves}
          puzzleIndex={puzzle.puzzleIndex || 0}
          hardMode={settings.hardMode}
          onToggleHardMode={() => handleToggleSetting("hardMode")}
        />
      </div>

      <main className="flex-1 pb-16 md:pb-24">
        <PuzzleHero
          startWord={puzzle.startWord}
          goalWord={puzzle.goalWord}
          movesUsed={moves.length}
          maxMoves={puzzle.maxMoves}
          onToggleSimpleMode={() => setSimpleMode(!simpleMode)}
          simpleMode={simpleMode}
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
                      <>Change <strong>ONE or TWO</strong> letters on your first move, then <strong>ONE</strong> letter each step. Every step must be a real word.</>
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
          <InputRow
            previousWord={currentWord}
            onSubmit={handleSubmit}
            error={error}
            disabled={gameCompleted}
            isLoading={isLoading}
            movesUsed={moves.length}
            maxMoves={puzzle.maxMoves}
            wordLength={puzzle.wordLength}
          />
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

      <footer className="fixed bottom-0 left-0 right-0 bg-card border-t border-border py-2 px-3 md:py-4 md:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs md:text-sm text-muted-foreground">
            New puzzle in {getTimeUntilMidnight()}
          </p>
        </div>
      </footer>

      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        hardMode={settings.hardMode}
        onToggleHardMode={() => handleToggleSetting("hardMode")}
        colorblindMode={settings.colorblindMode}
        onToggleColorblindMode={() => handleToggleSetting("colorblindMode")}
        vibration={settings.vibration}
        onToggleVibration={() => handleToggleSetting("vibration")}
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
