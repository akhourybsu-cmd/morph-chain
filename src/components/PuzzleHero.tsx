import { ArrowRight, Type } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PuzzleHeroProps {
  startWord: string;
  goalWord: string;
  movesUsed: number;
  maxMoves: number;
  onToggleSimpleMode: () => void;
  simpleMode: boolean;
}

export const PuzzleHero = ({
  startWord,
  goalWord,
  movesUsed,
  maxMoves,
  onToggleSimpleMode,
  simpleMode,
}: PuzzleHeroProps) => {
  const dots = Array(maxMoves).fill(0);

  return (
    <div className="px-3 py-4 space-y-3 md:px-6 md:py-6 md:space-y-4">
      <div className="flex items-center justify-center gap-3 md:gap-4">
        <WordBadge label="START" word={startWord} />
        <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
        <WordBadge label="GOAL" word={goalWord} />
      </div>

      <div className="flex items-center justify-center gap-2 md:gap-3">
        <div className="flex gap-1">
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
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSimpleMode}
          className="h-6 px-2 text-[10px] md:text-xs"
        >
          <Type className="h-3 w-3 mr-1" />
          {simpleMode ? "Show tiles" : "Simple"}
        </Button>
      </div>
    </div>
  );
};

const WordBadge = ({ label, word }: { label: string; word: string }) => {
  const letters = word.split("");

  return (
    <div className="flex flex-col items-center gap-1.5 md:gap-2">
      <span className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <div className="flex gap-0.5 md:gap-1 px-2 py-1.5 md:px-3 md:py-2 bg-card border border-border rounded-lg">
        {letters.map((letter, i) => (
          <span
            key={i}
            className="text-base md:text-xl font-mono font-semibold tracking-tiles uppercase"
          >
            {letter}
          </span>
        ))}
      </div>
    </div>
  );
};