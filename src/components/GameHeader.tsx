import { Menu, TrendingUp, HelpCircle, User, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { syncStatsFromSupabase } from "@/lib/supabaseSync";

interface GameHeaderProps {
  onOpenSettings: () => void;
  onOpenStats: () => void;
  onOpenHelp: () => void;
  streak?: number;
}

export const GameHeader = ({ onOpenSettings, onOpenStats, onOpenHelp, streak = 0 }: GameHeaderProps) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        syncStatsFromSupabase();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        syncStatsFromSupabase();
      }
    });

    return () => subscription.unsubscribe();
  }, []);


  return (
    <header className="h-14 grid grid-cols-3 items-center px-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-1 justify-start">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
          aria-label="Open settings"
          className="hover:bg-muted/50 h-9 w-9"
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenHelp}
          aria-label="How to play"
          className="hover:bg-muted/50 h-9 w-9"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="flex justify-center items-center gap-2">
        <Logo />
        {streak > 0 && (
          <div 
            className="flex items-center gap-1 px-2 py-1 bg-warning/10 rounded-full"
            title={`${streak} day streak`}
          >
            <Flame className="h-4 w-4 text-warning" />
            <span className="text-xs font-bold text-warning">{streak}</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-1 justify-end">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenStats}
          aria-label="View statistics"
          className="hover:bg-muted/50 h-9 w-9"
        >
          <TrendingUp className="h-5 w-5" />
        </Button>

        {user ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/profile')}
            aria-label="View profile"
            className="hover:bg-muted/50 h-9 w-9"
            title="View profile"
          >
            <User className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/login')}
            aria-label="Sign in to sync progress"
            className="hover:bg-muted/50 h-9 w-9"
            title="Sign in to sync progress across devices"
          >
            <User className="h-5 w-5" />
          </Button>
        )}
      </div>
    </header>
  );
};
