import { Timer } from "lucide-react";
import { useEffect } from "react";

interface CircularTimerProps {
  timeRemaining: number;
  totalTime: number;
  isRunning: boolean;
  onTick: () => void;
  mode: 'daily' | 'practice';
}

export const CircularTimer = ({ 
  timeRemaining, 
  totalTime, 
  isRunning, 
  onTick, 
  mode 
}: CircularTimerProps) => {
  useEffect(() => {
    if (!isRunning || mode === 'practice') return;
    
    const interval = setInterval(() => {
      onTick();
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isRunning, onTick, mode]);
  
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const percentage = (timeRemaining / totalTime) * 100;
  const isLowTime = timeRemaining <= 30 && timeRemaining > 0;
  const isVeryLowTime = timeRemaining <= 10 && timeRemaining > 0;
  const isExpired = timeRemaining === 0;
  
  // Determine color based on time
  let strokeColor = 'hsl(var(--rush-blue))';
  if (isExpired) strokeColor = 'hsl(var(--destructive))';
  else if (isVeryLowTime) strokeColor = 'hsl(var(--rush-red))';
  else if (isLowTime) strokeColor = 'hsl(var(--rush-orange))';
  
  if (mode === 'practice') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 rounded-lg">
        <span className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Practice
        </span>
      </div>
    );
  }
  
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
      isVeryLowTime ? 'animate-pulse' : ''
    }`}>
      <div className="relative w-10 h-10 flex items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" width="40" height="40">
          {/* Background circle */}
          <circle
            cx="20"
            cy="20"
            r={radius}
            stroke="hsl(var(--muted))"
            strokeWidth="3"
            fill="none"
            opacity="0.2"
          />
          {/* Progress circle */}
          <circle
            cx="20"
            cy="20"
            r={radius}
            stroke={strokeColor}
            strokeWidth="3"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300"
            style={{
              filter: isLowTime ? 'drop-shadow(0 0 4px currentColor)' : 'none'
            }}
          />
        </svg>
        <Timer className="h-4 w-4 z-10" style={{ color: strokeColor }} />
      </div>
      <span 
        className="text-sm md:text-base font-mono font-semibold tabular-nums"
        style={{ color: strokeColor }}
      >
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
};
