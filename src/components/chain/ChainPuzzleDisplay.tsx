interface ChainPuzzleDisplayProps {
  startWord: string;
  goalWord: string;
  movesUsed: number;
  maxMoves: number;
  isPractice?: boolean;
}

export const ChainPuzzleDisplay = ({
  startWord,
  goalWord,
  movesUsed,
  maxMoves,
  isPractice,
}: ChainPuzzleDisplayProps) => {
  return (
    <div className="px-[var(--chain-h-padding,16px)] py-4 md:py-6">
      {/* Word display */}
      <div className="flex items-center justify-center gap-2 md:gap-4">
        {/* Start word */}
        <div className="text-center">
          <span className="text-[10px] uppercase tracking-widest text-[hsl(var(--chain-text-muted))] mb-1.5 block">
            Start
          </span>
          <div className="flex" style={{ gap: 'var(--chain-gap, 4px)' }}>
            {startWord.split("").map((letter, i) => (
              <div
                key={i}
                className="chain-tile flex items-center justify-center font-serif text-base md:text-lg font-semibold text-[hsl(var(--chain-text-primary))]"
                style={{
                  width: 'var(--chain-tile-size, 40px)',
                  height: 'var(--chain-tile-size, 40px)',
                }}
              >
                {letter}
              </div>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <span className="text-[hsl(var(--chain-text-muted))] text-lg mt-5 px-1">→</span>

        {/* Goal word */}
        <div className="text-center">
          <span className="text-[10px] uppercase tracking-widest text-[hsl(var(--chain-text-muted))] mb-1.5 block">
            Goal
          </span>
          <div className="flex" style={{ gap: 'var(--chain-gap, 4px)' }}>
            {goalWord.split("").map((letter, i) => (
              <div
                key={i}
                className="chain-tile chain-tile-goal flex items-center justify-center font-serif text-base md:text-lg font-semibold text-[hsl(var(--chain-text-primary))]"
                style={{
                  width: 'var(--chain-tile-size, 40px)',
                  height: 'var(--chain-tile-size, 40px)',
                }}
              >
                {letter}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Move counter */}
      <p className="text-center mt-3 text-xs text-[hsl(var(--chain-text-muted))]">
        Moves: {movesUsed} / {maxMoves}
      </p>

      {/* Practice badge */}
      {isPractice && (
        <p className="text-center mt-1 text-[10px] uppercase tracking-widest text-[hsl(var(--chain-accent)/0.7)]">
          Practice Round
        </p>
      )}
    </div>
  );
};
