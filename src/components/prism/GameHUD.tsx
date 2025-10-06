import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUp, Circle, Lightbulb, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameHUDProps {
  movesUsed: number;
  moveCap: number;
  hintsRemaining: number;
  lastMoveStatus: 'closer' | 'sideways' | null;
  onHint: () => void;
  onShare: () => void;
  gameWon: boolean;
  gameLost: boolean;
}

export const GameHUD = ({
  movesUsed,
  moveCap,
  hintsRemaining,
  lastMoveStatus,
  onHint,
  onShare,
  gameWon,
  gameLost,
}: GameHUDProps) => {
  return (
    <div className="flex flex-col gap-4 p-4 bg-card/50 backdrop-blur-sm rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Moves:</span>
          <Badge variant={movesUsed >= moveCap ? "destructive" : "secondary"}>
            {movesUsed} / {moveCap}
          </Badge>
        </div>
        
        {lastMoveStatus && !gameWon && !gameLost && (
          <Badge
            variant={lastMoveStatus === 'closer' ? 'default' : 'secondary'}
            className={cn(
              "gap-1",
              lastMoveStatus === 'closer' && "bg-green-500/20 text-green-700 dark:text-green-300"
            )}
          >
            {lastMoveStatus === 'closer' ? (
              <>
                <ArrowUp className="h-3 w-3" />
                Closer
              </>
            ) : (
              <>
                <Circle className="h-3 w-3" />
                Sideways
              </>
            )}
          </Badge>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onHint}
          disabled={hintsRemaining === 0 || gameWon || gameLost}
          className="flex-1 gap-2"
        >
          <Lightbulb className="h-4 w-4" />
          Hint ({hintsRemaining})
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onShare}
          disabled={!gameWon && !gameLost}
          className="gap-2"
        >
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </div>
    </div>
  );
};
