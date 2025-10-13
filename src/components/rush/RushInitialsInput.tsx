import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatInTimeZone } from "date-fns-tz";
import { markFirstDailyAttemptComplete, hasCompletedFirstDailyAttempt } from "@/lib/rushStorage";

interface RushInitialsInputProps {
  score: number;
  mode: 'daily' | 'practice';
  hardMode: boolean;
  multiplierMax: number;
  words: any[];
  invalidCount: number;
  onSubmitted: () => void;
}

export const RushInitialsInput = ({
  score,
  mode,
  hardMode,
  multiplierMax,
  words,
  invalidCount,
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
      const { data: prof } = await supabase
        .from("user_profiles")
        .select("default_initials")
        .eq("user_id", user.id)
        .single();
      if (prof?.default_initials) {
        setInitials(prof.default_initials.toUpperCase().slice(0, 3));
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (initials.length !== 3) return;

    // Only allow submission if this is the first daily attempt
    if (mode === 'daily' && hasCompletedFirstDailyAttempt()) {
      toast({
        title: "Already Submitted",
        description: "Only your first daily attempt counts for the leaderboard.",
        variant: "destructive"
      });
      onSubmitted();
      return;
    }

    setSubmitting(true);
    
    try {
      const tz = 'America/New_York';
      const dateLocal = formatInTimeZone(new Date(), tz, 'yyyy-MM-dd');
      
      // Generate session ID
      const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const { error } = await supabase
        .from('rush_runs')
        .insert({
          session_id: sessionId,
          user_id: (await supabase.auth.getUser()).data.user?.id || null,
          date_local: dateLocal,
          mode,
          score,
          multiplier_max: multiplierMax,
          invalid_count: invalidCount,
          hard_mode: hardMode,
          initials: initials.toUpperCase(),
          words: words,
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
        description: `${initials.toUpperCase()} - ${score.toLocaleString()} pts`,
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
