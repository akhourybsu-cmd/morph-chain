import { Share2, Trophy, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ShareToFriendsButton } from '@/components/social/ShareToFriendsButton';

interface PrestigeResultsPanelProps {
  totalMorphs: number;
  finalScore: number;
  shareText: string;
  onPlayAgain?: () => void;
  onViewLeaderboard: () => void;
  mode: 'daily' | 'practice';
  puzzleNumber: number;
}

export const PrestigeResultsPanel = ({
  totalMorphs,
  finalScore,
  shareText,
  onPlayAgain,
  onViewLeaderboard,
  mode,
  puzzleNumber
}: PrestigeResultsPanelProps) => {
  const { toast } = useToast();

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast({
          title: "Copied to clipboard!",
          description: "Share your results with friends",
        });
      }
    } catch (err) {
      // User cancelled share
    }
  };

  return (
    <div 
      className="p-6 rounded-xl space-y-6"
      style={{ 
        background: 'hsl(var(--rush-card-bg))',
        border: '1px solid hsl(var(--rush-card-border))',
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <div className="text-center">
        <p 
          className="text-sm uppercase tracking-wider mb-1"
          style={{ 
            color: 'hsl(var(--rush-text-muted))',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {mode === 'daily' ? `Puzzle #${puzzleNumber}` : 'Practice'}
        </p>
        <h2 
          className="text-lg font-medium"
          style={{ 
            color: 'hsl(var(--rush-text-secondary))',
            fontFamily: "'Playfair Display', Georgia, serif",
          }}
        >
          Rush Complete
        </h2>
      </div>

      {/* Large morph count */}
      <div className="text-center py-4">
        <p 
          className="text-6xl font-bold"
          style={{ 
            fontFamily: "'Playfair Display', Georgia, serif",
            color: 'hsl(var(--rush-text-primary))'
          }}
        >
          {totalMorphs}
        </p>
        <p 
          className="text-sm mt-1"
          style={{ color: 'hsl(var(--rush-text-muted))' }}
        >
          Words Morphed
        </p>
      </div>
      
      {/* Score */}
      <div 
        className="text-center py-3 rounded-lg"
        style={{ background: 'hsl(var(--rush-divider))' }}
      >
        <div className="flex items-center justify-center gap-2">
          <Trophy className="h-5 w-5" style={{ color: 'hsl(var(--rush-accent))' }} />
          <p 
            className="text-2xl font-bold"
            style={{ 
              color: 'hsl(var(--rush-text-primary))',
              fontFamily: "'Playfair Display', Georgia, serif",
            }}
          >
            {finalScore.toLocaleString()}
          </p>
        </div>
        <p 
          className="text-xs mt-0.5"
          style={{ color: 'hsl(var(--rush-text-muted))' }}
        >
          Total Score
        </p>
      </div>
      
      {/* Actions */}
      <div className="flex flex-col gap-3">
        <Button 
          onClick={handleShare} 
          className="w-full"
          style={{
            background: 'hsl(var(--rush-accent))',
            color: 'white',
          }}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share Results
        </Button>

        <ShareToFriendsButton
          game="rush"
          payload={{ score: finalScore, totalMorphs, mode, puzzleNumber }}
          accentVar="--rush-accent"
          className="w-full"
        />
        
        <button 
          onClick={onViewLeaderboard}
          className="text-sm font-medium hover:underline transition-colors"
          style={{ color: 'hsl(var(--rush-accent))' }}
        >
          View Leaderboard →
        </button>
        
        {onPlayAgain && (
          <button 
            onClick={onPlayAgain}
            className="flex items-center justify-center gap-2 text-sm font-medium hover:underline transition-colors mt-2"
            style={{ color: 'hsl(var(--rush-text-muted))' }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Practice Again
          </button>
        )}
      </div>
    </div>
  );
};
