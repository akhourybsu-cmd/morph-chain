import { Timer } from "lucide-react";
import { useEffect } from "react";

interface RushTimerProps {
  timeRemaining: number;
  isRunning: boolean;
  onTick: () => void;
  mode: 'daily' | 'practice';
}

export const RushTimer = ({ timeRemaining, isRunning, onTick, mode }: RushTimerProps) => {
  useEffect(() => {
    if (!isRunning || mode === 'practice') return;
    
    const interval = setInterval(() => {
      onTick();
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isRunning, onTick, mode]);
  
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const isLowTime = timeRemaining <= 30 && timeRemaining > 0;
  const isExpired = timeRemaining === 0;
  
  if (mode === 'practice') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-lg">
        <span className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Practice
        </span>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
      isExpired ? "bg-destructive/20 text-destructive" :
      isLowTime ? "bg-warning/20 text-warning animate-pulse" :
      "bg-muted/30 text-foreground"
    }`}>
      <Timer className="h-3.5 w-3.5 md:h-4 md:w-4" />
      <span className="text-sm md:text-base font-mono font-semibold tabular-nums">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
};
