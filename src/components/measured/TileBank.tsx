import { cn } from '@/lib/utils';

interface TileBankProps {
  tiles: number[];
  usedTiles: Set<number>;
  onTileSelect: (tile: number, index: number) => void;
}

export function TileBank({ tiles, usedTiles, onTileSelect }: TileBankProps) {
  return (
    <div className="bg-measured-card border border-measured-card-border rounded-2xl p-4 md:p-5 shadow-sm">
      <div className="grid grid-cols-5 gap-2 md:gap-3">
        {tiles.map((tile, index) => {
          const isUsed = usedTiles.has(index);
          return (
            <button
              key={index}
              onClick={() => !isUsed && onTileSelect(tile, index)}
              disabled={isUsed}
              className={cn(
                "aspect-square min-h-[52px] md:min-h-14 rounded-xl border-2 flex items-center justify-center text-lg md:text-xl font-bold transition-all duration-150",
                isUsed
                  ? "bg-measured-tile-bg/20 border-measured-tile-border/20 text-measured-text-muted/20 cursor-not-allowed scale-95"
                  : "bg-measured-tile-bg border-measured-tile-border text-measured-text-primary hover:border-measured-accent hover:bg-measured-accent/5 active:scale-95 shadow-sm"
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
