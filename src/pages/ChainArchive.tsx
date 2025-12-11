import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays, startOfDay } from "date-fns";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";
import { supabase } from "@/integrations/supabase/client";
import { ChainLengthTabs } from "@/components/chain/ChainLengthTabs";
import { ChainPuzzleDisplay } from "@/components/chain/ChainPuzzleDisplay";
import { ChainInstructionText } from "@/components/chain/ChainInstructionText";
import { ChainInputRow } from "@/components/chain/ChainInputRow";
import { ChainMoveHistory } from "@/components/chain/ChainMoveHistory";
import { ChainResultsPanel } from "@/components/chain/ChainResultsPanel";
import { HowToPlayModal } from "@/components/HowToPlayModal";
import { MorphPowerups } from "@/components/MorphPowerups";
import OnScreenKeyboard from "@/components/OnScreenKeyboard";
import { ArchiveDatePicker } from "@/components/archive/ArchiveDatePicker";
import { useChainLayout } from "@/hooks/useChainLayout";
import { useToast } from "@/hooks/use-toast";
import { useChainSettings } from "@/hooks/useChainSettings";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, HelpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  isValidWord,
  isOneLetterDifferent,
  isTwoLettersDifferent,
  getHints,
  calculateDistance,
  generateShareText,
  hasValidNextMove,
} from "@/lib/gameLogic";
import { CURATED_4L_PUZZLES } from "@/lib/curatedPuzzles4L";
import { CURATED_5L_PUZZLES } from "@/lib/curatedPuzzles5L";
import { loadSettings } from "@/lib/storage";
import { isRateLimited } from "@/lib/rateLimit";
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

interface Puzzle {
  date: string;
  startWord: string;
  goalWord: string;
  wordLength: number;
  maxMoves: number;
  minDistance: number;
  puzzleIndex: number;
}

// Get puzzle for a specific archive date
const getArchivePuzzle = (date: Date, wordLength: 4 | 5): Puzzle => {
  const timezone = "America/New_York";
  const targetDateNY = startOfDay(toZonedTime(date, timezone));
  const dateStr = formatInTimeZone(date, timezone, "yyyy-MM-dd");
  
  const curatedPuzzles = wordLength === 4 ? CURATED_4L_PUZZLES : CURATED_5L_PUZZLES;
  const launchDateNY = startOfDay(toZonedTime(new Date('2025-10-06T00:00:00'), timezone));
  const daysSinceStart = differenceInDays(targetDateNY, launchDateNY);
  const puzzleIndex = Math.abs(daysSinceStart) % curatedPuzzles.length;
  const puzzle = curatedPuzzles[puzzleIndex];
  
  const minDist = puzzle.minDist || (wordLength === 4 ? 4 : 5);
  const moveBonus = 4;
  const maxMoves = Math.min(14, Math.max(10, minDist + moveBonus));
  
  return {
    date: dateStr,
    startWord: puzzle.start.toUpperCase(),
    goalWord: puzzle.goal.toUpperCase(),
    wordLength,
    maxMoves,
    minDistance: minDist,
    puzzleIndex,
  };
};

// Archive-specific storage keys
const getArchiveStateKey = (date: string, length: number) => 
  `morphchain_archive_${date}_${length}`;

const loadArchiveState = (date: string, length: number) => {
  try {
    const key = getArchiveStateKey(date, length);
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const saveArchiveState = (date: string, length: number, state: any) => {
  try {
    const key = getArchiveStateKey(date, length);
    localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save archive state:", error);
  }
};

const ChainArchive = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings: audioSettings } = useChainSettings();
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  // Archive state
  const [archiveDate, setArchiveDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(true);
  
  const [selectedLength, setSelectedLength] = useState<4 | 5>(4);
  const layout = useChainLayout(selectedLength);
  const inputRowRef = useRef<HTMLDivElement>(null);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Sign in required",
          description: "Please sign in to access the puzzle archive.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }
      setIsAuthenticated(true);
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login");
      }
    });
    
    return () => subscription.unsubscribe();
  }, [navigate, toast]);
  
  // Game state
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [moves, setMoves] = useState<Move[]>([]);
  const [currentWord, setCurrentWord] = useState("");
  const [usedWords, setUsedWords] = useState(new Set<string>());
  const [currentInput, setCurrentInput] = useState("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  // Double Swap power-up for 5L only
  const [doubleSwapUsed, setDoubleSwapUsed] = useState(false);
  const [consecutiveSingleSwaps, setConsecutiveSingleSwaps] = useState(0);
  const doubleSwapReady = consecutiveSingleSwaps >= 3 && !doubleSwapUsed;
  
  // Modals
  const [helpOpen, setHelpOpen] = useState(false);

  // Settings
  const [settings] = useState(loadSettings());

  // Initialize audio
  useEffect(() => {
    const handleFirstInteraction = () => {
      initChainAudio();
      window.removeEventListener('click', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    return () => window.removeEventListener('click', handleFirstInteraction);
  }, []);

  // Initialize game when date is selected
  const initializeArchiveGame = (date: Date, length: 4 | 5) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const newPuzzle = getArchivePuzzle(date, length);
    setPuzzle(newPuzzle);
    
    // Try to load saved archive state
    const savedState = loadArchiveState(dateStr, length);
    if (savedState && savedState.moves?.length > 0) {
      const restoredMoves: Move[] = savedState.moves.map((m: any, i: number) => {
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
      setUsedWords(new Set([newPuzzle.startWord, ...savedState.moves.map((m: any) => m.to)]));
      setGameCompleted(savedState.completed || false);
      setGameWon(savedState.won || false);
    } else {
      setMoves([]);
      setCurrentWord(newPuzzle.startWord);
      setUsedWords(new Set([newPuzzle.startWord]));
      setGameCompleted(false);
      setGameWon(false);
    }
    
    setError("");
    setDoubleSwapUsed(false);
    setConsecutiveSingleSwaps(0);
    setCurrentInput("");
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setArchiveDate(date);
    setShowDatePicker(false);
    initializeArchiveGame(date, selectedLength);
  };

  // Handle length change
  const handleLengthChange = (newLength: 4 | 5) => {
    setSelectedLength(newLength);
    if (archiveDate) {
      initializeArchiveGame(archiveDate, newLength);
    }
  };

  const submitGuess = (word: string) => {
    if (!puzzle || !archiveDate) return;
    
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
        const errorMsg = allowTwoLetters 
          ? "Must change 1 or 2 letters" 
          : "Must change exactly 1 letter";
        setError(errorMsg);
        setCurrentInput("");
        setIsLoading(false);
        if (audioSettings.soundEnabled) playMorphError();
        return;
      }
      
      if (selectedLength === 5) {
        if (isTwoDiff && doubleSwapReady) {
          setDoubleSwapUsed(true);
          setConsecutiveSingleSwaps(0);
        } else if (isOneDiff) {
          setConsecutiveSingleSwaps(prev => prev + 1);
        }
      }

      if (!isValidWord(wordToSubmit, puzzle.wordLength)) {
        setError("Not in our modern-English list");
        setCurrentInput("");
        setIsLoading(false);
        if (audioSettings.soundEnabled) playMorphError();
        return;
      }

      if (usedWords.has(wordToSubmit)) {
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
        setError("Hard Mode: must get closer each step.");
        setIsLoading(false);
        if (audioSettings.soundEnabled) playMorphError();
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

      if (audioSettings.soundEnabled) playMorphSuccess();

      if (settings.vibration && navigator.vibrate) {
        navigator.vibrate(closerToGoal ? 10 : 20);
      }

      if (word !== puzzle.goalWord && updatedMoves.length < puzzle.maxMoves) {
        const canUseTwoLetters = selectedLength === 5 && !doubleSwapUsed;
        const hasNext = hasValidNextMove(word, updatedUsedWords, puzzle.wordLength, canUseTwoLetters);
        
        if (!hasNext) {
          toast({
            title: "Dead End!",
            description: "This word has no valid next moves. You're stuck!",
            variant: "destructive",
            duration: 4000,
          });
        }
      }

      const dateStr = format(archiveDate, "yyyy-MM-dd");
      
      if (word === puzzle.goalWord) {
        setGameCompleted(true);
        setGameWon(true);
        if (audioSettings.soundEnabled) playWin();
        
        // Save archive state (NO stats, NO achievements, NO backend sync)
        saveArchiveState(dateStr, puzzle.wordLength, {
          moves: updatedMoves.map((m) => ({
            from: m.from,
            to: m.to,
            timestamp: m.timestamp.toISOString(),
          })),
          completed: true,
          won: true,
        });
      } else if (updatedMoves.length >= puzzle.maxMoves) {
        setGameCompleted(true);
        setGameWon(false);
        if (audioSettings.soundEnabled) playLose();
        
        // Save archive state (NO stats, NO achievements, NO backend sync)
        saveArchiveState(dateStr, puzzle.wordLength, {
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
        saveArchiveState(dateStr, puzzle.wordLength, {
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
    if (puzzle && currentInput.length < puzzle.wordLength) {
      setCurrentInput(currentInput + key);
    }
  };

  const handleBackspace = () => {
    setCurrentInput(currentInput.slice(0, -1));
  };

  const handlePlayAnother = () => {
    setShowDatePicker(true);
    setArchiveDate(null);
    setPuzzle(null);
  };

  // Letter tracking for keyboard
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

  // Show loading while checking auth
  if (isAuthenticated === null) {
    return (
      <div 
        className="min-h-dvh flex items-center justify-center"
        style={{ background: 'hsl(var(--chain-page-bg))' }}
      >
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'hsl(var(--chain-accent))' }} />
      </div>
    );
  }

  // Show date picker if no date selected
  if (showDatePicker) {
    return (
      <ArchiveDatePicker 
        onSelectDate={handleDateSelect}
        onBack={() => navigate("/chain")}
        game="chain"
      />
    );
  }

  if (!puzzle || !archiveDate) {
    return null;
  }

  const archiveDateStr = format(archiveDate, "MMM d, yyyy");
  const moveHints = moves.map(m => m.hints);
  const shareText = generateShareText(
    puzzle.date, 
    moves.length, 
    gameWon, 
    puzzle.wordLength, 
    moveHints, 
    puzzle.maxMoves, 
    puzzle.puzzleIndex, 
    puzzle.minDistance
  );

  return (
    <div 
      className="min-h-dvh max-h-dvh flex flex-col overflow-hidden"
      style={{ background: 'hsl(var(--chain-page-bg))' }}
    >
      {/* Header with Archive Badge */}
      <header 
        className="flex items-center justify-between px-3 py-2 border-b shrink-0"
        style={{ 
          background: 'hsl(var(--chain-card-bg))',
          borderColor: 'hsl(var(--chain-card-border))' 
        }}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDatePicker(true)}
            className="h-9 w-9"
            style={{ color: 'hsl(var(--chain-text-secondary))' }}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Badge 
            variant="outline" 
            className="gap-1 text-xs"
            style={{ 
              borderColor: 'hsl(var(--chain-accent))',
              color: 'hsl(var(--chain-accent))'
            }}
          >
            <Calendar className="w-3 h-3" />
            Archive
          </Badge>
        </div>
        
        <div className="font-serif text-base" style={{ color: 'hsl(var(--chain-text-primary))' }}>
          {archiveDateStr}
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setHelpOpen(true)}
          className="h-9 w-9"
          style={{ color: 'hsl(var(--chain-text-muted))' }}
        >
          <HelpCircle className="w-4 h-4" />
        </Button>
      </header>

      {/* Length Tabs */}
      <div className="shrink-0 py-2 px-4">
        <ChainLengthTabs
          selectedLength={selectedLength}
          onLengthChange={handleLengthChange}
          statuses={{ 4: "empty", 5: "empty" }}
        />
      </div>

      {/* Game Content */}
      <div className="flex-1 overflow-y-auto px-4">
        {gameCompleted ? (
          <div className="py-6">
            <ChainResultsPanel
              won={gameWon}
              movesUsed={moves.length}
              goalWord={puzzle.goalWord}
              minDistance={puzzle.minDistance}
              shareText={shareText}
            />
            <div className="flex flex-col items-center gap-2 mt-4">
              <button
                onClick={handlePlayAnother}
                className="text-sm text-[hsl(var(--chain-accent))] hover:text-[hsl(var(--chain-text-primary))] transition-colors underline underline-offset-2"
              >
                Play Another Archive Puzzle
              </button>
              <p 
                className="text-xs text-center"
                style={{ color: 'hsl(var(--chain-text-muted))' }}
              >
                Archive results don't affect your stats
              </p>
            </div>
          </div>
        ) : (
          <>
            <ChainPuzzleDisplay
              startWord={puzzle.startWord}
              goalWord={puzzle.goalWord}
              movesUsed={moves.length}
              maxMoves={puzzle.maxMoves}
            />

            {moves.length === 0 && (
              <ChainInstructionText />
            )}

            <ChainMoveHistory moves={moves} />

            {selectedLength === 5 && (
              <div className="py-2">
                <MorphPowerups
                  consecutiveSingleSwaps={consecutiveSingleSwaps}
                  doubleSwapReady={doubleSwapReady}
                  doubleSwapUsed={doubleSwapUsed}
                  disabled={gameCompleted}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Input Area */}
      {!gameCompleted && (
        <div 
          className="shrink-0 border-t px-4 py-3"
          style={{ 
            background: 'hsl(var(--chain-card-bg))',
            borderColor: 'hsl(var(--chain-card-border))' 
          }}
          ref={inputRowRef}
        >
          <ChainInputRow
            currentWord={currentWord}
            currentInput={currentInput}
            onInputChange={setCurrentInput}
            wordLength={selectedLength}
            onSubmit={handleSubmit}
            error={error}
            isLoading={isLoading}
            useOnScreenKeyboard={settings.useOnScreenKeyboard}
          />

          {settings.useOnScreenKeyboard && (
            <div className="mt-3">
              <OnScreenKeyboard
                onKeyPress={handleKeyPress}
                onBackspace={handleBackspace}
                onEnter={handleSubmit}
                usedLetters={usedLetters}
                correctLetters={correctLetters}
                wrongPositionLetters={wrongPositionLetters}
              />
            </div>
          )}
        </div>
      )}

      {/* Help Modal */}
      <HowToPlayModal open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
};

export default ChainArchive;
