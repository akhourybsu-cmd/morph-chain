import { useState, useEffect, useCallback } from "react";
import { Trophy, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useRushSettings } from "@/hooks/useRushSettings";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { formatInTimeZone } from "date-fns-tz";
import { RushPrestigeHeader } from "@/components/rush/RushPrestigeHeader";
import {
  getRushDailyPuzzle,
  calculateEndBonuses,
  RushWord,
  RushRun,
  generateRushShareText,
} from "@/lib/rushLogic";
import { generateTileRack, checkDrop, hasValidMorphs } from "@/lib/rushTileRack";
import {
  playMorphSuccess,
  playMorphError,
  playTimerWarning,
  playGameEnd,
  initAudio as initRushAudio,
} from "@/lib/rush/audioManager";

import { PrestigeTimer } from "@/components/rush/PrestigeTimer";
import { WordDropZone } from "@/components/rush/WordDropZone";
import { TileRack } from "@/components/rush/TileRack";
import { PrestigeResultsPanel } from "@/components/rush/PrestigeResultsPanel";
import { RushLeaderboard } from "@/components/rush/RushLeaderboard";
import { RushHowToPlay } from "@/components/rush/RushHowToPlay";
import { RushStats } from "@/components/rush/RushStats";
import { RushInitialsInput } from "@/components/rush/RushInitialsInput";
import { RushMenuSheet } from "@/components/rush/RushMenuSheet";
import { RushSettingsModal } from "@/components/rush/RushSettingsModal";
import { updateRushStats, saveDailyCompletion, loadTodayCompletion, type CompletedDailyRun } from "@/lib/rushStorage";

const MorphRush = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get('mode') || 'daily') as 'daily' | 'practice';
  const { settings: audioSettings, toggleSound } = useRushSettings();
  
  const puzzle = getRushDailyPuzzle();
  const timezone = "America/New_York";
  const formattedDate = formatInTimeZone(new Date(), timezone, 'MMMM d, yyyy');
  
  // Game state
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
  const [tileRack, setTileRack] = useState<string[]>([]);
  const [selectedTile, setSelectedTile] = useState<{ letter: string; index: number } | null>(null);
  const [shake, setShake] = useState(false);
  const [error, setError] = useState("");
  
  // UI state
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [hardMode, setHardMode] = useState(false);
  
  // Daily completion tracking
  const [completedRun, setCompletedRun] = useState<CompletedDailyRun | null>(null);

  // Initialize audio on first interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      initRushAudio();
      window.removeEventListener('click', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    return () => window.removeEventListener('click', handleFirstInteraction);
  }, []);

  // Initialize tile rack
  useEffect(() => {
    const rack = generateTileRack(currentWord, run.usedWords, 8);
    setTileRack(rack.tiles);
  }, []);

  // Auth listener
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check for existing daily completion on mount
  useEffect(() => {
    const existingCompletion = loadTodayCompletion();
    if (existingCompletion && existingCompletion.mode === mode && existingCompletion.hardMode === hardMode) {
      setCompletedRun(existingCompletion);
      setScoreSubmitted(true);
    }
  }, [mode, hardMode]);

  // Timer tick
  const handleTimerTick = useCallback(() => {
    setRun(prev => {
      const newTime = Math.max(0, prev.timeRemaining - 1);
      
      // Play timer warnings at specific times
      if (audioSettings.soundEnabled && (newTime === 30 || newTime === 10 || newTime === 5)) {
        playTimerWarning(newTime);
      }
      
      if (newTime === 0 && !prev.isFinished) {
        if (audioSettings.soundEnabled) playGameEnd();
        updateRushStats(prev.score, prev.words.length, prev.multiplierMax, hardMode);
        
        const finalBonuses = calculateEndBonuses(prev.words, prev.invalidCount);
        const finalScoreWithBonuses = prev.score + finalBonuses.total;
        
        saveDailyCompletion({
          mode,
          hardMode,
          score: finalScoreWithBonuses,
          wordsCount: prev.words.length,
          maxMultiplier: prev.multiplierMax,
          invalidCount: prev.invalidCount,
          words: prev.words,
          sessionAchievements: [],
        });
        
        return { ...prev, timeRemaining: 0, isFinished: true };
      }
      return { ...prev, timeRemaining: newTime };
    });
  }, [hardMode, mode, audioSettings.soundEnabled]);

  // Handle tile drop
  const handleDrop = (position: number, letter: string) => {
    if (run.isFinished) return;
    
    setError("");
    const result = checkDrop(currentWord, letter, position, run.usedWords);
    
    if (!result.valid) {
      // Invalid drop - shake and show error
      triggerShake();
      if (audioSettings.soundEnabled) playMorphError();
      if (result.newWord === currentWord) {
        setError("Same letter - no change");
      } else if (run.usedWords.has(result.newWord)) {
        setError("Already used that word");
      } else {
        setError("Not a valid word");
      }
      setRun(prev => ({ ...prev, invalidCount: prev.invalidCount + 1 }));
      return;
    }
    
    // Valid morph! Start timer on first valid submission
    if (audioSettings.soundEnabled) playMorphSuccess();
    if (!run.timerStarted && mode === 'daily') {
      setRun(prev => ({ ...prev, timerStarted: true }));
    }
    
    // Calculate score (simple 100 points per word for drag-drop version)
    const wordScore = 100;
    
    const newWord: RushWord = {
      word: result.newWord,
      timestamp: new Date(),
      baseScore: 100,
      rarityBonus: 0,
      branchBonus: 0,
      multiplier: 1.0,
      totalScore: wordScore
    };
    
    // Update state
    setRun(prev => {
      const newUsedWords = new Set(prev.usedWords);
      newUsedWords.add(result.newWord);
      
      return {
        ...prev,
        words: [...prev.words, newWord],
        usedWords: newUsedWords,
        score: prev.score + wordScore,
      };
    });
    
    setCurrentWord(result.newWord);
    
    // Generate new tile rack
    const newUsedWords = new Set(run.usedWords);
    newUsedWords.add(result.newWord);
    const newRack = generateTileRack(result.newWord, newUsedWords, 8);
    setTileRack(newRack.tiles);
    
    // Check for dead end
    if (!hasValidMorphs(result.newWord, newUsedWords)) {
      toast({
        title: "Dead end!",
        description: "No more valid morphs available",
        variant: "destructive"
      });
    }
    
    // Show score toast
    toast({
      title: `+${wordScore} points`,
      description: `${result.newWord}`,
      duration: 1500
    });
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
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
    const existingCompletion = loadTodayCompletion();
    if (existingCompletion && existingCompletion.mode === mode && existingCompletion.hardMode === hardMode) {
      toast({
        title: "Already Completed",
        description: "You've already completed today's puzzle. Come back tomorrow!",
        variant: "destructive"
      });
      return;
    }
    
    navigate('/rush?mode=practice');
    window.location.reload();
  };

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ background: 'hsl(var(--rush-page-bg))' }}
    >
      {/* Prestige Header */}
      <RushPrestigeHeader
        onOpenMenu={() => setMenuOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
        soundEnabled={audioSettings.soundEnabled}
        onToggleSound={toggleSound}
      />
      
      {/* Info Strip */}
      <div 
        className="text-center py-2 text-xs"
        style={{ 
          color: 'hsl(var(--rush-text-muted))',
          borderBottom: '1px solid hsl(var(--rush-card-border))'
        }}
      >
        {formattedDate} · Puzzle #{puzzle.puzzleNumber}
      </div>
      
      {/* Modals */}
      <RushMenuSheet 
        open={menuOpen} 
        onOpenChange={setMenuOpen}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <RushSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        hardMode={hardMode}
        onToggleHardMode={() => {
          if (run.words.length === 0) {
            setHardMode(!hardMode);
          }
        }}
        canToggleHardMode={run.words.length === 0}
        onViewLeaderboard={() => setShowLeaderboard(true)}
        onResetData={() => {
          if (confirm('Reset all Rush data? This cannot be undone.')) {
            localStorage.removeItem('morphchain_rush_stats');
            window.location.reload();
          }
        }}
        mode={mode}
      />
      <RushStats open={statsOpen} onOpenChange={setStatsOpen} />
      <RushHowToPlay open={helpOpen} onOpenChange={setHelpOpen} />
      
      <Dialog open={showLeaderboard} onOpenChange={setShowLeaderboard}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" style={{ color: 'hsl(var(--rush-accent))' }} />
              Daily Leaderboard
            </DialogTitle>
          </DialogHeader>
          <RushLeaderboard mode="daily" />
        </DialogContent>
      </Dialog>
      
      <main className="flex-1 pb-16 md:pb-24 max-w-[640px] mx-auto w-full px-4">
        {completedRun ? (
          // Show completed run results
          <div className="space-y-4 mt-6">
            <PrestigeResultsPanel
              totalMorphs={completedRun.wordsCount}
              finalScore={completedRun.score}
              shareText={generateRushShareText(
                puzzle.puzzleNumber,
                puzzle.date,
                completedRun.score,
                completedRun.wordsCount,
                completedRun.maxMultiplier,
                mode
              )}
              mode={completedRun.mode}
              puzzleNumber={puzzle.puzzleNumber}
              onViewLeaderboard={() => setShowLeaderboard(true)}
            />
            <div 
              className="p-4 text-center rounded-xl"
              style={{
                background: 'hsl(var(--rush-card-bg))',
                border: '1px solid hsl(var(--rush-card-border))',
              }}
            >
              <p style={{ color: 'hsl(var(--rush-text-secondary))' }} className="font-medium">
                You've completed today's puzzle!
              </p>
              <p className="text-sm mt-1" style={{ color: 'hsl(var(--rush-text-muted))' }}>
                Come back tomorrow for a new challenge
              </p>
            </div>
            <RushLeaderboard mode="daily" />
          </div>
        ) : (
          <>
            {/* Timer + Score Row */}
            <div className="flex items-center justify-between mt-6 mb-6">
              <PrestigeTimer
                timeRemaining={run.timeRemaining}
                totalTime={120}
                isRunning={run.timerStarted}
                onTick={handleTimerTick}
              />
              
              <div 
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                style={{
                  background: 'hsl(var(--rush-card-bg))',
                  border: '1px solid hsl(var(--rush-card-border))',
                }}
              >
                <Trophy className="h-4 w-4" style={{ color: 'hsl(var(--rush-accent))' }} />
                <span 
                  className="text-lg font-semibold tabular-nums"
                  style={{ color: 'hsl(var(--rush-text-primary))' }}
                >
                  {finalScore.toLocaleString()}
                </span>
              </div>
            </div>
            
            {/* Current Word (Drop Targets) */}
            {!run.isFinished && (
              <div className="space-y-6">
                <div className="my-8">
                  <WordDropZone
                    word={currentWord}
                    selectedLetter={selectedTile?.letter || null}
                    onPlaceLetter={(position) => {
                      if (selectedTile) {
                        handleDrop(position, selectedTile.letter);
                        setSelectedTile(null);
                      }
                    }}
                    hasSelection={selectedTile !== null}
                    shake={shake}
                  />
                  
                  {error && (
                    <div className="flex items-center justify-center gap-1.5 text-sm mt-3" style={{ color: 'hsl(var(--grid-error))' }}>
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
                
                {/* Tile Rack */}
                <TileRack
                  tiles={tileRack}
                  selectedIndex={selectedTile?.index ?? null}
                  onTileSelect={(letter, index) => {
                    if (selectedTile?.index === index) {
                      setSelectedTile(null);
                    } else {
                      setSelectedTile({ letter, index });
                    }
                  }}
                />
                
                {/* Word count */}
                <p 
                  className="text-center text-sm"
                  style={{ color: 'hsl(var(--rush-text-muted))' }}
                >
                  {run.words.length} word{run.words.length !== 1 ? 's' : ''} morphed
                </p>
                
                {/* View Leaderboard Link */}
                {mode === 'daily' && (
                  <div className="text-center pt-4">
                    <button 
                      onClick={() => setShowLeaderboard(true)}
                      className="text-sm font-medium hover:underline transition-colors"
                      style={{ color: 'hsl(var(--rush-accent))' }}
                    >
                      View Leaderboard →
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Results */}
            {run.isFinished && (
              <div className="space-y-4 mt-6">
                {!scoreSubmitted && mode === 'daily' ? (
                  <RushInitialsInput
                    score={finalScore}
                    mode={mode}
                    hardMode={hardMode}
                    multiplierMax={run.multiplierMax}
                    words={run.words}
                    invalidCount={run.invalidCount}
                    scoutUsed={run.scoutUsed}
                    undoUsed={run.undoUsed}
                    onSubmitted={() => setScoreSubmitted(true)}
                  />
                ) : (
                  <PrestigeResultsPanel
                    totalMorphs={run.words.length}
                    finalScore={finalScore}
                    shareText={shareText}
                    onPlayAgain={mode === 'practice' ? handlePlayAgain : undefined}
                    mode={mode}
                    puzzleNumber={puzzle.puzzleNumber}
                    onViewLeaderboard={() => setShowLeaderboard(true)}
                  />
                )}
                
                {(scoreSubmitted || mode === 'practice') && mode === 'daily' && (
                  <RushLeaderboard mode="daily" />
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default MorphRush;
