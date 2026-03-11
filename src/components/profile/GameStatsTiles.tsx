import { useState } from 'react';
import { StatsModal } from '@/components/StatsModal';
import { GridStatsModal } from '@/components/grid/GridStats';
import { loadStats } from '@/lib/storage';

type GameType = 'chain' | 'grid' | null;

export function GameStatsTiles() {
  const [openModal, setOpenModal] = useState<GameType>(null);
  const chainStats = loadStats();

  const games = [
    { id: 'chain' as const, name: 'Chain', accent: 'hsl(var(--chain-accent, 200 80% 50%))' },
    { id: 'grid' as const, name: 'Grid', accent: 'hsl(var(--grid-accent, 150 80% 45%))' },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => setOpenModal(game.id)}
            className="rounded-xl p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'hsl(var(--home-page-bg))',
              border: '1px solid hsl(var(--home-divider))',
            }}
          >
            <span
              className="font-playfair font-semibold text-base"
              style={{ letterSpacing: '-0.01em' }}
            >
              <span style={{ color: 'hsl(var(--home-text-primary))' }}>Morph</span>
              {' '}
              <span style={{ color: game.accent }}>{game.name}</span>
            </span>
            <p 
              className="text-xs mt-1"
              style={{ color: 'hsl(var(--home-text-muted))' }}
            >
              View stats
            </p>
          </button>
        ))}
      </div>

      {/* Chain Stats Modal */}
      <StatsModal
        open={openModal === 'chain'}
        onOpenChange={(open) => setOpenModal(open ? 'chain' : null)}
        stats={chainStats}
      />

    </>
  );
}
