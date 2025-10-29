import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatInTimeZone } from "date-fns-tz";
import { markFirstDailyAttemptComplete, hasCompletedFirstDailyAttempt } from "@/lib/rushStorage";
import { initialsSchema } from "@/lib/validation";

interface RushInitialsInputProps {
  score: number;
  mode: 'daily' | 'practice';
  hardMode: boolean;
  multiplierMax: number;
  words: any[];
  invalidCount: number;
  scoutUsed: boolean;
  undoUsed: boolean;
  onSubmitted: () => void;
}

export const RushInitialsInput = ({
  score,
  mode,
  hardMode,
  multiplierMax,
  words,
  invalidCount,
  scoutUsed,
  undoUsed,
  onSubmitted
}: RushInitialsInputProps) => {
  const [initials, setInitials] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Preload default initials from profile
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) return;
      const { data: prof, error } = await supabase
        .from("user_profiles")
        .select("default_initials")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }
      
      if (prof?.default_initials) {
        setInitials(prof.default_initials.toUpperCase().slice(0, 3));
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (initials.length !== 3) return;

    // Validate initials
    const validation = initialsSchema.safeParse(initials);
    if (!validation.success) {
      toast({
        title: "Invalid Initials",
        description: validation.error.errors[0].message,
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    
    try {
      const tz = 'America/New_York';
      const dateLocal = formatInTimeZone(new Date(), tz, 'yyyy-MM-dd');
      
      // Generate session ID
      const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Authentication required');
      }

      const { error } = await supabase
        .from('rush_runs')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          date_local: dateLocal,
          mode,
          score,
          multiplier_max: multiplierMax,
          invalid_count: invalidCount,
          hard_mode: hardMode,
          initials: validation.data,
          words: words,
          scout_used: scoutUsed,
          undo_used: undoUsed,
          official_status: 'finished',
          finished_at: new Date().toISOString(),
          started_at: new Date().toISOString()
        });

      if (error) throw error;

      // Mark first daily attempt as complete
      if (mode === 'daily') {
        markFirstDailyAttemptComplete();
      }

      toast({
        title: "Score Submitted! 🎉",
        description: `${validation.data} - ${score.toLocaleString()} pts`,
      });

      onSubmitted();
    } catch (error) {
      console.error('Error submitting score:', error);
      toast({
        title: "Submission Failed",
        description: "Could not submit your score. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6 space-y-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <div className="text-center space-y-2">
        <Trophy className="h-12 w-12 text-primary mx-auto" />
        <h3 className="text-2xl font-bold">High Score!</h3>
        <p className="text-3xl font-bold text-primary">{score.toLocaleString()}</p>
        <p className="text-sm text-muted-foreground">
          Enter your initials for the daily leaderboard
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-center">
          <Input
            value={initials}
            onChange={(e) => setInitials(e.target.value.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase())}
            maxLength={3}
            placeholder="ABC"
            className="w-32 text-center text-3xl font-mono font-bold uppercase tracking-widest"
            autoFocus
          />
        </div>

        <Button
          type="submit"
          disabled={initials.length !== 3 || submitting}
          className="w-full"
          size="lg"
        >
          {submitting ? "Submitting..." : "Submit to Leaderboard"}
        </Button>
      </form>

      <p className="text-xs text-center text-muted-foreground">
        {mode === 'daily' 
          ? "First daily attempt only • Resets at midnight ET" 
          : "Arcade-style leaderboard • Resets daily at midnight ET"}
      </p>
    </Card>
  );
};
