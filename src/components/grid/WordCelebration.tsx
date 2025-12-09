import { useEffect, useState } from 'react';
import { useGridStore } from '@/stores/gridStore';
import { cn } from '@/lib/utils';

interface CelebrationState {
  wordLength: number;
  upgradedCount: number;
  show: boolean;
}

export const WordCelebration = () => {
  const { lastSubmission, clearLastSubmission } = useGridStore();
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);

  useEffect(() => {
    if (lastSubmission) {
      setCelebration({
        wordLength: lastSubmission.wordLength,
        upgradedCount: lastSubmission.upgradedTileIds.length,
        show: true
      });

      // Generate particles based on word length
      const particleCount = Math.min(lastSubmission.wordLength * 3, 20);
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: 40 + Math.random() * 20,
        y: 40 + Math.random() * 20,
        delay: Math.random() * 0.2
      }));
      setParticles(newParticles);

      // Clear after animation
      const timer = setTimeout(() => {
        setCelebration(null);
        setParticles([]);
        clearLastSubmission();
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [lastSubmission, clearLastSubmission]);

  if (!celebration?.show) return null;

  const { wordLength, upgradedCount } = celebration;

  // Determine intensity based on word length
  const getIntensityClass = () => {
    if (wordLength >= 7) return 'text-3xl font-black';
    if (wordLength >= 6) return 'text-2xl font-bold';
    if (wordLength >= 5) return 'text-xl font-bold';
    if (wordLength >= 4) return 'text-lg font-semibold';
    return 'text-base font-medium';
  };

  const getGlowIntensity = () => {
    if (wordLength >= 7) return 'drop-shadow-[0_0_20px_rgba(255,255,255,0.9)]';
    if (wordLength >= 6) return 'drop-shadow-[0_0_15px_rgba(255,255,255,0.7)]';
    if (wordLength >= 5) return 'drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]';
    return 'drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]';
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center overflow-hidden">
      {/* Burst ring effect for 5+ letter words */}
      {wordLength >= 5 && (
        <div 
          className="absolute w-32 h-32 rounded-full border-2 border-white/40 animate-word-burst"
          style={{ 
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)'
          }}
        />
      )}

      {/* Floating score */}
      <div 
        className={cn(
          "animate-float-score text-white",
          getIntensityClass(),
          getGlowIntensity()
        )}
      >
        +{wordLength}
      </div>

      {/* Cascade bonus badge */}
      {upgradedCount > 0 && (
        <div 
          className="absolute mt-12 animate-float-score text-sm font-bold text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]"
          style={{ animationDelay: '0.1s' }}
        >
          🔥 +{upgradedCount} tile{upgradedCount > 1 ? 's' : ''} upgraded!
        </div>
      )}

      {/* Particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-1.5 h-1.5 rounded-full bg-white animate-confetti"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
            opacity: wordLength >= 5 ? 1 : 0.6
          }}
        />
      ))}
    </div>
  );
};
