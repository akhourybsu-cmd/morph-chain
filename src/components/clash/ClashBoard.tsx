import { useClashStore, type Ownership } from '@/stores/clashStore';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

interface ClashBoardProps {
  isMyTurn: boolean;
}

export const ClashBoard = ({ isMyTurn }: ClashBoardProps) => {
  const { match, selected, userId, selectTile, lastMoveResult } = useClashStore();
  const [recentlyClaimed, setRecentlyClaimed] = useState<Set<string>>(new Set());

  // Animate recently claimed tiles
  useEffect(() => {
    if (lastMoveResult?.claimed && lastMoveResult.claimed.length > 0) {
      const allClaimed = new Set([
        ...lastMoveResult.claimed,
        ...(lastMoveResult.bonusClaims || []),
      ]);
      setRecentlyClaimed(allClaimed);
      const timer = setTimeout(() => setRecentlyClaimed(new Set()), 800);
      return () => clearTimeout(timer);
    }
  }, [lastMoveResult]);

  if (!match) return null;

  const grid = match.grid_state;
  const ownership = match.ownership;
  const isPlayerA = userId === match.player_a;
  const isWaiting = match.status === 'waiting';

  const getOwnershipColor = (tileId: string): string => {
    const owner = ownership[tileId] as Ownership;
    switch (owner) {
      case 'a':
        return isPlayerA ? 'hsl(var(--clash-player-mine))' : 'hsl(var(--clash-player-opponent))';
      case 'b':
        return isPlayerA ? 'hsl(var(--clash-player-opponent))' : 'hsl(var(--clash-player-mine))';
      default:
        return 'hsl(var(--clash-neutral))';
    }
  };

  const getOwnershipBorderColor = (tileId: string): string => {
    const owner = ownership[tileId] as Ownership;
    switch (owner) {
      case 'a':
        return isPlayerA ? 'hsl(var(--clash-player-mine) / 0.5)' : 'hsl(var(--clash-player-opponent) / 0.5)';
      case 'b':
        return isPlayerA ? 'hsl(var(--clash-player-opponent) / 0.5)' : 'hsl(var(--clash-player-mine) / 0.5)';
      default:
        return 'hsl(var(--clash-card-border))';
    }
  };

  const handleTileClick = (row: number, col: number) => {
    if (!isMyTurn || isWaiting) return;
    selectTile(row, col);
  };

  const selectedWord = selected.map(s => grid[s.row][s.col].char).join('');

  const showNotYourTurn = match.status === 'active' && !isMyTurn && !isWaiting;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Waiting banner */}
      {isWaiting && (
        <div
          className="w-full rounded-xl p-4 text-center space-y-2 animate-in fade-in-0"
          style={{
            background: 'hsl(var(--clash-card-bg))',
            border: '1px solid hsl(var(--clash-accent) / 0.3)',
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'hsl(var(--clash-accent))' }} />
            <span className="text-xs font-inter" style={{ color: 'hsl(var(--clash-text-secondary))' }}>
              Waiting for opponent to accept…
            </span>
          </div>
        </div>
      )}

      {/* Word preview */}
      <div className="h-8 flex items-center justify-center">
        {selected.length > 0 ? (
          <span
            className="font-mono text-xl font-bold tracking-widest uppercase"
            style={{ color: selected.length >= 4 ? 'hsl(var(--clash-accent))' : 'hsl(var(--clash-text-muted))' }}
          >
            {selectedWord}
          </span>
        ) : showNotYourTurn ? (
          <span
            className="text-xs font-inter uppercase tracking-widest"
            style={{ color: 'hsl(var(--clash-text-muted))' }}
          >
            Waiting for opponent's move…
          </span>
        ) : null}
      </div>

      {/* Grid */}
      <div
        className="grid gap-1.5 relative"
        style={{
          gridTemplateColumns: `repeat(5, var(--clash-tile-size, 60px))`,
          gridTemplateRows: `repeat(5, var(--clash-tile-size, 60px))`,
        }}
      >
        {grid.map((row, r) =>
          row.map((tile, c) => {
            const isSelected = selected.some(s => s.row === r && s.col === c);
            const selIndex = selected.findIndex(s => s.row === r && s.col === c);
            const interactive = isMyTurn && !isWaiting;
            const justClaimed = recentlyClaimed.has(tile.id);

            return (
              <button
                key={tile.id}
                onClick={() => handleTileClick(r, c)}
                disabled={!interactive}
                className={cn(
                  "relative rounded-xl font-inter font-bold text-xl flex items-center justify-center",
                  "transition-all duration-200 touch-manipulation",
                  "shadow-[0_2px_4px_rgba(0,0,0,0.06)]",
                  isSelected && "ring-2 ring-[hsl(var(--clash-accent))] z-10 scale-105",
                  !isSelected && interactive && "hover:-translate-y-px hover:shadow-md active:scale-95",
                  !interactive && "cursor-default",
                  justClaimed && "animate-pulse scale-110 z-10",
                )}
                style={{
                  width: 'var(--clash-tile-size, 60px)',
                  height: 'var(--clash-tile-size, 60px)',
                  background: getOwnershipColor(tile.id),
                  border: `2px solid ${getOwnershipBorderColor(tile.id)}`,
                  color: 'hsl(var(--clash-tile-letter))',
                  letterSpacing: '0.05em',
                  opacity: showNotYourTurn ? 0.75 : 1,
                }}
              >
                <span className="relative z-10 uppercase select-none">{tile.char}</span>
                {isSelected && selIndex >= 0 && (
                  <div
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center font-semibold shadow-sm z-20"
                    style={{ background: 'hsl(var(--clash-accent))' }}
                  >
                    {selIndex + 1}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
