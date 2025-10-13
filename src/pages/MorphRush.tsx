import { useState, useEffect, useCallback } from "react";
import { RushLogo } from "@/components/RushLogo";
import { DailyBanner } from "@/components/DailyBanner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getRushDailyPuzzle,
  calculateEndBonuses,
  getScoutHint,
  RushWord,
  RushRun,
  generateRushShareText,
  isValidWordByLen
} from "@/lib/rushLogic";
import { scoreWord } from "@/lib/rushScoring";
import { isValidMorphHard } from "@/lib/rushHardMode";
import { RushTimer } from "@/components/rush/RushTimer";
import { RushScoreDisplay } from "@/components/rush/RushScoreDisplay";
import { RushPowerups } from "@/components/rush/RushPowerups";
import { RushWordRibbon } from "@/components/rush/RushWordRibbon";
import { RushResultsPanel } from "@/components/rush/RushResultsPanel";
import { RushLeaderboard } from "@/components/rush/RushLeaderboard";
import { useNavigate, useSearchParams } from "react-router-dom";

const MorphRush = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get('mode') || 'daily') as 'daily' | 'practice';
  
  const puzzle = getRushDailyPuzzle();
  
  const [run, setRun] = useState<RushRun>({
    mode,
    startWord: puzzle.startWord,
    words: [],
    usedWords: new Set([puzzle.startWord]),
    score: 0,
    multiplierMax: 1.0,
    invalidCount: 0,
    scoutUsed: false,
    undoUsed: false,
    currentMultiplier: 1.0,
    timerStarted: false,
    timeRemaining: 120,
    isFinished: false
  });
  
  const [currentWord, setCurrentWord] = useState(puzzle.startWord);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [hardMode, setHardMode] = useState(false);
  const [lastChangedIdx, setLastChangedIdx] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Timer tick
  const handleTimerTick = useCallback(() => {
    setRun(prev => {
      const newTime = Math.max(0, prev.timeRemaining - 1);
      if (newTime === 0 && !prev.isFinished) {
        return { ...prev, timeRemaining: 0, isFinished: true };
      }
      return { ...prev, timeRemaining: newTime };
    });
  }, []);
  
  // Handle submission
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || run.isFinished || isSubmitting) return;
    
    setIsSubmitting(true);
    const word = input.trim().toUpperCase();
    setError("");
    
    // Validation: length
    if (word.length !== 4) {
      setError("Must be 4 letters");
      triggerShake();
      setIsSubmitting(false);
      return;
    }
    
    // Validation: one-letter morph (with Hard Mode enforcement)
    if (hardMode) {
      const res = isValidMorphHard(currentWord, word, lastChangedIdx);
      if (!res.ok) {
        setError(res.reason ?? "Invalid morph");
        setRun(prev => ({ ...prev, invalidCount: prev.invalidCount + 1 }));
        triggerShake();
        setIsSubmitting(false);
        return;
      }
      setLastChangedIdx(res.changedIdx);
    } else {
      // Classic one-letter check
      let diffs = 0;
      for (let i = 0; i < word.length; i++) {
        if (word[i] !== currentWord[i]) diffs++;
      }
      if (diffs !== 1) {
        setError("Change exactly one letter");
        setRun(prev => ({ ...prev, invalidCount: prev.invalidCount + 1 }));
        triggerShake();
        setIsSubmitting(false);
        return;
      }
    }
    
    // Validation: dictionary
    if (!isValidWordByLen(word)) {
      setError("Not in word list");
      setRun(prev => ({ ...prev, invalidCount: prev.invalidCount + 1 }));
      triggerShake();
      setIsSubmitting(false);
      return;
    }
    
    // Validation: reuse
    if (run.usedWords.has(word)) {
      setError("Already used");
      setRun(prev => ({ ...prev, invalidCount: prev.invalidCount + 1 }));
      triggerShake();
      setIsSubmitting(false);
      return;
    }
    
    // Valid word - start timer on first valid submission
    if (!run.timerStarted && mode === 'daily') {
      setRun(prev => ({ ...prev, timerStarted: true }));
    }
    
    // Calculate scoring using centralized function
    const now = Date.now();
    const wordScore = scoreWord(word, run.usedWords, run.currentMultiplier, run.lastValidTime, now);
    
    const newWord: RushWord = {
      word,
      timestamp: new Date(),
      baseScore: wordScore.base,
      rarityBonus: wordScore.rarity,
      branchBonus: wordScore.branch,
      multiplier: wordScore.multiplier,
      totalScore: wordScore.total
    };
    
    // Update state with proper Set cloning
    setRun(prev => {
      const newUsedWords = new Set(prev.usedWords);
      newUsedWords.add(word);
      
      return {
        ...prev,
        words: [...prev.words, newWord],
        usedWords: newUsedWords,
        score: prev.score + wordScore.total,
        currentMultiplier: wordScore.multiplier,
        multiplierMax: Math.max(prev.multiplierMax, wordScore.multiplier),
        lastValidTime: now
      };
    });
    
    setCurrentWord(word);
    setInput("");
    setIsSubmitting(false);
    
    // Show score toast
    toast({
      title: `+${wordScore.total} points`,
      description: `${wordScore.multiplier.toFixed(1)}x multiplier`,
      duration: 1500
    });
  };
  
  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 300);
  };
  
  // Scout powerup
  const handleScout = () => {
    const hint = getScoutHint(currentWord, run.usedWords);
    if (hint) {
      setRun(prev => ({ ...prev, scoutUsed: true }));
      toast({
        title: "Scout Hint",
        description: `Try: ${hint}`,
        duration: 4000
      });
    } else {
      toast({
        title: "No neighbors available",
        variant: "destructive"
      });
    }
  };
  
  // Undo powerup
  const handleUndo = () => {
    if (run.words.length === 0) return;
    
    const lastWord = run.words[run.words.length - 1];
    const previousWord = run.words.length > 1 
      ? run.words[run.words.length - 2].word 
      : puzzle.startWord;
    
    setRun(prev => {
      const newWords = prev.words.slice(0, -1);
      const newUsedWords = new Set([puzzle.startWord, ...newWords.map(w => w.word)]);
      return {
        ...prev,
        words: newWords,
        usedWords: newUsedWords,
        score: prev.score - lastWord.totalScore,
        undoUsed: true
      };
    });
    
    setCurrentWord(previousWord);
    toast({ title: `Undid ${lastWord.word} (-${lastWord.totalScore} pts)` });
  };
  
  // Calculate final results
  const endBonuses = run.isFinished ? calculateEndBonuses(run.words, run.invalidCount) : { cleanRun: 0, explorer: 0, total: 0 };
  const finalScore = run.isFinished ? run.score + endBonuses.total : run.score;
  
  const shareText = generateRushShareText(
    puzzle.puzzleNumber,
    puzzle.date,
    finalScore,
    run.words.length,
    run.multiplierMax,
    mode
  );
  
  const handlePlayAgain = () => {
    navigate('/rush?mode=practice');
    window.location.reload();
  };
  
  // Reset multiplier after 5s inactivity
  useEffect(() => {
    if (!run.lastValidTime || run.isFinished) return;
    
    const timeout = setTimeout(() => {
      const timeSince = (Date.now() - run.lastValidTime) / 1000;
      if (timeSince >= 5) {
        setRun(prev => ({ ...prev, currentMultiplier: 1.0 }));
      }
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [run.lastValidTime, run.isFinished]);
  
  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto">
      <header className="h-14 grid grid-cols-3 items-center px-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-1 justify-start"></div>
        <div className="flex justify-center">
          <RushLogo />
        </div>
        <div className="flex items-center gap-1 justify-end"></div>
      </header>
      
      <div className="px-3 py-2 md:px-4 md:py-3">
        <DailyBanner
          date={puzzle.date}
          wordLength={4}
          maxMoves={0}
          puzzleIndex={puzzle.puzzleNumber}
          hardMode={hardMode}
          onToggleHardMode={() => {
            if (run.words.length === 0) {
              setHardMode(!hardMode);
              setLastChangedIdx(null);
            } else {
              toast({
                title: "Can't toggle Hard Mode",
                description: "Hard Mode must be set before your first move",
                variant: "destructive"
              });
            }
          }}
        />
      </div>
      
      <main className="flex-1 pb-16 md:pb-24">
        {/* Header with timer and score */}
        <div className="px-3 py-4 md:px-6 md:py-6 flex items-center justify-between">
          <RushTimer
            timeRemaining={run.timeRemaining}
            isRunning={run.timerStarted}
            onTick={handleTimerTick}
            mode={mode}
          />
          <RushScoreDisplay
            score={finalScore}
            multiplier={run.currentMultiplier}
            isActive={!run.isFinished}
          />
        </div>
        
        {/* Current word + Input */}
        {!run.isFinished && (
          <div className="px-3 py-3 md:px-6 md:py-4 space-y-3">
            <div className="text-center">
              <p className="text-xs md:text-sm text-muted-foreground mb-2">Current Word</p>
              <div className="flex justify-center">
                <div className="flex gap-1 px-3 py-2 bg-card border border-border rounded-lg">
                  {currentWord.split("").map((letter, i) => (
                    <span
                      key={i}
                      className="text-xl md:text-2xl font-mono font-semibold uppercase"
                    >
                      {letter}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className={shake ? "animate-shake" : ""}>
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase())}
                  maxLength={4}
                  placeholder="Next word..."
                  className="flex-1 font-mono uppercase text-base md:text-lg text-center tracking-wider"
                  autoFocus
                />
                <Button type="submit" disabled={!input.trim()}>
                  Submit
                </Button>
              </div>
              
              {error && (
                <div className="flex items-center gap-1.5 text-destructive text-sm mt-2">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{error}</span>
                </div>
              )}
            </form>
            
            <RushPowerups
              scoutUsed={run.scoutUsed}
              undoUsed={run.undoUsed}
              onScout={handleScout}
              onUndo={handleUndo}
              canUndo={run.words.length > 0}
              disabled={run.isFinished}
            />
          </div>
        )}
        
        {/* Word ribbon */}
        <RushWordRibbon words={run.words} />
        
        {/* Results */}
        {run.isFinished && (
          <div className="space-y-4 px-3 md:px-6">
            <RushResultsPanel
              score={run.score}
              words={run.words}
              multiplierMax={run.multiplierMax}
              invalidCount={run.invalidCount}
              endBonuses={endBonuses}
              finalScore={finalScore}
              shareText={shareText}
              onPlayAgain={mode === 'practice' ? handlePlayAgain : undefined}
              mode={mode}
            />
            
            {mode === 'daily' && <RushLeaderboard mode="daily" />}
          </div>
        )}
      </main>
    </div>
  );
};

export default MorphRush;
