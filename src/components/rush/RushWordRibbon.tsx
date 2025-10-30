import { ScrollArea } from "@/components/ui/scroll-area";
import { RushWord } from "@/lib/rushLogic";

interface RushWordRibbonProps {
  words: RushWord[];
}

export const RushWordRibbon = ({ words }: RushWordRibbonProps) => {
  if (words.length === 0) return null;
  
  return (
    <div className="px-3 md:px-6 overflow-x-auto">
      <div className="flex gap-1.5 md:gap-2 pb-2">
        {words.map((wordData, i) => (
          <div
            key={i}
            className="flex-shrink-0 flex flex-col items-center gap-0.5 p-1.5 md:p-2 bg-card border border-border rounded-lg min-w-[60px] md:min-w-[70px]"
          >
            <span className="text-xs md:text-sm font-mono font-semibold uppercase">
              {wordData.word}
            </span>
            <span className="text-[10px] md:text-xs text-primary font-semibold">
              +{wordData.totalScore}
            </span>
            <span className="text-[9px] md:text-[10px] text-muted-foreground">
              {wordData.multiplier.toFixed(1)}x
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
