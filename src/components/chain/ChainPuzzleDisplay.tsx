interface ChainPuzzleDisplayProps {
  startWord: string;
  goalWord: string;
  movesUsed: number;
  maxMoves: number;
}

export const ChainPuzzleDisplay = ({
  startWord,
  goalWord,
  movesUsed,
  maxMoves,
}: ChainPuzzleDisplayProps) => {
  return (
    <div className="px-4 py-6 md:py-8">
      {/* Word display */}
      <div className="flex items-center justify-center gap-4 md:gap-6">
        {/* Start word */}
        <div className="text-center">
          <span className="text-[10px] uppercase tracking-widest text-[hsl(var(--chain-text-muted))] mb-2 block">
            Start
          </span>
          <div className="flex gap-1">
            {startWord.split("").map((letter, i) => (
              <div
                key={i}
                className="chain-tile w-10 h-10 md:w-12 md:h-12 flex items-center justify-center font-serif text-lg md:text-xl font-semibold text-[hsl(var(--chain-text-primary))]"
              >
                {letter}
              </div>
            ))}
          </div>
        </div>

        {/* Arrow */}
        <span className="text-[hsl(var(--chain-text-muted))] text-xl mt-5">→</span>

        {/* Goal word */}
        <div className="text-center">
          <span className="text-[10px] uppercase tracking-widest text-[hsl(var(--chain-text-muted))] mb-2 block">
            Goal
          </span>
          <div className="flex gap-1">
            {goalWord.split("").map((letter, i) => (
              <div
                key={i}
                className="chain-tile chain-tile-goal w-10 h-10 md:w-12 md:h-12 flex items-center justify-center font-serif text-lg md:text-xl font-semibold text-[hsl(var(--chain-text-primary))]"
              >
                {letter}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Move counter */}
      <p className="text-center mt-4 text-sm text-[hsl(var(--chain-text-muted))]">
        Moves: {movesUsed} / {maxMoves}
      </p>
    </div>
  );
};
