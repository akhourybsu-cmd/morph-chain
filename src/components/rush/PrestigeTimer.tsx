import { useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

interface PrestigeTimerProps {
  timeRemaining: number;
  totalTime: number;
  isRunning: boolean;
  onTick: () => void;
}

export const PrestigeTimer = ({ 
  timeRemaining, 
  totalTime, 
  isRunning, 
  onTick 
}: PrestigeTimerProps) => {
  const intervalRef = useRef<number | null>(null);
  
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const isLow = timeRemaining <= 30;
  const isVeryLow = timeRemaining <= 10;
  
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = window.setInterval(onTick, 1000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining, onTick]);

  // Calculate progress for subtle bar
  const progress = timeRemaining / totalTime;

  return (
    <div 
      className={`
        px-4 py-2.5 rounded-xl flex items-center gap-2.5
        transition-all duration-200
        ${isVeryLow ? 'animate-pulse' : ''}
      `}
      style={{
        background: 'hsl(var(--rush-card-bg))',
        border: `1px solid ${isVeryLow 
          ? 'hsl(var(--grid-error))' 
          : 'hsl(var(--rush-card-border))'
        }`,
        boxShadow: isVeryLow 
          ? '0 0 12px hsl(var(--grid-error) / 0.2)' 
          : '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      <Clock 
        className="h-4 w-4" 
        style={{ 
          color: isVeryLow 
            ? 'hsl(var(--grid-error))' 
            : isLow 
              ? 'hsl(var(--rush-accent))' 
              : 'hsl(var(--rush-text-muted))'
        }}
      />
      <span 
        className="font-mono text-xl font-semibold tabular-nums"
        style={{ 
          fontFamily: "Inter, system-ui, sans-serif",
          color: isVeryLow 
            ? 'hsl(var(--grid-error))' 
            : isLow 
              ? 'hsl(var(--rush-accent))' 
              : 'hsl(var(--rush-text-primary))'
        }}
      >
        {minutes}:{seconds.toString().padStart(2, '0')}
      </span>
      
      {/* Subtle progress bar */}
      <div 
        className="w-12 h-1.5 rounded-full overflow-hidden"
        style={{ background: 'hsl(var(--rush-divider))' }}
      >
        <div 
          className="h-full rounded-full transition-all duration-1000 ease-linear"
          style={{ 
            width: `${progress * 100}%`,
            background: isVeryLow 
              ? 'hsl(var(--grid-error))' 
              : isLow 
                ? 'hsl(var(--rush-accent))' 
                : 'hsl(var(--rush-drop-target))'
          }}
        />
      </div>
    </div>
  );
};
