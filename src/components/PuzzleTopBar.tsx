import { Clock } from "lucide-react";
import { useState, useEffect } from "react";

interface PuzzleTopBarProps {
  puzzleNumber: number;
  date: string;
  movesUsed: number;
  moveCap: number;
}

export const PuzzleTopBar = ({ puzzleNumber, date, movesUsed, moveCap }: PuzzleTopBarProps) => {
  const [timeUntilMidnight, setTimeUntilMidnight] = useState("");

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
      const tomorrow = new Date(nyTime);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow.getTime() - nyTime.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeUntilMidnight(`${hours}h ${minutes}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Format date for display (e.g., "Mon, Oct 6")
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-card/30 border-b border-border text-xs">
      <div className="flex items-center gap-3">
        <span className="font-semibold text-foreground">
          Puzzle #{puzzleNumber}
        </span>
        <span className="text-muted-foreground">
          {formatDate(date)} (NY)
        </span>
      </div>
      
      <div className="flex items-center gap-3">
        <span className="font-mono text-foreground">
          {movesUsed}/{moveCap}
        </span>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span className="font-mono">{timeUntilMidnight}</span>
        </div>
      </div>
    </div>
  );
};
