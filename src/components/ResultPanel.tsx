import { Button } from "@/components/ui/button";
import { Trophy, X, Share2, Copy, ExternalLink } from "lucide-react";
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

  // Parse share text to make link clickable
  const renderSharePreview = () => {
    const lines = shareText.split('\n');
    return (
      <div className="bg-background/50 rounded-lg p-4 text-sm font-mono space-y-1">
        {lines.map((line, index) => {
          // Check if this line contains the URL
          if (line.includes('morphchaingame.com')) {
            return (
              <div key={index} className="flex items-center gap-2">
                <a 
                  href="https://morphchaingame.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  {line}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            );
          }
          return <div key={index}>{line}</div>;
        })}
      </div>
    );
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
          </>
        ) : (
          <>
            <div className="flex justify-center">
              <X className="h-12 w-12 text-destructive animate-scale-in" />
            </div>
            <h2 className="text-2xl font-semibold">Out of moves</h2>
          </>
        )}
      </div>

      {/* Share preview with clickable link */}
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground text-center">Share your results:</p>
        {renderSharePreview()}
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
