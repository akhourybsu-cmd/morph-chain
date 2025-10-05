import { HintTile, TileState } from "./HintTile";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

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
}

export const MoveLog = ({ moves, simpleMode = false, colorblindMode }: MoveLogProps) => {
  if (moves.length === 0) {
    return (
      <div className="px-6 py-8 text-center text-muted-foreground">
        <p className="text-sm">Your moves will appear here</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 space-y-2 max-h-[45vh] overflow-y-auto">
      {moves.map((move, index) => (
        <div
          key={move.id}
          className="bg-card border border-border rounded-lg p-3 animate-slide-in"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-mono text-sm">
              <span className="text-muted-foreground">{move.from}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-semibold tracking-tiles">{move.to}</span>
            </div>

            <div className="flex items-center gap-2">
              {move.isComplete ? (
                <span className="px-2 py-0.5 rounded-full bg-success/20 text-success text-xs font-medium border border-success/30">
                  Goal!
                </span>
              ) : move.closerToGoal ? (
                <span className="px-2 py-0.5 rounded-full bg-success/20 text-success text-xs font-medium flex items-center gap-1 border border-success/30">
                  <TrendingDown className="h-3 w-3" />
                  Closer
                </span>
              ) : move.isWorse ? (
                <span className="px-2 py-0.5 rounded-full bg-destructive/20 text-destructive text-xs font-medium flex items-center gap-1 border border-destructive/30">
                  <TrendingUp className="h-3 w-3" />
                  Farther
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-warning/20 text-warning text-xs font-medium flex items-center gap-1 border border-warning/30">
                  <Minus className="h-3 w-3" />
                  Same
                </span>
              )}
            </div>
          </div>

          {!simpleMode && (
            <div className="flex gap-1 mt-2">
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
          )}
        </div>
      ))}
    </div>
  );
};
