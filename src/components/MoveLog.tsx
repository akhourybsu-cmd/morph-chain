import { HintTile, TileState } from "./HintTile";
import { TrendingDown, TrendingUp, Flag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Move {
  id: string;
  from: string;
  to: string;
  hints: TileState[];
  closerToGoal: boolean;
  isComplete?: boolean;
  isWorse?: boolean;
  timestamp: Date;
}

interface MoveLogProps {
  moves: Move[];
  simpleMode?: boolean;
  colorblindMode?: boolean;
  onDisputeWord?: (word: string) => void;
}

export const MoveLog = ({ moves, simpleMode = false, colorblindMode, onDisputeWord }: MoveLogProps) => {
  if (moves.length === 0) {
    return (
      <div className="px-6 py-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-chain/10 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-chain" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Ready to morph!</p>
            <p className="text-xs text-muted-foreground">Type your first word below</p>
          </div>
        </div>
      </div>
    );
  }

  // Reverse moves to show newest first
  const reversedMoves = [...moves].reverse();

  return (
    <div className="px-4 py-2 space-y-1.5 max-h-[35vh] overflow-y-auto">
      {reversedMoves.map((move, index) => {
        const moveNumber = moves.length - index;
        return (
        <div
          key={move.id}
          className="bg-card border border-border rounded-md p-2 animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <div className="w-5 text-xs font-bold text-muted-foreground flex-shrink-0">
              {moveNumber}
            </div>
            {simpleMode ? (
              <>
                <div className="flex items-center gap-2 font-mono text-sm flex-1 min-w-0">
                  <span className="font-semibold tracking-tiles">
                    {move.to.split('').map((letter, i) => {
                      const hintState = move.hints[i];
                      const colorClass = 
                        hintState === 'match' ? 'text-success' :
                        hintState === 'present' ? 'text-warning' :
                        'text-muted-foreground';
                      return (
                        <span key={i} className={colorClass}>
                          {letter}
                        </span>
                      );
                    })}
                  </span>
                  {onDisputeWord && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 ml-1 opacity-50 hover:opacity-100"
                      onClick={() => onDisputeWord(move.to)}
                      title="Report word issue"
                    >
                      <Flag className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {move.isComplete ? (
                    <span className="text-success text-xs font-bold">✓</span>
                  ) : move.closerToGoal ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : move.isWorse ? (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-warning" />
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex gap-1">
                    {move.hints.map((state, i) => (
                      <HintTile
                        key={i}
                        letter={move.to[i]}
                        state={state}
                        delay={i * 50}
                        colorblindMode={colorblindMode}
                      />
                    ))}
                  </div>
                  {onDisputeWord && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 ml-1 opacity-50 hover:opacity-100"
                      onClick={() => onDisputeWord(move.to)}
                      title="Report word issue"
                    >
                      <Flag className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {move.isComplete ? (
                    <span className="text-success text-xs font-bold">✓</span>
                  ) : move.closerToGoal ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : move.isWorse ? (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-warning" />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      );
      })}
    </div>
  );
};
