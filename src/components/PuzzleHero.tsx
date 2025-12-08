interface PuzzleHeroProps {
  startWord: string;
  goalWord: string;
  movesUsed: number;
  maxMoves: number;
}

export const PuzzleHero = ({
  startWord,
  goalWord,
  movesUsed,
  maxMoves,
}: PuzzleHeroProps) => {
  return (
    <div className="px-3 py-4 space-y-4 md:px-6 md:py-6 md:space-y-5">
      <div className="flex items-center justify-center gap-3 md:gap-4">
        <WordBadge label="START" word={startWord} variant="start" />
        <div className="flex items-center mt-2">
          <svg 
            width="48" 
            height="24" 
            viewBox="0 0 48 24" 
            className="text-chain"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M2 12H42M42 12L34 4M42 12L34 20" 
              stroke="currentColor" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <WordBadge label="GOAL" word={goalWord} variant="goal" />
      </div>

      <ProgressIndicator movesUsed={movesUsed} maxMoves={maxMoves} />
    </div>
  );
};

const WordBadge = ({ label, word, variant }: { label: string; word: string; variant: 'start' | 'goal' }) => {
  const letters = word.split("");
  const isGoal = variant === 'goal';

  return (
    <div className="flex flex-col items-center gap-1.5 md:gap-2">
      <span className={`text-[10px] md:text-xs font-medium uppercase tracking-wide ${
        isGoal ? 'text-chain' : 'text-muted-foreground'
      }`}>
        {label}
      </span>
      <div className={`flex gap-0.5 md:gap-1 px-2 py-1.5 md:px-3 md:py-2 bg-card border rounded-lg ${
        isGoal ? 'border-chain/30' : 'border-border'
      }`}>
        {letters.map((letter, i) => (
          <span
            key={i}
            className={`text-base md:text-xl font-mono font-semibold tracking-tiles uppercase ${
              isGoal ? 'text-chain' : ''
            }`}
          >
            {letter}
          </span>
        ))}
      </div>
    </div>
  );
};

const ProgressIndicator = ({ movesUsed, maxMoves }: { movesUsed: number; maxMoves: number }) => {
  const dots = Array(maxMoves).fill(0);
  
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center justify-center gap-1.5 md:gap-2">
        {dots.map((_, i) => {
          const isUsed = i < movesUsed;
          const isCurrent = i === movesUsed;
          return (
            <div
              key={i}
              className={`h-2.5 w-2.5 md:h-3 md:w-3 rounded-full transition-all duration-300 ${
                isUsed 
                  ? "bg-chain shadow-[0_0_6px_hsl(var(--chain-accent)/0.5)]" 
                  : isCurrent
                    ? "bg-muted-foreground/50 ring-2 ring-chain/30"
                    : "bg-muted/40"
              }`}
            />
          );
        })}
      </div>
      <span className="text-[10px] md:text-xs text-muted-foreground">
        {movesUsed} / {maxMoves} moves
      </span>
    </div>
  );
};
