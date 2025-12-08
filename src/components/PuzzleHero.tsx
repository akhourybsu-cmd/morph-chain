import { ArrowRight } from "lucide-react";

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
  const dots = Array(maxMoves).fill(0);
  // Hide goal word per Core spec - show ???? of matching length
  const hiddenGoal = "?".repeat(goalWord.length);

  return (
    <div className="px-3 py-4 space-y-3 md:px-6 md:py-6 md:space-y-4">
      <div className="flex items-center justify-center gap-3 md:gap-4">
        <WordBadge label="START" word={startWord} />
        <div className="flex items-center mt-2">
          <svg 
            width="48" 
            height="24" 
            viewBox="0 0 48 24" 
            className="text-primary"
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
        <WordBadge label="GOAL" word={hiddenGoal} isHidden />
      </div>

      <div className="flex items-center justify-center gap-1">
        {dots.map((_, i) => {
          const isUsed = i < movesUsed;
          return (
            <div
              key={i}
              className={`h-1.5 w-1.5 md:h-2 md:w-2 rounded-full transition-all duration-200 ${
                isUsed ? "bg-primary animate-scale-in" : "bg-muted/30"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};

const WordBadge = ({ label, word, isHidden = false }: { label: string; word: string; isHidden?: boolean }) => {
  const letters = word.split("");

  return (
    <div className="flex flex-col items-center gap-1.5 md:gap-2">
      <span className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <div className={`flex gap-0.5 md:gap-1 px-2 py-1.5 md:px-3 md:py-2 bg-card border border-border rounded-lg ${isHidden ? 'opacity-80' : ''}`}>
        {letters.map((letter, i) => (
          <span
            key={i}
            className={`text-base md:text-xl font-mono font-semibold tracking-tiles uppercase ${isHidden ? 'text-muted-foreground' : ''}`}
          >
            {letter}
          </span>
        ))}
      </div>
    </div>
  );
};
