import { TileColor, TileMeta } from "@/lib/chromawordLogic";
import { cn } from "@/lib/utils";

interface ChromaTileProps {
  letter: string;
  color?: TileColor;
  meta?: TileMeta;
  state?: 'empty' | 'filled' | 'submitted';
  showSymbol?: boolean;
}

export const ChromaTile = ({ letter, color, meta, state = 'empty', showSymbol = false }: ChromaTileProps) => {
  const getSymbol = () => {
    if (!meta || !showSymbol) return null;
    if (meta.posMatch) return '✓';
    if (meta.present) return '◎';
    return '✗';
  };

  return (
    <div
      className={cn(
        "w-14 h-14 sm:w-16 sm:h-16 border-2 rounded-lg flex items-center justify-center relative transition-all",
        state === 'empty' && "border-border bg-card",
        state === 'filled' && "border-primary bg-card",
        state === 'submitted' && "border-transparent shadow-lg"
      )}
      style={
        state === 'submitted' && color
          ? { backgroundColor: color.hex }
          : undefined
      }
    >
      <span
        className={cn(
          "text-2xl font-bold",
          state === 'submitted' ? "text-white drop-shadow-lg" : "text-foreground"
        )}
      >
        {letter}
      </span>
      {showSymbol && getSymbol() && (
        <span className="absolute top-1 right-1 text-xs text-white opacity-80">
          {getSymbol()}
        </span>
      )}
    </div>
  );
};
