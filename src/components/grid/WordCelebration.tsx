import { useEffect, useState } from 'react';
import { useGridStore } from '@/stores/gridStore';

type Phase = 'pop' | 'done';

export const WordCelebration = () => {
  const { lastSubmission, clearLastSubmission, setHighlightTrackerLength } = useGridStore();
  const [phase, setPhase] = useState<Phase>('done');
  const [word, setWord] = useState('');
  const [wordScore, setWordScore] = useState(0);
  const [upgradedCount, setUpgradedCount] = useState(0);

  useEffect(() => {
    if (lastSubmission) {
      setWord(lastSubmission.word ?? '');
      setWordScore(lastSubmission.wordScore ?? 0);
      setUpgradedCount(lastSubmission.upgradedTileIds.length);
      setPhase('pop');

      // Match the 900ms score-float animation duration
      const doneTimer = setTimeout(() => {
        setPhase('done');
        setHighlightTrackerLength(lastSubmission.wordLength);
        clearLastSubmission();
      }, 900);

      const clearHighlightTimer = setTimeout(() => {
        setHighlightTrackerLength(null);
      }, 1400);

      return () => {
        clearTimeout(doneTimer);
        clearTimeout(clearHighlightTimer);
      };
    }
  }, [lastSubmission, clearLastSubmission, setHighlightTrackerLength]);

  if (phase === 'done') return null;

  return (
    // absolute inset-0 scopes the popup to the page column (max-w-xl),
    // not the full viewport. The page container must have position:relative.
    <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-1 animate-score-float">
        {/* Word played */}
        <span className="text-2xl md:text-3xl font-inter font-bold tracking-widest text-[hsl(var(--grid-text-primary))] uppercase drop-shadow-sm">
          {word}
        </span>

        {/* Points earned */}
        <span className="text-lg md:text-xl font-inter font-semibold text-[hsl(var(--grid-accent))]">
          +{wordScore} pts
        </span>

        {/* Cascade upgrade bonus */}
        {upgradedCount > 0 && (
          <span className="text-sm font-medium text-[hsl(var(--grid-success))]">
            ✦ {upgradedCount} tile{upgradedCount > 1 ? 's' : ''} upgraded
          </span>
        )}
      </div>
    </div>
  );
};
