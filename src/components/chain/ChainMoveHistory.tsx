import { ChainHintTile } from "./ChainHintTile";

interface Move {
  id: string;
  from: string;
  to: string;
  hints: Array<"match" | "present" | "miss">;
  closerToGoal: boolean;
  isComplete: boolean;
  isWorse: boolean;
}

interface ChainMoveHistoryProps {
  moves: Move[];
  colorblindMode?: boolean;
  onDisputeWord?: (word: string) => void;
}

export const ChainMoveHistory = ({
  moves,
  colorblindMode,
  onDisputeWord,
}: ChainMoveHistoryProps) => {
  if (moves.length === 0) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-sm text-[hsl(var(--chain-text-muted))] italic">
          Ready to morph...
        </p>
      </div>
    );
  }

  const getDirectionIndicator = (move: Move) => {
    if (move.isComplete) return "✓";
    if (move.closerToGoal) return "↑";
    if (move.isWorse) return "↓";
    return "↔";
  };

  return (
    <div className="px-4 py-4">
      <div className="space-y-3 max-w-sm mx-auto">
        {[...moves].reverse().map((move, index) => {
          const moveNumber = moves.length - index;
          return (
            <div
              key={move.id}
              className="flex items-center gap-3 animate-fade-in"
            >
              {/* Move number */}
              <span className="w-6 text-right text-xs text-[hsl(var(--chain-text-muted))] font-mono">
                {moveNumber}.
              </span>

              {/* Word tiles */}
              <div className="flex gap-0.5">
                {move.to.split("").map((letter, i) => (
                  <ChainHintTile
                    key={i}
                    letter={letter}
                    hint={move.hints[i]}
                    colorblindMode={colorblindMode}
                  />
                ))}
              </div>

              {/* Direction indicator */}
              <span
                className={`text-sm ${
                  move.isComplete
                    ? "text-[hsl(var(--chain-success))]"
                    : move.closerToGoal
                    ? "text-[hsl(var(--chain-success))]"
                    : move.isWorse
                    ? "text-[hsl(var(--chain-error))]"
                    : "text-[hsl(var(--chain-text-muted))]"
                }`}
              >
                {getDirectionIndicator(move)}
              </span>

              {/* Dispute button */}
              {onDisputeWord && (
                <button
                  onClick={() => onDisputeWord(move.to)}
                  className="text-[10px] text-[hsl(var(--chain-text-muted))] hover:text-[hsl(var(--chain-text-secondary))] ml-auto"
                >
                  Report
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
