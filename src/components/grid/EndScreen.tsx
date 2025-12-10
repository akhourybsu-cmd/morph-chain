import { useState, useEffect } from 'react';
import { useGridStore } from '@/stores/gridStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
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
  const { moves, submittedWords, dailySeed, morphCount, stabilizationCount, startTime, isWin, purpleCount } = useGridStore();
  const [showInitialsInput, setShowInitialsInput] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      
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
    const resultEmoji = isWin ? '💎' : '💔';
    const resultText = isWin 
      ? `Completed in ${moves} moves`
      : `${purpleCount}/25 purple in ${moves} moves`;
    
    const text = `${resultEmoji} MORPH GRID — Daily ${dailySeed}
${isWin ? '🏆' : '❌'} ${resultText}
📝 ${submittedWords.length} words | Longest: "${longestWord}"
🔄 ${morphCount} morphs

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
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        {/* Ambient glow background */}
        <div className={`absolute inset-0 bg-gradient-to-b ${isWin ? 'from-purple-500/20 via-purple-600/10' : 'from-red-500/20 via-red-600/10'} to-transparent pointer-events-none animate-pulse-glow`} />
        
        <DialogHeader className="relative z-10">
          <DialogTitle className={`text-3xl font-outfit font-bold text-center bg-gradient-to-r ${isWin ? 'from-purple-400 via-purple-300 to-purple-400' : 'from-red-400 via-orange-300 to-red-400'} bg-clip-text text-transparent animate-shimmer`}>
            {isWin ? 'All Purple!' : 'Out of Moves!'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4 relative z-10">
          {/* Result Display */}
          <div className="text-center">
            {isWin ? (
              <>
                <div className="text-6xl font-outfit font-bold bg-gradient-to-br from-purple-400 to-purple-600 bg-clip-text text-transparent mb-2 drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                  {moves}
                </div>
                <div className="text-muted-foreground">Moves Used</div>
              </>
            ) : (
              <>
                <div className="text-6xl font-outfit font-bold bg-gradient-to-br from-red-400 to-orange-500 bg-clip-text text-transparent mb-2">
                  {purpleCount}/25
                </div>
                <div className="text-muted-foreground">Tiles Purple</div>
                <div className="text-sm text-destructive mt-2">
                  Ran out of moves ({MAX_MOVES} max)
                </div>
              </>
            )}
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-card/50 rounded-lg border border-border/50">
              <div className="text-2xl font-bold">{submittedWords.length}</div>
              <div className="text-xs text-muted-foreground">Words Formed</div>
            </div>
            
            <div className="text-center p-4 bg-card/50 rounded-lg border border-border/50">
              <div className="text-2xl font-bold">{longestWord.length}</div>
              <div className="text-xs text-muted-foreground">Longest Word</div>
            </div>
            
            <div className="text-center p-4 bg-card/50 rounded-lg border border-border/50">
              <div className="text-2xl font-bold">{morphCount}</div>
              <div className="text-xs text-muted-foreground">Morphs</div>
            </div>
            
            <div className="text-center p-4 bg-card/50 rounded-lg border border-border/50">
              <div className="text-2xl font-bold">{moves}/{MAX_MOVES}</div>
              <div className="text-xs text-muted-foreground">Moves</div>
            </div>
          </div>
          
          {/* Longest Word Highlight */}
          {longestWord && (
            <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/30">
              <div className="text-sm text-muted-foreground mb-1">Longest Word</div>
              <div className="text-3xl font-outfit font-bold text-primary">
                {longestWord.toUpperCase()}
              </div>
            </div>
          )}
          
          {/* Word List */}
          <div className="max-h-48 overflow-y-auto space-y-2 p-3 bg-card/30 rounded-lg border border-border/30">
            <div className="text-sm font-semibold text-muted-foreground mb-2">All Words:</div>
            <div className="flex flex-wrap gap-2">
              {submittedWords.map((w, i) => (
                <div
                  key={i}
                  className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium"
                >
                  {w.word}
                </div>
              ))}
            </div>
          </div>
          
          {/* Share Button */}
          <Button
            onClick={handleShare}
            className="w-full"
            size="lg"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Results
          </Button>

          {/* Leaderboard Section - only show for wins */}
          {isAuthenticated && isWin && (
            <div className="mt-6">
              <GridLeaderboard dateSeed={dailySeed} />
            </div>
          )}

          {!isAuthenticated && isWin && (
            <div className="mt-6 p-4 bg-card/30 rounded-lg border border-border/30 text-center">
              <p className="text-sm text-muted-foreground">
                Sign in to submit your score to the global leaderboard
              </p>
            </div>
          )}
          
          {!isWin && (
            <div className="mt-4 p-4 bg-card/30 rounded-lg border border-border/30 text-center">
              <p className="text-sm text-muted-foreground">
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