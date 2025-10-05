import { Button } from "@/components/ui/button";
import { Trophy, X, Share2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ResultPanelProps {
  won: boolean;
  movesUsed: number;
  goalWord: string;
  minDistance: number;
  shareText: string;
  onPlayAgain: () => void;
}

export const ResultPanel = ({
  won,
  movesUsed,
  goalWord,
  minDistance,
  shareText,
  onPlayAgain,
}: ResultPanelProps) => {
  const { toast } = useToast();

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied to clipboard",
        duration: 2500,
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        variant: "destructive",
        duration: 2500,
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          text: shareText,
          title: "Morph Chain",
        });
      } catch (error) {
        // User cancelled or share failed
      }
    } else {
      handleCopyShare();
    }
  };

  return (
    <div className="px-6 py-8 space-y-6 bg-card/50 border-y border-border">
      <div className="text-center space-y-2">
        {won ? (
          <>
            <div className="flex justify-center">
              <Trophy className="h-12 w-12 text-primary animate-scale-in" />
            </div>
            <h2 className="text-2xl font-semibold">
              Reached {goalWord} in {movesUsed}!
            </h2>
            <p className="text-sm text-muted-foreground">
              Optimal path was {minDistance} moves
            </p>
          </>
        ) : (
          <>
            <div className="flex justify-center">
              <X className="h-12 w-12 text-destructive animate-scale-in" />
            </div>
            <h2 className="text-2xl font-semibold">Out of moves</h2>
            <p className="text-sm text-muted-foreground">
              Minimum possible was {minDistance} moves
            </p>
          </>
        )}
      </div>

      <div className="flex gap-3">
        <Button onClick={handleShare} className="flex-1 gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        <Button onClick={handleCopyShare} variant="outline" className="flex-1 gap-2">
          <Copy className="h-4 w-4" />
          Copy
        </Button>
      </div>

      <Button onClick={onPlayAgain} variant="secondary" className="w-full">
        Play Again (Practice)
      </Button>
    </div>
  );
};
