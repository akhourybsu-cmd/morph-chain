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
    <div className="flex items-center justify-between px-6 py-3 bg-card border-b border-border sticky top-14 z-10">
      <span className="text-sm text-secondary">
        #{date} • {wordLength}-letter • {maxMoves} moves max
      </span>
      
      <Badge
        variant={hardMode ? "default" : "outline"}
        className="cursor-pointer transition-colors"
        onClick={onToggleHardMode}
      >
        Hard Mode
      </Badge>
    </div>
  );
};
