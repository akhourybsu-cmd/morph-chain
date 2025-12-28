import { useEffect, useState } from 'react';
import { checkDailyProgress, getCompletionCount, getTotalGames, DailyProgress } from '@/lib/dailyProgress';
import { Progress } from '@/components/ui/progress';
import { Check, Circle, Link2, Grid3X3, Zap, Search } from 'lucide-react';
import { isChristmas } from '@/lib/seasonal/christmas';

interface GameItem {
  key: keyof DailyProgress;
  label: string;
  icon: React.ElementType;
  accent: string;
  christmasAccent: string;
}

const games: GameItem[] = [
  { key: 'chain4L', label: 'Chain (4L)', icon: Link2, accent: '187 94% 48%', christmasAccent: '142 70% 45%' },
  { key: 'chain5L', label: 'Chain (5L)', icon: Link2, accent: '187 94% 48%', christmasAccent: '142 70% 45%' },
  { key: 'grid', label: 'Grid', icon: Grid3X3, accent: '186 68% 36%', christmasAccent: '0 75% 50%' },
  { key: 'rush', label: 'Rush', icon: Zap, accent: '24 78% 57%', christmasAccent: '45 90% 50%' },
  { key: 'alibi', label: 'Alibi', icon: Search, accent: '40 75% 50%', christmasAccent: '142 70% 45%' },
];

export const DailyProgressTracker = () => {
  const [progress, setProgress] = useState<DailyProgress>(() => checkDailyProgress());
  const christmas = isChristmas();
  
  // Refresh progress when component mounts or becomes visible
  useEffect(() => {
    const refreshProgress = () => {
      setProgress(checkDailyProgress());
    };
    
    // Initial check
    refreshProgress();
    
    // Check on visibility change (user returns to tab)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshProgress();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibility);
    
    // Also refresh on focus
    window.addEventListener('focus', refreshProgress);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', refreshProgress);
    };
  }, []);
  
  const completed = getCompletionCount(progress);
  const total = getTotalGames();
  const percentage = (completed / total) * 100;
  
  return (
    <div 
      className="mt-6 rounded-xl p-4 md:p-5 max-w-[640px] mx-auto"
      style={{ 
        background: 'hsl(var(--home-card-bg))',
        border: christmas ? '1px solid hsl(0 75% 50% / 0.3)' : '1px solid hsl(var(--home-card-border))',
        boxShadow: christmas 
          ? '0 4px 12px rgba(0, 0, 0, 0.04), 0 0 16px hsl(142 70% 45% / 0.08)'
          : '0 4px 12px rgba(0, 0, 0, 0.04)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 
          className="font-semibold text-base"
          style={{ color: 'hsl(var(--home-text-primary))' }}
        >
          Today's Progress
        </h3>
        <span 
          className="text-sm font-medium"
          style={{ 
            color: completed === total 
              ? (christmas ? 'hsl(142 70% 45%)' : 'hsl(142 76% 40%)') 
              : 'hsl(var(--home-text-muted))'
          }}
        >
          {completed}/{total}
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-4">
        <Progress 
          value={percentage} 
          className="h-2"
          style={{
            background: 'hsl(var(--home-divider))',
          }}
        />
      </div>
      
      {/* Game Checkboxes */}
      <div className="space-y-2">
        {games.map((game) => {
          const isComplete = progress[game.key];
          const Icon = game.icon;
          const accent = christmas ? game.christmasAccent : game.accent;
          
          return (
            <div 
              key={game.key}
              className="flex items-center gap-3 py-1.5"
            >
              {/* Checkbox */}
              <div 
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isComplete ? 'scale-100' : 'scale-95'
                }`}
                style={{
                  background: isComplete ? `hsl(${accent})` : 'transparent',
                  border: isComplete ? 'none' : '2px solid hsl(var(--home-divider))',
                }}
              >
                {isComplete ? (
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                ) : (
                  <Circle className="w-3 h-3 opacity-0" />
                )}
              </div>
              
              {/* Icon */}
              <Icon 
                className="w-4 h-4"
                style={{ 
                  color: isComplete 
                    ? `hsl(${accent})` 
                    : 'hsl(var(--home-text-muted))',
                  opacity: isComplete ? 1 : 0.5
                }}
              />
              
              {/* Label */}
              <span 
                className={`text-sm transition-all duration-300 ${
                  isComplete ? 'line-through' : ''
                }`}
                style={{ 
                  color: isComplete 
                    ? 'hsl(var(--home-text-muted))' 
                    : 'hsl(var(--home-text-secondary))'
                }}
              >
                {game.label}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Completion Message */}
      {completed === total && (
        <div 
          className="mt-4 pt-3 text-center text-sm font-medium animate-fade-in"
          style={{ 
            borderTop: '1px solid hsl(var(--home-divider))',
            color: christmas ? 'hsl(0 75% 50%)' : 'hsl(142 76% 40%)'
          }}
        >
          {christmas ? '🎄 All puzzles complete! Happy holidays!' : '🎉 All puzzles complete!'}
        </div>
      )}
    </div>
  );
};
