import { useGridStore } from '@/stores/gridStore';
import { cn } from '@/lib/utils';

const MAX_MOVES = 20;

interface ScoreDisplayProps {
  compact?: boolean;
}

export const ScoreDisplay = ({ compact = false }: ScoreDisplayProps) => {
  const moves = useGridStore(state => state.moves);
  const purpleCount = useGridStore(state => state.purpleCount);
  const score = useGridStore(state => state.score);

  const progressPercent = (purpleCount / 25) * 100;
  const movesRemaining = MAX_MOVES - moves;
  const isLowMoves = movesRemaining <= 3;

  if (compact) {
    return (
      <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm font-inter whitespace-nowrap">
        <span className={cn(
          "font-medium",
          isLowMoves ? "text-[hsl(var(--grid-error))]" : "text-[hsl(var(--grid-accent))]"
        )}>
          <span className="hidden md:inline">Moves: </span>{moves}/{MAX_MOVES}
        </span>
        {isLowMoves && (
          <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--grid-error))] animate-pulse" />
        )}
        <span className="text-[hsl(var(--grid-text-muted))]">·</span>
        <span className="text-[hsl(var(--grid-text-secondary))]">
          <span className="hidden md:inline">Goal: </span><span className="font-semibold text-[hsl(var(--grid-text-primary))]">{purpleCount}</span>/25
        </span>
        <div className="w-8 md:w-16 h-1.5 bg-[hsl(var(--grid-divider))] rounded-full overflow-hidden">
          <div
            className="h-full bg-[hsl(var(--grid-tier3))] transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {score > 0 && (
          <>
            <span className="text-[hsl(var(--grid-text-muted))]">·</span>
            <span className="font-semibold text-[hsl(var(--grid-tier3))]">{score}pts</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 py-3 px-4 bg-white rounded-xl border border-[hsl(var(--grid-card-border))]">
      <div className="flex justify-around items-center">
        <div className="text-center">
          <div className={cn(
            "text-3xl font-inter font-bold",
            isLowMoves ? "text-[hsl(var(--grid-error))]" : "text-[hsl(var(--grid-accent))]"
          )}>
            {moves}<span className="text-xl text-[hsl(var(--grid-text-muted))]">/{MAX_MOVES}</span>
          </div>
          <div className="text-xs text-[hsl(var(--grid-text-muted))] mt-0.5 font-inter">Moves</div>
        </div>

        <div className="w-px h-10 bg-[hsl(var(--grid-divider))]" />

        <div className="text-center">
          <div className="text-3xl font-inter font-bold text-[hsl(var(--grid-text-primary))]">
            {purpleCount}<span className="text-xl text-[hsl(var(--grid-text-muted))]">/25</span>
          </div>
          <div className="text-xs text-[hsl(var(--grid-text-muted))] mt-0.5 font-inter">Purple</div>
        </div>

        <div className="w-px h-10 bg-[hsl(var(--grid-divider))]" />

        <div className="text-center">
          <div className="text-3xl font-inter font-bold text-[hsl(var(--grid-tier3))]">
            {score}
          </div>
          <div className="text-xs text-[hsl(var(--grid-text-muted))] mt-0.5 font-inter">Score</div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="w-full h-2 bg-[hsl(var(--grid-divider))] rounded-full overflow-hidden">
          <div
            className="h-full bg-[hsl(var(--grid-tier3))] transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
