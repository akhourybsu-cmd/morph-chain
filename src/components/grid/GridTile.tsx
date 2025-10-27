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
      className={cn(
        "relative w-full aspect-square rounded-2xl font-outfit font-bold transition-all duration-200",
        "flex items-center justify-center touch-manipulation will-change-transform",
        "text-base xs:text-lg sm:text-xl",
        "shadow-[0_6px_18px_rgba(0,0,0,0.25)]",
        
        // Base gradient backgrounds with aura
        tile.isPower
          ? "bg-gradient-grid-power"
          : tile.isVowel 
            ? "bg-gradient-grid-vowel"
            : "bg-gradient-grid-consonant",
        
        // Stabilized state
        tile.stabilized && "ring-2 ring-neutral-300/80 brightness-90",
        
        // Selected state - enhanced glow
        isSelected && "scale-105 shadow-[0_0_28px_rgba(127,178,255,0.6)] ring-2 ring-white/80",
        
        // Hover/Active states
        !isSelected && "hover:scale-104 hover:brightness-110 active:scale-95"
      )}
      style={{
        minWidth: 'clamp(52px, 14vw, 72px)',
        minHeight: 'clamp(52px, 14vw, 72px)',
      }}
    >
      {/* Outer glow aura */}
      <div 
        className={cn(
          "absolute inset-0 rounded-2xl blur-xl opacity-40 pointer-events-none",
          tile.isPower && "bg-gradient-grid-power animate-pulse-glow",
          !tile.isPower && tile.isVowel && "bg-gradient-grid-vowel",
          !tile.isPower && !tile.isVowel && "bg-gradient-grid-consonant",
          isSelected && "opacity-60"
        )}
      />
      
      {/* Letter with drop shadow */}
      <span 
        className={cn(
          "relative z-10 uppercase tracking-wide select-none",
          "drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]",
          tile.isPower && "text-white",
          !tile.isPower && tile.isVowel && "text-cyan-50",
          !tile.isPower && !tile.isVowel && "text-amber-50"
        )}
      >
        {tile.char}
      </span>
      
      {/* Selection number badge */}
      {isSelected && selectionIndex !== undefined && (
        <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-primary-foreground text-[10px] sm:text-xs flex items-center justify-center font-bold shadow-lg border-2 border-background">
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
