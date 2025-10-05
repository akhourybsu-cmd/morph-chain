import { useState, useEffect } from "react";
import { GameHeader } from "@/components/GameHeader";
import { DailyBanner } from "@/components/DailyBanner";
import { PuzzleHero } from "@/components/PuzzleHero";
import { InputRow } from "@/components/InputRow";
import { MoveLog, Move } from "@/components/MoveLog";
import { ResultPanel } from "@/components/ResultPanel";
import { SettingsModal } from "@/components/SettingsModal";
import { StatsModal } from "@/components/StatsModal";
import { HowToPlayModal } from "@/components/HowToPlayModal";
import { LengthSwitcher } from "@/components/LengthSwitcher";
import { useToast } from "@/hooks/use-toast";
import {
  getDailyPuzzle,
  isValidWord,
  isOneLetterDifferent,
  getHints,
  calculateDistance,
  generateShareText,
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
  const [showHints, setShowHints] = useState(false);

  // Modals
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Settings
  const [settings, setSettings] = useState(loadSettings());
  const [stats, setStats] = useState(loadStats());

  // Handle length change
  const handleLengthChange = (newLength: 4 | 5 | 6) => {
    setSelectedLength(newLength);
    const newPuzzle = getDailyPuzzle(newLength);
    setPuzzle(newPuzzle);
    
    // Load saved state for this length
    const savedState = loadGameState(newLength);
    if (savedState && savedState.date === newPuzzle.date && savedState.wordLength === newLength) {
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
      // Reset for new puzzle
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
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      // Validation
      if (!isOneLetterDifferent(currentWord, word)) {
        setError("Must change exactly one letter.");
        setIsLoading(false);
        return;
      }

      if (!isValidWord(word, puzzle.wordLength)) {
        setError("Not in word list.");
        setIsLoading(false);
        return;
      }

      if (usedWords.has(word)) {
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
      setMoves(updatedMoves);
      setCurrentWord(word);
      setUsedWords(new Set([...usedWords, word]));

      // Vibration feedback
      if (settings.vibration && navigator.vibrate) {
        navigator.vibrate(closerToGoal ? 10 : 20);
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
    clearGameState(puzzle.wordLength);
  };

  const handleToggleSetting = (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

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

  const shareText = generateShareText(
    puzzle.date,
    moves.length,
    gameWon,
    puzzle.wordLength,
    moves.slice(0, 2).map((m) => m.hints)
  );

  const getLengthStatus = (length: 4 | 5 | 6): "empty" | "won" | "failed" | "in-progress" => {
    const state = loadGameState(length);
    if (!state || state.date !== puzzle.date) return "empty";
    if (state.completed) return state.won ? "won" : "failed";
    if (state.moves.length > 0) return "in-progress";
    return "empty";
  };

  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto">
      <GameHeader
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenStats={() => setStatsOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
      />

      <div className="px-4 py-3 space-y-3">
        <LengthSwitcher
          selectedLength={selectedLength}
          onLengthChange={handleLengthChange}
          statuses={{
            4: getLengthStatus(4),
            5: getLengthStatus(5),
            6: getLengthStatus(6),
          }}
        />

        <DailyBanner
          date={puzzle.date}
          wordLength={puzzle.wordLength}
          maxMoves={puzzle.maxMoves}
          hardMode={settings.hardMode}
          onToggleHardMode={() => handleToggleSetting("hardMode")}
        />
      </div>

      <main className="flex-1 pb-24">
        <PuzzleHero
          startWord={puzzle.startWord}
          goalWord={puzzle.goalWord}
          movesUsed={moves.length}
          maxMoves={puzzle.maxMoves}
          onToggleHints={() => setShowHints(!showHints)}
          showHints={showHints}
        />

        {!gameCompleted && moves.length === 0 && (
          <div className="px-4 mb-4">
            <div className="bg-muted/50 border border-border rounded-lg p-3 text-sm text-muted-foreground animate-fade-in">
              💡 <strong>Tip:</strong> Change ONE letter each step (e.g., COLD → CORD)
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
          />
        )}

        <MoveLog
          moves={moves}
          showHints={showHints}
          colorblindMode={settings.colorblindMode}
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

      <footer className="fixed bottom-0 left-0 right-0 bg-card border-t border-border py-4 px-6">
        <div className="max-w-2xl mx-auto text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            New puzzle in {getTimeUntilMidnight()}
          </p>
          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">
              About
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Contact
            </a>
          </div>
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
        onResetData={handleResetData}
      />

      <HowToPlayModal open={helpOpen} onOpenChange={setHelpOpen} />

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
