import { useEffect, useState } from 'react';

interface FloatingScoreProps {
  score: number;
  id: number;
  onComplete: () => void;
}

export function FloatingScore({ score, id, onComplete }: FloatingScoreProps) {
  const [phase, setPhase] = useState<'appear' | 'slide' | 'done'>('appear');

  useEffect(() => {
    // Appear for 400ms, then slide
    const slideTimer = setTimeout(() => setPhase('slide'), 400);
    // Complete after slide animation (500ms)
    const completeTimer = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 900);
    
    return () => {
      clearTimeout(slideTimer);
      clearTimeout(completeTimer);
    };
  }, [id, onComplete]);

  if (phase === 'done') return null;

  return (
    <div 
      className={`
        absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2
        text-2xl font-bold tabular-nums pointer-events-none z-10
        ${phase === 'appear' ? 'animate-score-appear' : 'animate-score-slide'}
      `}
      style={{ color: 'hsl(var(--rush-accent))' }}
    >
      +{score}
    </div>
  );
}
