import { Tile } from '@/lib/grid/gridGenerator';
import { cn } from '@/lib/utils';

interface GridTileProps {
  tile: Tile;
  isSelected: boolean;
  selectionIndex?: number;
  onClick: () => void;
  animationClass?: string;
  isUpgrading?: boolean;
}

export const GridTile = ({ tile, isSelected, selectionIndex, onClick, animationClass, isUpgrading }: GridTileProps) => {
  // Calculate progress ring fill percentage
  const progressPercent = tile.progress === 0 ? 33 : tile.progress === 1 ? 66 : 100;
  
  // Text colors by progress
  const textColor = tile.progress === 0 
    ? "text-[#3C2A00]" 
    : tile.progress === 1 
      ? "text-[#001730]" 
      : "text-white";
  
  // Glow shadow by progress
  const glowShadow = tile.progress === 0
    ? "shadow-[0_0_12px_hsl(var(--grid-orange-glow)/0.6)]"
    : tile.progress === 1
      ? "shadow-[0_0_12px_hsl(var(--grid-blue-glow)/0.55)]"
      : "shadow-[0_0_12px_hsl(var(--grid-purple-glow)/0.5)]";
  
  return (
    <button
      onClick={onClick}
      data-tile-id={tile.id}
      className={cn(
        "grid-tile relative w-full aspect-square rounded-2xl font-outfit font-bold",
        "flex items-center justify-center touch-manipulation will-change-transform",
        "text-xl md:text-2xl transition-all duration-150",
        
        // Progress-based gradient backgrounds
        tile.progress === 0
          ? "bg-gradient-grid-orange"
          : tile.progress === 1
            ? "bg-gradient-grid-blue"
            : "bg-gradient-grid-purple",
        
        // Glow shadows
        glowShadow,
        
        // Animation class for word submission feedback
        animationClass,
        
        // Upgrade pulse-glow animation
        isUpgrading && "animate-tile-upgrade",
        
        // Selected state - enhanced with scale and bright white outline
        isSelected && "scale-105 shadow-[0_0_24px_rgba(255,255,255,0.8)] ring-2 ring-white/70 z-10",
        
        // Breathing animation for Blue tiles (only when not animating)
        tile.progress === 1 && !isSelected && !animationClass && !isUpgrading && "animate-breathe",
        
        // Hover/Active states (only when not selected)
        !isSelected && "hover:scale-102 hover:brightness-110 active:scale-95",
        
        // Text color
        textColor
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
      
      
      {/* Shimmer effect for Purple tiles */}
      {tile.progress === 2 && !isSelected && (
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute inset-0 animate-shimmer" />
        </div>
      )}
      
      
      {/* Letter with drop shadow */}
      <span 
        className={cn(
          "relative z-10 uppercase tracking-wide select-none",
          "drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
        )}
      >
        {tile.char}
      </span>
      
      {/* Selection number badge */}
      {isSelected && selectionIndex !== undefined && (
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white text-black text-xs flex items-center justify-center font-bold shadow-lg border-2 border-white/90 z-20">
          {selectionIndex + 1}
        </div>
      )}
      
    </button>
  );
};
