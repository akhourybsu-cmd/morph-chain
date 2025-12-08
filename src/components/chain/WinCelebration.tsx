import { useEffect, useState } from "react";

interface WinCelebrationProps {
  movesUsed: number;
  minDistance: number;
  isPersonalBest?: boolean;
  streak?: number;
}

interface Particle {
  id: number;
  emoji: string;
  left: number;
  delay: number;
  duration: number;
}

export const WinCelebration = ({ movesUsed, minDistance, isPersonalBest, streak }: WinCelebrationProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showGlow, setShowGlow] = useState(true);
  
  const isPerfect = movesUsed === minDistance;
  const isUnderPar = movesUsed < minDistance + 2;
  
  useEffect(() => {
    // Generate confetti particles
    const confettiEmojis = isPerfect 
      ? ['💎', '⭐', '✨', '🌟', '💫']
      : isUnderPar 
        ? ['⭐', '✨', '🎉', '🌟']
        : ['🎉', '✨', '🎊'];
    
    const newParticles: Particle[] = [];
    const count = isPerfect ? 20 : isUnderPar ? 15 : 10;
    
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        emoji: confettiEmojis[Math.floor(Math.random() * confettiEmojis.length)],
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1.5 + Math.random() * 1,
      });
    }
    
    setParticles(newParticles);
    
    // Remove glow after animation
    const timer = setTimeout(() => setShowGlow(false), 1500);
    return () => clearTimeout(timer);
  }, [isPerfect, isUnderPar]);
  
  return (
    <>
      {/* Screen glow overlay */}
      {showGlow && (
        <div 
          className={`
            fixed inset-0 pointer-events-none z-40
            transition-opacity duration-1000
            ${showGlow ? 'opacity-100' : 'opacity-0'}
          `}
          style={{
            background: isPerfect 
              ? 'radial-gradient(circle at center, hsl(var(--primary) / 0.3) 0%, transparent 70%)'
              : isUnderPar
                ? 'radial-gradient(circle at center, hsl(var(--primary) / 0.2) 0%, transparent 60%)'
                : 'radial-gradient(circle at center, hsl(var(--primary) / 0.15) 0%, transparent 50%)',
          }}
        />
      )}
      
      {/* Confetti particles */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute text-2xl animate-confetti-fall"
            style={{
              left: `${particle.left}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          >
            {particle.emoji}
          </div>
        ))}
      </div>
      
      {/* Personal best callout */}
      {isPersonalBest && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-scale-in">
          <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full font-bold text-sm shadow-lg">
            🏅 Personal Best!
          </div>
        </div>
      )}
      
      {/* Streak fire */}
      {streak && streak >= 3 && (
        <div className="fixed top-32 left-1/2 -translate-x-1/2 z-50 animate-scale-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-full shadow-lg">
            <span className="text-xl">🔥</span>
            <span className="font-bold text-foreground">{streak} Day Streak!</span>
          </div>
        </div>
      )}
    </>
  );
};
