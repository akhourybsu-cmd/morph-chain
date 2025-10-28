import { Tile } from '@/lib/grid/gridGenerator';
import { cn } from '@/lib/utils';

interface GridTileProps {
  tile: Tile;
  isSelected: boolean;
  selectionIndex?: number;
  onClick: () => void;
}

export const GridTile = ({ tile, isSelected, selectionIndex, onClick }: GridTileProps) => {
  return (
    <button
      onClick={onClick}
      data-tile-id={tile.id}
      className={cn(
        "grid-tile relative w-full aspect-square rounded-2xl font-outfit font-bold",
        "flex items-center justify-center touch-manipulation will-change-transform",
        "text-base md:text-lg transition-all duration-150",
        "shadow-[0_6px_18px_rgba(0,0,0,0.25)]",
        
        // Progress-based gradient backgrounds
        tile.progress === 0
          ? "bg-gradient-grid-orange"
          : tile.progress === 1
            ? "bg-gradient-grid-blue"
            : "bg-gradient-grid-purple",
        
        // Stabilized state
        tile.stabilized && "ring-2 ring-neutral-300/80 brightness-90",
        
        // Selected state - enhanced with scale and glow
        isSelected && "scale-108 shadow-[0_0_32px_rgba(127,178,255,0.7)] ring-2 ring-white/90 z-10",
        
        // Hover/Active states (only when not selected)
        !isSelected && "hover:scale-102 hover:brightness-110 active:scale-95"
      )}
      style={{
        width: 'var(--tile-size, 64px)',
        height: 'var(--tile-size, 64px)'
      }}
    >
      {/* Outer glow aura */}
      <div 
        className={cn(
          "absolute inset-0 rounded-2xl blur-xl opacity-40 pointer-events-none transition-opacity",
          tile.isPower && "animate-pulse-glow",
          tile.progress === 0 && "bg-gradient-grid-orange",
          tile.progress === 1 && "bg-gradient-grid-blue",
          tile.progress === 2 && "bg-gradient-grid-purple",
          isSelected && "opacity-60"
        )}
      />
      
      {/* Power star indicator */}
      {tile.isPower && !isSelected && (
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center text-[8px]">
          ⭐
        </div>
      )}
      
      {/* Letter with drop shadow */}
      <span 
        className="relative z-10 uppercase tracking-wide select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] text-white"
      >
        {tile.char}
      </span>
      
      {/* Selection number badge */}
      {isSelected && selectionIndex !== undefined && (
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold shadow-lg border-2 border-background z-20">
          {selectionIndex + 1}
        </div>
      )}
      
      {/* Stabilization indicator */}
      {tile.stabilized && !isSelected && (
        <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-neutral-400 border border-neutral-200" />
      )}
    </button>
  );
};
