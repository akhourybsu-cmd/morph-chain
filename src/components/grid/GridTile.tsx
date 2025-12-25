import { Tile } from '@/lib/grid/gridGenerator';
import { cn } from '@/lib/utils';
import { isChristmas } from '@/lib/seasonal/christmas';

interface GridTileProps {
  tile: Tile;
  isSelected: boolean;
  selectionIndex?: number;
  onClick: () => void;
  animationClass?: string;
  isUpgrading?: boolean;
}

export const GridTile = ({ tile, isSelected, selectionIndex, onClick, animationClass, isUpgrading }: GridTileProps) => {
  const christmas = isChristmas();
  
  // NYT Prestige: Flat tile backgrounds by progress
  // Christmas: Red → Green → Gold
  const tileBackground = christmas
    ? tile.progress === 0 
      ? "bg-[hsl(0,75%,50%)]"  // Christmas Red
      : tile.progress === 1 
        ? "bg-[hsl(142,70%,45%)]"  // Christmas Green
        : "bg-[hsl(45,90%,50%)]"  // Christmas Gold
    : tile.progress === 0 
      ? "bg-[hsl(var(--grid-tier1))]" 
      : tile.progress === 1 
        ? "bg-[hsl(var(--grid-tier2))]" 
        : "bg-[hsl(var(--grid-tier3))]";
  
  return (
    <button
      onClick={onClick}
      data-tile-id={tile.id}
      className={cn(
        "grid-tile relative w-full aspect-square rounded-xl font-inter font-bold",
        "flex items-center justify-center touch-manipulation will-change-transform",
        "text-xl md:text-2xl transition-all duration-150",
        
        // NYT Prestige flat tile backgrounds
        tileBackground,
        
        // Subtle shadow
        "shadow-[0_2px_4px_rgba(0,0,0,0.06)]",
        
        // Animation class for word submission feedback
        animationClass,
        
        // Upgrade flip animation
        isUpgrading && "animate-tile-flip",
        
        // NYT Prestige selected state - teal border, no neon
        isSelected && "ring-2 ring-[hsl(var(--grid-accent))] shadow-[0_0_0_1px_rgba(47,109,128,0.25)] z-10",
        
        // Hover/Active states (only when not selected)
        !isSelected && "hover:-translate-y-px hover:shadow-[0_3px_8px_rgba(0,0,0,0.08)] active:scale-95",
        
        // Text color - dark for light mode, light for dark mode
        "text-[hsl(var(--grid-tile-letter))]"
      )}
      style={{
        width: 'var(--tile-size, 64px)',
        height: 'var(--tile-size, 64px)',
        letterSpacing: '0.05em'
      }}
    >
      {/* Letter */}
      <span className="relative z-10 uppercase select-none">
        {tile.char}
      </span>
      
      {/* Selection number badge - NYT style */}
      {isSelected && selectionIndex !== undefined && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[hsl(var(--grid-accent))] text-white text-[10px] flex items-center justify-center font-semibold shadow-sm z-20">
          {selectionIndex + 1}
        </div>
      )}
    </button>
  );
};
