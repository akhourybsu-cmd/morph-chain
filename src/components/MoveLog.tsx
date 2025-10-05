import { HintTile, TileState } from "./HintTile";
import { ArrowRight, CircleDot, TrendingDown } from "lucide-react";

export interface Move {
  id: string;
  from: string;
  to: string;
  hints: TileState[];
  closerToGoal: boolean;
  timestamp: Date;
}

interface MoveLogProps {
  moves: Move[];
  showHints: boolean;
  colorblindMode?: boolean;
}

export const MoveLog = ({ moves, showHints, colorblindMode }: MoveLogProps) => {
  if (moves.length === 0) {
    return (
      <div className="px-6 py-8 text-center text-muted-foreground">
        <p className="text-sm">Your moves will appear here</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 space-y-3 max-h-96 overflow-y-auto">
      {moves.map((move, index) => (
        <div
          key={move.id}
          className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg animate-slide-in"
        >
          <div className="flex items-center gap-2 flex-1">
            <span className="font-mono font-semibold text-sm uppercase tracking-tiles">
              {move.from}
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono font-semibold text-sm uppercase tracking-tiles">
              {move.to}
            </span>
          </div>

          {showHints && (
            <div className="flex gap-1">
              {move.hints.map((state, i) => (
                <HintTile
                  key={i}
                  letter={move.to[i]}
                  state={state}
                  delay={i * 120}
                  colorblindMode={colorblindMode}
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-1">
            {move.closerToGoal ? (
              <div className="flex items-center gap-1 px-2 py-1 bg-success/10 text-success rounded text-xs font-medium">
                <TrendingDown className="h-3 w-3" />
                Closer
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 bg-warning/10 text-warning rounded text-xs font-medium">
                <CircleDot className="h-3 w-3" />
                Sideways
              </div>
            )}
          </div>

          <time className="text-xs text-muted-foreground">
            {move.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
        </div>
      ))}
    </div>
  );
};
