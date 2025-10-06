import { Badge } from "@/components/ui/badge";
import { formatInTimeZone } from "date-fns-tz";

interface DailyBannerProps {
  date: string;
  wordLength: number;
  maxMoves: number;
  puzzleIndex: number;
  hardMode: boolean;
  onToggleHardMode: () => void;
}

export const DailyBanner = ({
  date,
  wordLength,
  maxMoves,
  puzzleIndex,
  hardMode,
  onToggleHardMode,
}: DailyBannerProps) => {
  // Format date as "October 6, 2025" in NY timezone
  const timezone = "America/New_York";
  const formattedDate = formatInTimeZone(new Date(), timezone, 'MMMM d, yyyy');
  
  return (
    <div className="flex items-center justify-between px-3 py-2 md:px-6 md:py-3 bg-card border-b border-border sticky top-14 z-10">
      <span className="text-[10px] md:text-sm text-secondary">
        Puzzle #{puzzleIndex + 1} - {formattedDate} - {maxMoves} Max Attempts
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
