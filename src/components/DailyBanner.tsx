import { Badge } from "@/components/ui/badge";

interface DailyBannerProps {
  date: string;
  wordLength: number;
  maxMoves: number;
  hardMode: boolean;
  onToggleHardMode: () => void;
}

export const DailyBanner = ({
  date,
  wordLength,
  maxMoves,
  hardMode,
  onToggleHardMode,
}: DailyBannerProps) => {
  return (
    <div className="flex items-center justify-between px-3 py-2 md:px-6 md:py-3 bg-card border-b border-border sticky top-14 z-10">
      <span className="text-[10px] md:text-sm text-secondary">
        #{date} • {wordLength}L • {maxMoves} max
      </span>
      
      <Badge
        variant={hardMode ? "default" : "outline"}
        className="cursor-pointer transition-colors text-[10px] md:text-xs h-5 md:h-6 px-2 md:px-2.5"
        onClick={onToggleHardMode}
      >
        Hard
      </Badge>
    </div>
  );
};
