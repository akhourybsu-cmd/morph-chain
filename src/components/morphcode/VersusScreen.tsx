import { useEffect, useState } from 'react';
import { Swords } from 'lucide-react';
import { playVersusHit } from '@/lib/morphcode/audioManager';

interface PlayerInfo {
  displayName: string;
  record: { wins: number; losses: number; draws: number };
}

interface VersusScreenProps {
  playerA: PlayerInfo;
  playerB: PlayerInfo;
  onComplete: () => void;
}

export const VersusScreen = ({ playerA, playerB, onComplete }: VersusScreenProps) => {
  const [stage, setStage] = useState<'enter' | 'show' | 'exit'>('enter');

  useEffect(() => {
    const t1 = setTimeout(() => { setStage('show'); playVersusHit(); }, 100);
    const t2 = setTimeout(() => setStage('exit'), 3000);
    const t3 = setTimeout(onComplete, 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center cursor-pointer"
      style={{ background: 'hsl(var(--code-page-bg))' }}
      onClick={onComplete}
    >
      <div className="flex items-center gap-4 md:gap-12 px-4 md:px-6 w-full max-w-lg">
        {/* Player A */}
        <div
          className="flex-1 text-center transition-all duration-700 ease-out"
          style={{
            transform: stage === 'enter' ? 'translateX(-60px)' : 'translateX(0)',
            opacity: stage === 'exit' ? 0 : stage === 'enter' ? 0 : 1,
          }}
        >
          <div
            className="w-12 h-12 md:w-16 md:h-16 rounded-full mx-auto mb-2 md:mb-3 flex items-center justify-center text-lg md:text-xl font-bold font-playfair"
            style={{
              background: 'hsl(var(--code-pill-bg))',
              color: 'hsl(var(--code-accent))',
              border: '2px solid hsl(var(--code-card-border))',
            }}
          >
            {playerA.displayName.charAt(0).toUpperCase()}
          </div>
          <p className="font-playfair text-xs md:text-sm font-semibold truncate" style={{ color: 'hsl(var(--code-text-primary))' }}>
            {playerA.displayName}
          </p>
          <p className="text-[10px] md:text-xs font-mono mt-0.5 md:mt-1" style={{ color: 'hsl(var(--code-text-muted))' }}>
            {playerA.record.wins}W – {playerA.record.losses}L – {playerA.record.draws}D
          </p>
        </div>

        {/* VS */}
        <div
          className="flex flex-col items-center transition-all duration-500 ease-out"
          style={{
            transform: stage === 'show' ? 'scale(1)' : 'scale(0.5)',
            opacity: stage === 'exit' ? 0 : stage === 'enter' ? 0 : 1,
          }}
        >
          <Swords className="w-6 h-6 md:w-8 md:h-8 mb-1" style={{ color: 'hsl(var(--code-accent))' }} />
          <span className="font-playfair text-xl md:text-2xl font-bold tracking-wider" style={{ color: 'hsl(var(--code-accent))' }}>
            VS
          </span>
        </div>

        {/* Player B */}
        <div
          className="flex-1 text-center transition-all duration-700 ease-out"
          style={{
            transform: stage === 'enter' ? 'translateX(60px)' : 'translateX(0)',
            opacity: stage === 'exit' ? 0 : stage === 'enter' ? 0 : 1,
          }}
        >
          <div
            className="w-12 h-12 md:w-16 md:h-16 rounded-full mx-auto mb-2 md:mb-3 flex items-center justify-center text-lg md:text-xl font-bold font-playfair"
            style={{
              background: 'hsl(var(--code-pill-bg))',
              color: 'hsl(var(--code-accent))',
              border: '2px solid hsl(var(--code-card-border))',
            }}
          >
            {playerB.displayName.charAt(0).toUpperCase()}
          </div>
          <p className="font-playfair text-xs md:text-sm font-semibold truncate" style={{ color: 'hsl(var(--code-text-primary))' }}>
            {playerB.displayName}
          </p>
          <p className="text-[10px] md:text-xs font-mono mt-0.5 md:mt-1" style={{ color: 'hsl(var(--code-text-muted))' }}>
            {playerB.record.wins}W – {playerB.record.losses}L – {playerB.record.draws}D
          </p>
        </div>
      </div>

      <p
        className="absolute bottom-8 text-[10px] md:text-xs font-inter animate-pulse"
        style={{ color: 'hsl(var(--code-text-muted))' }}
      >
        Tap to skip
      </p>
    </div>
  );
};
