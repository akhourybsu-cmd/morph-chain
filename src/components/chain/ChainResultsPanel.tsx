import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Share, Copy, Archive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ShareToFriendsButton } from "@/components/social/ShareToFriendsButton";

interface ChainResultsPanelProps {
  won: boolean;
  movesUsed: number;
  goalWord: string;
  minDistance: number;
  shareText: string;
  streak?: number;
}

export const ChainResultsPanel = ({
  won,
  movesUsed,
  minDistance,
  shareText,
  streak,
}: ChainResultsPanelProps) => {
  const navigate = useNavigate();
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

  const handleArchiveClick = () => {
    if (isAuthenticated) {
      navigate('/chain/archive');
    } else {
      navigate('/login');
    }
  };
  const { toast } = useToast();
  const par = minDistance + 2;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      toast({ title: "Copied to clipboard" });
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const getPerformanceLabel = () => {
    if (!won) return null;
    if (movesUsed === minDistance) return "Perfect";
    if (movesUsed <= par) return "Under Par";
    return null;
  };

  const performanceLabel = getPerformanceLabel();

  return (
    <div className="px-4 py-8">
      <div className="chain-card max-w-sm mx-auto p-6 text-center space-y-4">
        {/* Result header */}
        <div>
          <h2 className="font-serif text-xl font-semibold text-[hsl(var(--chain-text-primary))]">
            {won ? "Puzzle Complete!" : "Out of Moves"}
          </h2>
          {won && (
            <p className="text-sm text-[hsl(var(--chain-text-secondary))] mt-1">
              Solved in {movesUsed} {movesUsed === 1 ? "step" : "steps"}
            </p>
          )}
        </div>

        {/* Performance badge */}
        {performanceLabel && (
          <div className="inline-block px-3 py-1 text-xs font-medium text-[hsl(var(--chain-accent))] border border-[hsl(var(--chain-accent)/0.3)] rounded-full">
            {performanceLabel}
          </div>
        )}

        {/* Stats */}
        <div className="flex justify-center gap-6 py-2 border-y border-[hsl(var(--chain-divider))]">
          <div>
            <p className="text-2xl font-serif font-semibold text-[hsl(var(--chain-text-primary))]">
              {movesUsed}
            </p>
            <p className="text-xs text-[hsl(var(--chain-text-muted))]">Moves</p>
          </div>
          <div>
            <p className="text-2xl font-serif font-semibold text-[hsl(var(--chain-text-primary))]">
              {par}
            </p>
            <p className="text-xs text-[hsl(var(--chain-text-muted))]">Par</p>
          </div>
          {streak !== undefined && streak > 0 && (
            <div>
              <p className="text-2xl font-serif font-semibold text-[hsl(var(--chain-text-primary))]">
                {streak}
              </p>
              <p className="text-xs text-[hsl(var(--chain-text-muted))]">Streak</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={handleShare}
            className="chain-button chain-button-primary px-4 py-2 text-sm font-medium flex items-center gap-2"
          >
            <Share className="h-4 w-4" />
            Share
          </button>
          <button
            onClick={handleCopy}
            className="chain-button px-4 py-2 text-sm font-medium flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy
          </button>
        </div>

        {/* Share with friends */}
        <ShareToFriendsButton
          game="chain"
          payload={{ won, movesUsed, minDistance, streak }}
          accentVar="--chain-accent"
        />

        {/* Archive Access */}
        <div className="pt-2 border-t border-[hsl(var(--chain-divider))]">
          <p className="text-xs text-[hsl(var(--chain-text-muted))] mb-2">Want to play more?</p>
          <button
            onClick={handleArchiveClick}
            className="flex items-center justify-center gap-2 text-sm text-[hsl(var(--chain-accent))] hover:text-[hsl(var(--chain-text-primary))] transition-colors"
          >
            <Archive className="h-4 w-4" />
            Access the Archive
          </button>
          {!isAuthenticated && (
            <p className="text-xs text-[hsl(var(--chain-text-muted))] mt-1">(Sign in required)</p>
          )}
        </div>
      </div>
    </div>
  );
};
