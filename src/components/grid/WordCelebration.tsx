import { useEffect, useState } from 'react';
import { useGridStore } from '@/stores/gridStore';
import { cn } from '@/lib/utils';

type Phase = 'pop' | 'done';

export const WordCelebration = () => {
  const { lastSubmission, clearLastSubmission, setHighlightTrackerLength } = useGridStore();
  const [phase, setPhase] = useState<Phase>('done');
  const [wordLength, setWordLength] = useState(0);
  const [upgradedCount, setUpgradedCount] = useState(0);

  useEffect(() => {
    if (lastSubmission) {
      setWordLength(lastSubmission.wordLength);
      setUpgradedCount(lastSubmission.upgradedTileIds.length);
      setPhase('pop');

      // Quick celebration then done
      const doneTimer = setTimeout(() => {
        setPhase('done');
        setHighlightTrackerLength(lastSubmission.wordLength);
        clearLastSubmission();
      }, 600);

      // Clear tracker highlight after pulse
      const clearHighlightTimer = setTimeout(() => {
        setHighlightTrackerLength(null);
      }, 1100);

      return () => {
        clearTimeout(doneTimer);
        clearTimeout(clearHighlightTimer);
      };
    }
  }, [lastSubmission, clearLastSubmission, setHighlightTrackerLength]);

  if (phase === 'done') return null;

  // NYT Prestige: subtle, elegant celebration
  const getIntensityStyles = () => {
    if (wordLength >= 6) return {
      size: 'text-3xl md:text-4xl',
    };
    if (wordLength >= 5) return {
      size: 'text-2xl md:text-3xl',
    };
    return {
      size: 'text-xl md:text-2xl',
    };
  };

  const intensity = getIntensityStyles();

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      {/* Main score display - NYT style: clean, elegant */}
      {phase === 'pop' && (
        <div
          className={cn(
            "flex flex-col items-center gap-2 font-inter font-bold text-[hsl(var(--grid-accent))] animate-score-pop-subtle",
            intensity.size
          )}
        >
          {/* Score text */}
          <span className="relative">
            +{wordLength}
          </span>

          {/* Cascade bonus badge - subtle */}
          {upgradedCount > 0 && (
            <div className="text-sm font-semibold text-[hsl(var(--grid-success))] animate-fade-in">
              +{upgradedCount} tile{upgradedCount > 1 ? 's' : ''} upgraded
            </div>
          )}
        </div>
      )}
    </div>
  );
};
