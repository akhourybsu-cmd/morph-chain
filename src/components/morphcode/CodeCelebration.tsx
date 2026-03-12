import { useEffect, useState } from 'react';
import { SYMBOL_DISPLAY, Symbol } from '@/lib/morphcode/types';

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  speed: number;
  size: number;
  color: string;
  char: string;
  delay: number;
}

interface CodeCelebrationProps {
  symbols?: Symbol[];
}

export const CodeCelebration = ({ symbols }: CodeCelebrationProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const colors = symbols?.length
      ? symbols.map(s => SYMBOL_DISPLAY[s].color)
      : ['hsl(210, 80%, 60%)', 'hsl(45, 90%, 55%)', 'hsl(180, 70%, 50%)', 'hsl(15, 90%, 55%)', 'hsl(270, 60%, 60%)', 'hsl(330, 70%, 55%)'];
    
    const chars = symbols?.length
      ? symbols.map(s => SYMBOL_DISPLAY[s].emoji)
      : ['●', '▲', '∿', '✦', '◉', '◆'];

    const newParticles: Particle[] = [];
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 * i) / 24 + (Math.random() - 0.5) * 0.5;
      newParticles.push({
        id: i,
        x: 50 + (Math.random() - 0.5) * 10,
        y: 50 + (Math.random() - 0.5) * 10,
        angle,
        speed: 40 + Math.random() * 60,
        size: 12 + Math.random() * 12,
        color: colors[i % colors.length],
        char: chars[i % chars.length],
        delay: Math.random() * 200,
      });
    }
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <span
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: `${p.size}px`,
            color: p.color,
            animation: `celebrate-burst 1.2s ease-out ${p.delay}ms forwards`,
            '--burst-x': `${Math.cos(p.angle) * p.speed}vw`,
            '--burst-y': `${Math.sin(p.angle) * p.speed}vh`,
          } as React.CSSProperties}
        >
          {p.char}
        </span>
      ))}
      <style>{`
        @keyframes celebrate-burst {
          0% { transform: translate(0, 0) scale(0); opacity: 1; }
          30% { transform: translate(calc(var(--burst-x) * 0.5), calc(var(--burst-y) * 0.5)) scale(1.2); opacity: 1; }
          100% { transform: translate(var(--burst-x), var(--burst-y)) scale(0.3); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
