import { useClashStore, type Ownership } from '@/stores/clashStore';
import { cn } from '@/lib/utils';

interface ClashBoardProps {
  isMyTurn: boolean;
}

export const ClashBoard = ({ isMyTurn }: ClashBoardProps) => {
  const { match, selected, userId, selectTile } = useClashStore();

  if (!match) return null;

  const grid = match.grid_state;
  const ownership = match.ownership;
  const isPlayerA = userId === match.player_a;

  const getOwnershipColor = (tileId: string): string => {
    const owner = ownership[tileId] as Ownership;
    switch (owner) {
      case 'a':
        return isPlayerA ? 'hsl(var(--clash-player-mine))' : 'hsl(var(--clash-player-opponent))';
      case 'b':
        return isPlayerA ? 'hsl(var(--clash-player-opponent))' : 'hsl(var(--clash-player-mine))';
      case 'contested':
        return 'hsl(var(--clash-contested))';
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
      case 'contested':
        return 'hsl(var(--clash-contested) / 0.5)';
      default:
        return 'hsl(var(--clash-card-border))';
    }
  };

  const handleTileClick = (row: number, col: number) => {
    if (!isMyTurn) return;
    selectTile(row, col);
  };

  const selectedWord = selected.map(s => grid[s.row][s.col].char).join('');

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Word preview */}
      <div className="h-8 flex items-center justify-center">
        {selected.length > 0 && (
          <span
            className="font-mono text-xl font-bold tracking-widest uppercase"
            style={{ color: selected.length >= 4 ? 'hsl(var(--clash-accent))' : 'hsl(var(--clash-text-muted))' }}
          >
            {selectedWord}
          </span>
        )}
      </div>

      {/* Grid */}
      <div
        className="grid gap-1.5"
        style={{
          gridTemplateColumns: `repeat(5, var(--clash-tile-size, 60px))`,
          gridTemplateRows: `repeat(5, var(--clash-tile-size, 60px))`,
        }}
      >
        {grid.map((row, r) =>
          row.map((tile, c) => {
            const isSelected = selected.some(s => s.row === r && s.col === c);
            const selIndex = selected.findIndex(s => s.row === r && s.col === c);

            return (
              <button
                key={tile.id}
                onClick={() => handleTileClick(r, c)}
                disabled={!isMyTurn}
                className={cn(
                  "relative rounded-xl font-inter font-bold text-xl flex items-center justify-center",
                  "transition-all duration-150 touch-manipulation",
                  "shadow-[0_2px_4px_rgba(0,0,0,0.06)]",
                  isSelected && "ring-2 ring-[hsl(var(--clash-accent))] z-10 scale-105",
                  !isSelected && isMyTurn && "hover:-translate-y-px hover:shadow-md active:scale-95",
                  !isMyTurn && "opacity-90 cursor-default"
                )}
                style={{
                  width: 'var(--clash-tile-size, 60px)',
                  height: 'var(--clash-tile-size, 60px)',
                  background: getOwnershipColor(tile.id),
                  border: `2px solid ${getOwnershipBorderColor(tile.id)}`,
                  color: 'hsl(var(--clash-tile-letter))',
                  letterSpacing: '0.05em',
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
