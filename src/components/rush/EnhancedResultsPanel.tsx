import { Button } from "@/components/ui/button";
import { Share2, Trophy, TrendingUp, Target, Zap, Upload } from "lucide-react";
import { RushWord } from "@/lib/rushLogic";
import { useToast } from "@/hooks/use-toast";
import { ACHIEVEMENTS } from "@/lib/rushAchievements";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EnhancedResultsPanelProps {
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
  puzzleNumber: number;
  sessionAchievements: string[];
  newAchievements: string[];
  hardMode: boolean;
  dateLocal: string;
  alreadySubmitted?: boolean;
}

export const EnhancedResultsPanel = ({
  score,
  words,
  multiplierMax,
  invalidCount,
  endBonuses,
  finalScore,
  shareText,
  onPlayAgain,
  mode,
  puzzleNumber,
  sessionAchievements,
  newAchievements,
  hardMode,
  dateLocal,
  alreadySubmitted = false
}: EnhancedResultsPanelProps) => {
  const { toast } = useToast();
  const [initials, setInitials] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(alreadySubmitted);
  
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
  
  // Calculate fastest morph time
  const morphTimes = words.map((w, i) => {
    if (i === 0) return null;
    return (w.timestamp.getTime() - words[i - 1].timestamp.getTime()) / 1000;
  }).filter(t => t !== null) as number[];
  
  const fastestMorph = morphTimes.length > 0 
    ? Math.min(...morphTimes).toFixed(1) 
    : 'N/A';
  
  const handleSubmitToLeaderboard = async () => {
    if (!initials.trim() || initials.length > 3) {
      toast({ 
        title: "Invalid initials", 
        description: "Please enter 1-3 characters",
        variant: "destructive" 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ 
          title: "Authentication required", 
          description: "Please sign in to submit your score",
          variant: "destructive" 
        });
        return;
      }

      const { error } = await supabase.from('rush_runs').insert([{
        user_id: user.id,
        session_id: crypto.randomUUID(),
        date_local: dateLocal,
        score: finalScore,
        multiplier_max: multiplierMax,
        invalid_count: invalidCount,
        hard_mode: hardMode,
        initials: initials.toUpperCase(),
        mode: 'daily',
        official_status: 'finished',
        finished_at: new Date().toISOString(),
        words: words as any
      }]);

      if (error) throw error;

      setHasSubmitted(true);
      toast({ 
        title: "Success!", 
        description: "Your score has been submitted to the leaderboard" 
      });
    } catch (error: any) {
      console.error('Submission error:', error);
      toast({ 
        title: "Submission failed", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="px-3 py-4 md:px-6 md:py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <Trophy className="h-16 w-16 mx-auto text-rush-orange animate-breathe" />
        <h2 className="text-xl md:text-2xl font-bold">
          MORPH SUMMARY
        </h2>
        <p className="text-sm text-muted-foreground">
          Puzzle #{puzzleNumber}
        </p>
        <p className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-rush-blue via-rush-orange to-rush-violet bg-clip-text text-transparent">
          {finalScore.toLocaleString()}
        </p>
        <p className="text-sm text-muted-foreground">Final Score</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard 
          icon={Target} 
          label="Words Morphed" 
          value={words.length.toString()} 
          highlight={words.length >= 20}
        />
        <StatCard 
          icon={Zap} 
          label="Fastest Morph" 
          value={`${fastestMorph}s`}
          highlight={parseFloat(fastestMorph) < 3}
        />
        <StatCard 
          icon={TrendingUp} 
          label="Max Multiplier" 
          value={`${multiplierMax.toFixed(1)}x`}
          highlight={multiplierMax >= 2.0}
        />
        <StatCard 
          icon={Trophy} 
          label="Base Score" 
          value={score.toLocaleString()}
        />
      </div>
      
      {/* End Bonuses */}
      {(endBonuses.cleanRun > 0 || endBonuses.explorer > 0) && (
        <div className="space-y-2 p-4 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--rush-green) / 0.1) 0%, hsl(var(--rush-blue) / 0.1) 100%)',
            border: '1px solid hsl(var(--rush-green) / 0.3)'
          }}
        >
          <p className="text-sm font-semibold text-center text-rush-green">End Bonuses</p>
          {endBonuses.cleanRun > 0 && (
            <div className="flex justify-between text-sm">
              <span>Clean Run (0 invalid)</span>
              <span className="text-rush-green font-semibold">+{endBonuses.cleanRun}</span>
            </div>
          )}
          {endBonuses.explorer > 0 && (
            <div className="flex justify-between text-sm">
              <span>Explorer ({new Set(words.map(w => w.word[0])).size} letters)</span>
              <span className="text-rush-green font-semibold">+{endBonuses.explorer}</span>
            </div>
          )}
        </div>
      )}
      
      {/* Achievements */}
      {sessionAchievements.length > 0 && (
        <div className="space-y-3 p-4 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--rush-violet) / 0.1) 0%, hsl(var(--rush-orange) / 0.1) 100%)',
            border: '1px solid hsl(var(--rush-violet) / 0.3)'
          }}
        >
          <p className="text-sm font-semibold text-center text-rush-violet">Achievements Earned</p>
          <div className="space-y-2">
            {sessionAchievements.map(id => {
              const achievement = ACHIEVEMENTS[id];
              const isNew = newAchievements.includes(id);
              return (
                <div 
                  key={id}
                  className="flex items-start gap-3 px-3 py-2 rounded-lg bg-card border border-border relative"
                >
                  {isNew && (
                    <span className="absolute -top-2 -right-2 text-[10px] bg-rush-orange text-white px-2 py-0.5 rounded-full font-bold">
                      NEW
                    </span>
                  )}
                  <span className="text-2xl flex-shrink-0">{achievement.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{achievement.title}</p>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Leaderboard Submission */}
      {mode === 'daily' && !hasSubmitted && (
        <div className="space-y-3 p-4 rounded-xl bg-muted/30">
          <Label htmlFor="initials" className="text-sm font-semibold">Submit to Leaderboard</Label>
          <div className="flex gap-2">
            <Input
              id="initials"
              value={initials}
              onChange={(e) => setInitials(e.target.value.slice(0, 3))}
              placeholder="ABC"
              maxLength={3}
              className="text-center text-lg font-bold uppercase"
            />
            <Button 
              onClick={handleSubmitToLeaderboard}
              disabled={isSubmitting || !initials.trim()}
              className="bg-rush-orange hover:bg-rush-orange/90"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      )}
      
      {hasSubmitted && mode === 'daily' && (
        <div className="text-center p-3 rounded-lg bg-rush-green/10 border border-rush-green/30">
          <p className="text-sm text-rush-green font-semibold">✓ Score submitted to leaderboard!</p>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={handleShare} className="flex-1 bg-rush-orange hover:bg-rush-orange/90">
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

const StatCard = ({ 
  icon: Icon, 
  label, 
  value,
  highlight = false
}: { 
  icon: any; 
  label: string; 
  value: string;
  highlight?: boolean;
}) => (
  <div 
    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
      highlight 
        ? 'bg-rush-orange/10 border-rush-orange/50' 
        : 'bg-card border-border'
    }`}
  >
    <Icon className={`h-5 w-5 ${highlight ? 'text-rush-orange' : 'text-muted-foreground'}`} />
    <span className="text-xs text-muted-foreground text-center">{label}</span>
    <span className={`text-lg font-semibold ${highlight ? 'text-rush-orange' : ''}`}>{value}</span>
  </div>
);
