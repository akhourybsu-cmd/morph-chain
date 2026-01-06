import { cn } from '@/lib/utils';

interface TileBankProps {
  tiles: number[];
  usedTiles: Set<number>;
  onTileSelect: (tile: number, index: number) => void;
}

export function TileBank({ tiles, usedTiles, onTileSelect }: TileBankProps) {
  return (
    <div className="bg-measured-card border border-measured-card-border rounded-2xl p-4">
      <div className="grid grid-cols-5 gap-2">
        {tiles.map((tile, index) => {
          const isUsed = usedTiles.has(index);
          return (
            <button
              key={index}
              onClick={() => !isUsed && onTileSelect(tile, index)}
              disabled={isUsed}
              className={cn(
                "aspect-square rounded-xl border-2 flex items-center justify-center text-lg font-bold transition-all",
                isUsed
                  ? "bg-measured-tile-bg/30 border-measured-tile-border/30 text-measured-text-muted/30 cursor-not-allowed"
                  : "bg-measured-tile-bg border-measured-tile-border text-measured-text-primary hover:border-measured-accent hover:scale-105 active:scale-95"
              )}
            >
              {tile}
            </button>
          );
        })}
      </div>
    </div>
  );
}
