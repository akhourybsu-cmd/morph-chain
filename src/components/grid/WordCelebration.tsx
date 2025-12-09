import { useEffect, useState } from 'react';
import { useGridStore } from '@/stores/gridStore';
import { cn } from '@/lib/utils';

type Phase = 'pop' | 'travel' | 'done';

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

      // Phase 1 → Phase 2: Pop to Travel
      const travelTimer = setTimeout(() => {
        setPhase('travel');
      }, 600);

      // Phase 2 → Done: Travel complete, trigger tracker highlight
      const doneTimer = setTimeout(() => {
        setPhase('done');
        setHighlightTrackerLength(lastSubmission.wordLength);
        clearLastSubmission();
      }, 1100);

      // Clear tracker highlight after pulse
      const clearHighlightTimer = setTimeout(() => {
        setHighlightTrackerLength(null);
      }, 1600);

      return () => {
        clearTimeout(travelTimer);
        clearTimeout(doneTimer);
        clearTimeout(clearHighlightTimer);
      };
    }
  }, [lastSubmission, clearLastSubmission, setHighlightTrackerLength]);

  if (phase === 'done') return null;

  // Intensity based on word length
  const getIntensityStyles = () => {
    if (wordLength >= 7) return {
      size: 'text-5xl md:text-6xl',
      glow: 'drop-shadow-[0_0_30px_hsl(var(--chain)/0.9)]',
      ring: true,
      particles: true
    };
    if (wordLength >= 6) return {
      size: 'text-4xl md:text-5xl',
      glow: 'drop-shadow-[0_0_24px_hsl(var(--chain)/0.8)]',
      ring: true,
      particles: true
    };
    if (wordLength >= 5) return {
      size: 'text-3xl md:text-4xl',
      glow: 'drop-shadow-[0_0_18px_hsl(var(--chain)/0.7)]',
      ring: true,
      particles: false
    };
    if (wordLength >= 4) return {
      size: 'text-2xl md:text-3xl',
      glow: 'drop-shadow-[0_0_12px_hsl(var(--primary)/0.6)]',
      ring: false,
      particles: false
    };
    return {
      size: 'text-xl md:text-2xl',
      glow: 'drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)]',
      ring: false,
      particles: false
    };
  };

  const intensity = getIntensityStyles();

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      {/* Main score display */}
      <div
        className={cn(
          "flex flex-col items-center gap-2 font-outfit font-black text-white transition-all",
          intensity.size,
          intensity.glow,
          phase === 'pop' && "animate-score-pop",
          phase === 'travel' && "animate-score-travel"
        )}
      >
        {/* Ring effect for 5+ */}
        {intensity.ring && phase === 'pop' && (
          <div className="absolute w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-chain/40 animate-word-burst" />
        )}

        {/* Score text */}
        <span className="relative">
          +{wordLength}
          {wordLength >= 5 && (
            <span className="absolute -right-6 -top-1 text-lg">✨</span>
          )}
        </span>

        {/* Cascade bonus badge */}
        {upgradedCount > 0 && phase === 'pop' && (
          <div className="text-base md:text-lg font-bold text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)] animate-fade-in">
            🔥 +{upgradedCount} tile{upgradedCount > 1 ? 's' : ''} upgraded!
          </div>
        )}
      </div>

      {/* Particles for 6+ letter words */}
      {intensity.particles && phase === 'pop' && (
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-chain animate-confetti"
              style={{
                left: `${45 + Math.random() * 10}%`,
                top: `${45 + Math.random() * 10}%`,
                animationDelay: `${Math.random() * 0.3}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
