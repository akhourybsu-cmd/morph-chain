import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGridStore } from '@/stores/gridStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, Archive } from 'lucide-react';
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
  const navigate = useNavigate();
  const { 
    moves, submittedWords, dailySeed, morphCount, 
    startTime, isWin, purpleCount
  } = useGridStore();
  const [showInitialsInput, setShowInitialsInput] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session?.user);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Only show initials input for wins
      if (user && open && isWin) {
        const exists = await checkGridSubmissionExists(dailySeed);
        setScoreSubmitted(exists);
        
        if (!exists) {
          setShowInitialsInput(true);
        }
      }
    };
    
    if (open) {
      checkAuth();
    }
  }, [open, dailySeed, isWin]);
  
  const longestWord = submittedWords.reduce((longest, current) => 
    current.word.length > longest.length ? current.word : longest
  , '');
  
  const handleShare = async () => {
    const resultEmoji = isWin ? '✓' : '✗';
    const resultText = isWin 
      ? `Completed in ${moves} moves`
      : `${purpleCount}/25 tiles in ${moves} moves`;
    
    const text = `${resultEmoji} Morph Grid — Daily ${dailySeed}
${isWin ? 'Won' : 'Lost'}: ${resultText}
Words: ${submittedWords.length} | Longest: "${longestWord}"
Morphs: ${morphCount}

morphchaingame.com`;
    
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

  const handleArchiveClick = () => {
    onClose();
    if (isAuthenticated) {
      navigate('/grid/archive');
    } else {
      navigate('/login');
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-md max-h-[90vh] overflow-y-auto bg-[hsl(var(--grid-card-bg))] border-[hsl(var(--grid-card-border))]"
        style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
      >
        <DialogHeader>
          <DialogTitle className={`text-2xl font-playfair font-semibold text-center ${isWin ? 'text-[hsl(var(--grid-success))]' : 'text-[hsl(var(--grid-error))]'}`}>
            {isWin ? 'Puzzle Complete!' : 'Out of Moves'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 py-4 font-inter">
          {/* Result Display */}
          <div className="text-center">
            {isWin ? (
              <>
                <div className="text-5xl font-bold text-[hsl(var(--grid-accent))] mb-1">
                  {moves}
                </div>
                <div className="text-[hsl(var(--grid-text-muted))] text-sm">Moves Used</div>
              </>
            ) : (
              <>
                <div className="text-5xl font-bold text-[hsl(var(--grid-error))] mb-1">
                  {purpleCount}/25
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
              <div className="text-xl font-bold text-[hsl(var(--grid-text-primary))]">{submittedWords.length}</div>
              <div className="text-xs text-[hsl(var(--grid-text-muted))]">Words Formed</div>
            </div>
            
            <div className="text-center p-3 bg-[hsl(var(--grid-pill-bg))] rounded-lg">
              <div className="text-xl font-bold text-[hsl(var(--grid-text-primary))]">{longestWord.length}</div>
              <div className="text-xs text-[hsl(var(--grid-text-muted))]">Longest Word</div>
            </div>
            
            <div className="text-center p-3 bg-[hsl(var(--grid-pill-bg))] rounded-lg">
              <div className="text-xl font-bold text-[hsl(var(--grid-text-primary))]">{morphCount}</div>
              <div className="text-xs text-[hsl(var(--grid-text-muted))]">Morphs</div>
            </div>
            
            <div className="text-center p-3 bg-[hsl(var(--grid-pill-bg))] rounded-lg">
              <div className="text-xl font-bold text-[hsl(var(--grid-text-primary))]">{moves}/{MAX_MOVES}</div>
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
              {submittedWords.map((w, i) => (
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

          {/* Archive Access */}
          <div className="text-center pt-3 border-t border-[hsl(var(--grid-card-border))]">
            <p className="text-sm text-[hsl(var(--grid-text-muted))] mb-2">Want to play more?</p>
            <Button
              onClick={handleArchiveClick}
              variant="outline"
              className="border-[hsl(var(--grid-card-border))] text-[hsl(var(--grid-text-primary))] hover:bg-[hsl(var(--grid-pill-bg))] font-inter font-medium"
            >
              <Archive className="w-4 h-4 mr-2" />
              Access the Archive
            </Button>
            {!isAuthenticated && (
              <p className="text-xs text-[hsl(var(--grid-text-muted))] mt-2">(Sign in required)</p>
            )}
          </div>

          {/* Leaderboard Section - only show for wins */}
          {isAuthenticated && isWin && (
            <div className="mt-4">
              <GridLeaderboard dateSeed={dailySeed} />
            </div>
          )}

          {!isAuthenticated && isWin && (
            <div className="mt-4 p-3 bg-[hsl(var(--grid-pill-bg))] rounded-lg text-center">
              <p className="text-sm text-[hsl(var(--grid-text-muted))]">
                Sign in to submit your score to the leaderboard
              </p>
            </div>
          )}
          
          {!isWin && (
            <div className="mt-3 p-3 bg-[hsl(var(--grid-pill-bg))] rounded-lg text-center">
              <p className="text-sm text-[hsl(var(--grid-text-muted))]">
                Come back tomorrow for a new puzzle!
              </p>
            </div>
          )}
        </div>

        {/* Initials Input Modal - only for wins */}
        {isWin && (
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