import { ArrowRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PuzzleHeroProps {
  startWord: string;
  goalWord: string;
  movesUsed: number;
  maxMoves: number;
  onToggleHints: () => void;
  showHints: boolean;
}

export const PuzzleHero = ({
  startWord,
  goalWord,
  movesUsed,
  maxMoves,
  onToggleHints,
  showHints,
}: PuzzleHeroProps) => {
  const dots = Array(maxMoves).fill(0);

  return (
    <div className="px-6 py-6 space-y-4">
      <div className="flex items-center justify-center gap-4">
        <WordBadge label="START" word={startWord} />
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
        <WordBadge label="GOAL" word={goalWord} />
      </div>

      <div className="flex items-center justify-center gap-3">
        <div className="flex gap-1">
          {dots.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-all duration-200 ${
                i < movesUsed
                  ? "bg-primary animate-scale-in"
                  : "bg-muted/30"
              }`}
            />
          ))}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleHints}
          className="h-6 px-2 text-xs"
        >
          <HelpCircle className="h-3 w-3 mr-1" />
          {showHints ? "Hide" : "Show"} hints
        </Button>
      </div>
    </div>
  );
};

const WordBadge = ({ label, word }: { label: string; word: string }) => {
  const letters = word.split("");

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <div className="flex gap-1 px-3 py-2 bg-card border border-border rounded-lg">
        {letters.map((letter, i) => (
          <span
            key={i}
            className="text-xl font-mono font-semibold tracking-tiles uppercase"
          >
            {letter}
          </span>
        ))}
      </div>
    </div>
  );
};
