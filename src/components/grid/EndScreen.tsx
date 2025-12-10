import { useState, useEffect } from 'react';
import { useGridStore } from '@/stores/gridStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, Play, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { GridInitialsInput } from './GridInitialsInput';
import { GridLeaderboard } from './GridLeaderboard';
import { checkGridSubmissionExists } from '@/integrations/supabase/gridLeaderboard';
import { supabase } from '@/integrations/supabase/client';

const MAX_MOVES = 20;

interface EndScreenProps {
  open: boolean;
  onClose: () => void;
}

export const EndScreen = ({ open, onClose }: EndScreenProps) => {
  const { 
    moves, submittedWords, dailySeed, morphCount, stabilizationCount, 
    startTime, isWin, purpleCount, isPractice, startPractice, dailyResult
  } = useGridStore();
  const [showInitialsInput, setShowInitialsInput] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [viewingDaily, setViewingDaily] = useState(false);

  // Determine which result to display
  const displayingDaily = viewingDaily && dailyResult;
  const displayMoves = displayingDaily ? dailyResult.moves : moves;
  const displayWords = displayingDaily ? dailyResult.submittedWords : submittedWords;
  const displayIsWin = displayingDaily ? dailyResult.isWin : isWin;
  const displayPurpleCount = displayingDaily ? dailyResult.purpleCount : purpleCount;
  const displayMorphCount = displayingDaily ? dailyResult.morphCount : morphCount;

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      
      // Only show initials input for wins on daily (not practice)
      if (user && open && isWin && !isPractice) {
        const exists = await checkGridSubmissionExists(dailySeed);
        setScoreSubmitted(exists);
        
        if (!exists) {
          setShowInitialsInput(true);
        }
      }
    };
    
    if (open) {
      checkAuth();
      setViewingDaily(false); // Reset when opening
    }
  }, [open, dailySeed, isWin, isPractice]);
  
  const longestWord = displayWords.reduce((longest, current) => 
    current.word.length > longest.length ? current.word : longest
  , '');
  
  const handleShare = async () => {
    const resultEmoji = displayIsWin ? '✓' : '✗';
    const resultText = displayIsWin 
      ? `Completed in ${displayMoves} moves`
      : `${displayPurpleCount}/25 tiles in ${displayMoves} moves`;
    
    const modeLabel = isPractice && !viewingDaily ? ' (Practice)' : '';
    
    const text = `${resultEmoji} Morph Grid — Daily ${dailySeed}${modeLabel}
${displayIsWin ? 'Won' : 'Lost'}: ${resultText}
Words: ${displayWords.length} | Longest: "${longestWord}"
Morphs: ${displayMorphCount}

morphgames.io`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          text: text,
          title: "Morph Grid",
        });
      } catch (error) {
        // User cancelled or share failed
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        toast.success('Results copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy to clipboard');
      }
    }
  };

  const handleStartPractice = () => {
    startPractice();
    onClose();
  };

  const handleViewDaily = () => {
    setViewingDaily(true);
  };

  const handleBackToPractice = () => {
    setViewingDaily(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-md max-h-[90vh] overflow-y-auto bg-[hsl(var(--grid-card-bg))] border-[hsl(var(--grid-card-border))]"
        style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
      >
        <DialogHeader>
          <DialogTitle className={`text-2xl font-playfair font-semibold text-center ${displayIsWin ? 'text-[hsl(var(--grid-success))]' : 'text-[hsl(var(--grid-error))]'}`}>
            {viewingDaily ? 'Daily Results' : isPractice ? 'Practice Complete!' : displayIsWin ? 'Puzzle Complete!' : 'Out of Moves'}
          </DialogTitle>
          {(isPractice && !viewingDaily) && (
            <p className="text-center text-sm text-[hsl(var(--grid-text-muted))] mt-1">Practice mode - stats not recorded</p>
          )}
        </DialogHeader>
        
        <div className="space-y-5 py-4 font-inter">
          {/* Result Display */}
          <div className="text-center">
            {displayIsWin ? (
              <>
                <div className="text-5xl font-bold text-[hsl(var(--grid-accent))] mb-1">
                  {displayMoves}
                </div>
                <div className="text-[hsl(var(--grid-text-muted))] text-sm">Moves Used</div>
              </>
            ) : (
              <>
                <div className="text-5xl font-bold text-[hsl(var(--grid-error))] mb-1">
                  {displayPurpleCount}/25
                </div>
                <div className="text-[hsl(var(--grid-text-muted))] text-sm">Tiles at Tier 3</div>
                <div className="text-xs text-[hsl(var(--grid-error))] mt-2">
                  Ran out of moves ({MAX_MOVES} max)
                </div>
              </>
            )}
          </div>
          
          {/* Stats Grid - NYT Style */}
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-[hsl(var(--grid-pill-bg))] rounded-lg">
              <div className="text-xl font-bold text-[hsl(var(--grid-text-primary))]">{displayWords.length}</div>
              <div className="text-xs text-[hsl(var(--grid-text-muted))]">Words Formed</div>
            </div>
            
            <div className="text-center p-3 bg-[hsl(var(--grid-pill-bg))] rounded-lg">
              <div className="text-xl font-bold text-[hsl(var(--grid-text-primary))]">{longestWord.length}</div>
              <div className="text-xs text-[hsl(var(--grid-text-muted))]">Longest Word</div>
            </div>
            
            <div className="text-center p-3 bg-[hsl(var(--grid-pill-bg))] rounded-lg">
              <div className="text-xl font-bold text-[hsl(var(--grid-text-primary))]">{displayMorphCount}</div>
              <div className="text-xs text-[hsl(var(--grid-text-muted))]">Morphs</div>
            </div>
            
            <div className="text-center p-3 bg-[hsl(var(--grid-pill-bg))] rounded-lg">
              <div className="text-xl font-bold text-[hsl(var(--grid-text-primary))]">{displayMoves}/{MAX_MOVES}</div>
              <div className="text-xs text-[hsl(var(--grid-text-muted))]">Moves</div>
            </div>
          </div>
          
          {/* Longest Word Highlight */}
          {longestWord && (
            <div className="text-center p-3 bg-[hsl(var(--grid-accent)/0.08)] rounded-lg border border-[hsl(var(--grid-accent)/0.2)]">
              <div className="text-xs text-[hsl(var(--grid-text-muted))] mb-1">Longest Word</div>
              <div className="text-2xl font-bold text-[hsl(var(--grid-accent))]">
                {longestWord.toUpperCase()}
              </div>
            </div>
          )}
          
          {/* Word List */}
          <div className="max-h-36 overflow-y-auto space-y-2 p-3 bg-[hsl(var(--grid-pill-bg))] rounded-lg">
            <div className="text-xs font-semibold text-[hsl(var(--grid-text-muted))] mb-2">All Words:</div>
            <div className="flex flex-wrap gap-1.5">
              {displayWords.map((w, i) => (
                <div
                  key={i}
                  className="px-2 py-0.5 bg-[hsl(var(--grid-card-bg))] text-[hsl(var(--grid-text-secondary))] rounded text-xs font-medium border border-[hsl(var(--grid-card-border))]"
                >
                  {w.word}
                </div>
              ))}
            </div>
          </div>
          
          {/* Share Button - NYT Style */}
          <Button
            onClick={handleShare}
            className="w-full bg-[hsl(var(--grid-accent))] hover:bg-[hsl(193,46%,28%)] text-white font-inter font-semibold rounded-full h-11"
            size="lg"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Results
          </Button>

          {/* Practice Mode / View Daily buttons */}
          {!isPractice && (
            <Button
              onClick={handleStartPractice}
              variant="outline"
              className="w-full border-[hsl(var(--grid-card-border))] text-[hsl(var(--grid-text-primary))] hover:bg-[hsl(var(--grid-pill-bg))] font-inter font-semibold rounded-full h-11"
              size="lg"
            >
              <Play className="w-4 h-4 mr-2" />
              Practice Mode
            </Button>
          )}

          {isPractice && dailyResult && !viewingDaily && (
            <Button
              onClick={handleViewDaily}
              variant="outline"
              className="w-full border-[hsl(var(--grid-card-border))] text-[hsl(var(--grid-text-primary))] hover:bg-[hsl(var(--grid-pill-bg))] font-inter font-semibold rounded-full h-11"
              size="lg"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Daily Results
            </Button>
          )}

          {viewingDaily && (
            <Button
              onClick={handleBackToPractice}
              variant="outline"
              className="w-full border-[hsl(var(--grid-card-border))] text-[hsl(var(--grid-text-primary))] hover:bg-[hsl(var(--grid-pill-bg))] font-inter font-semibold rounded-full h-11"
              size="lg"
            >
              Back to Practice Results
            </Button>
          )}

          {/* Leaderboard Section - only show for daily wins */}
          {isAuthenticated && displayIsWin && !isPractice && (
            <div className="mt-4">
              <GridLeaderboard dateSeed={dailySeed} />
            </div>
          )}

          {!isAuthenticated && displayIsWin && !isPractice && (
            <div className="mt-4 p-3 bg-[hsl(var(--grid-pill-bg))] rounded-lg text-center">
              <p className="text-sm text-[hsl(var(--grid-text-muted))]">
                Sign in to submit your score to the leaderboard
              </p>
            </div>
          )}
          
          {!displayIsWin && !isPractice && (
            <div className="mt-3 p-3 bg-[hsl(var(--grid-pill-bg))] rounded-lg text-center">
              <p className="text-sm text-[hsl(var(--grid-text-muted))]">
                Come back tomorrow for a new puzzle!
              </p>
            </div>
          )}

          {isPractice && !viewingDaily && (
            <div className="mt-3 p-3 bg-[hsl(var(--grid-pill-bg))] rounded-lg text-center">
              <p className="text-sm text-[hsl(var(--grid-text-muted))]">
                Practice again or view your daily results above
              </p>
            </div>
          )}
        </div>

        {/* Initials Input Modal - only for daily wins */}
        {isWin && !isPractice && (
          <GridInitialsInput
            open={showInitialsInput}
            onClose={() => setShowInitialsInput(false)}
            onSubmitted={() => setScoreSubmitted(true)}
            moves={moves}
            wordsUsed={submittedWords.length}
            timeToCompleteMs={startTime ? Date.now() - startTime : undefined}
            dateSeed={dailySeed}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};