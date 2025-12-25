import { useEffect, useState } from 'react';
import { isChristmas } from '@/lib/seasonal/christmas';
import { playJingleChime } from '@/lib/seasonal/christmasAudio';

interface Snowflake {
  id: number;
  left: number;
  animationDuration: number;
  animationDelay: number;
  size: number;
  opacity: number;
}

export const SnowfallOverlay = () => {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
  const [hasPlayedChime, setHasPlayedChime] = useState(false);

  useEffect(() => {
    if (!isChristmas()) return;

    // Generate snowflakes
    const flakes: Snowflake[] = [];
    for (let i = 0; i < 50; i++) {
      flakes.push({
        id: i,
        left: Math.random() * 100,
        animationDuration: 3 + Math.random() * 4,
        animationDelay: Math.random() * 5,
        size: 4 + Math.random() * 8,
        opacity: 0.4 + Math.random() * 0.6,
      });
    }
    setSnowflakes(flakes);

    // Play jingle on first interaction
    const handleFirstInteraction = () => {
      if (!hasPlayedChime) {
        playJingleChime();
        setHasPlayedChime(true);
        window.removeEventListener('click', handleFirstInteraction);
        window.removeEventListener('touchstart', handleFirstInteraction);
      }
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [hasPlayedChime]);

  if (!isChristmas() || snowflakes.length === 0) return null;

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      aria-hidden="true"
    >
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute animate-snowfall"
          style={{
            left: `${flake.left}%`,
            width: flake.size,
            height: flake.size,
            opacity: flake.opacity,
            animationDuration: `${flake.animationDuration}s`,
            animationDelay: `${flake.animationDelay}s`,
            background: 'radial-gradient(circle, white 0%, transparent 70%)',
            borderRadius: '50%',
            boxShadow: '0 0 4px rgba(255,255,255,0.8)',
          }}
        />
      ))}
    </div>
  );
};
