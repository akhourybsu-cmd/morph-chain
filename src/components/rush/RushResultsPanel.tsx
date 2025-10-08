import { Button } from "@/components/ui/button";
import { Share2, Trophy, TrendingUp, Target, AlertCircle } from "lucide-react";
import { RushWord } from "@/lib/rushLogic";
import { useToast } from "@/hooks/use-toast";

interface RushResultsPanelProps {
  score: number;
  words: RushWord[];
  multiplierMax: number;
  invalidCount: number;
  endBonuses: {
    cleanRun: number;
    explorer: number;
    total: number;
  };
  finalScore: number;
  shareText: string;
  onPlayAgain?: () => void;
  mode: 'daily' | 'practice';
}

export const RushResultsPanel = ({
  score,
  words,
  multiplierMax,
  invalidCount,
  endBonuses,
  finalScore,
  shareText,
  onPlayAgain,
  mode
}: RushResultsPanelProps) => {
  const { toast } = useToast();
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ text: shareText }).catch(() => {
        navigator.clipboard.writeText(shareText);
        toast({ title: "Copied to clipboard!" });
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast({ title: "Copied to clipboard!" });
    }
  };
  
  return (
    <div className="px-3 py-4 md:px-6 md:py-6 space-y-4">
      <div className="text-center space-y-2">
        <Trophy className="h-12 w-12 md:h-16 md:w-16 mx-auto text-primary" />
        <h2 className="text-2xl md:text-3xl font-bold">
          {mode === 'daily' ? 'Run Complete!' : 'Practice Complete!'}
        </h2>
        <p className="text-4xl md:text-5xl font-bold text-primary">
          {finalScore.toLocaleString()}
        </p>
        <p className="text-sm md:text-base text-muted-foreground">Final Score</p>
      </div>
      
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <StatCard icon={Target} label="Words" value={words.length.toString()} />
        <StatCard icon={TrendingUp} label="Max Flow" value={`${multiplierMax.toFixed(1)}x`} />
        <StatCard icon={AlertCircle} label="Invalid" value={invalidCount.toString()} />
        <StatCard icon={Trophy} label="Base Score" value={score.toLocaleString()} />
      </div>
      
      {(endBonuses.cleanRun > 0 || endBonuses.explorer > 0) && (
        <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
          <p className="text-xs md:text-sm font-semibold text-center">End Bonuses</p>
          {endBonuses.cleanRun > 0 && (
            <div className="flex justify-between text-xs md:text-sm">
              <span>Clean Run (0 invalid)</span>
              <span className="text-success font-semibold">+{endBonuses.cleanRun}</span>
            </div>
          )}
          {endBonuses.explorer > 0 && (
            <div className="flex justify-between text-xs md:text-sm">
              <span>Explorer ({new Set(words.map(w => w.word[0])).size} letters)</span>
              <span className="text-success font-semibold">+{endBonuses.explorer}</span>
            </div>
          )}
        </div>
      )}
      
      <div className="flex gap-2">
        <Button onClick={handleShare} className="flex-1">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
        {mode === 'practice' && onPlayAgain && (
          <Button onClick={onPlayAgain} variant="outline" className="flex-1">
            Play Again
          </Button>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex flex-col items-center gap-1 p-2 md:p-3 bg-card border border-border rounded-lg">
    <Icon className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
    <span className="text-xs md:text-sm text-muted-foreground">{label}</span>
    <span className="text-base md:text-lg font-semibold">{value}</span>
  </div>
);
