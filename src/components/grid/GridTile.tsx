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
        "relative w-full aspect-square rounded-lg border-2 font-outfit font-bold text-2xl transition-all duration-200",
        "flex items-center justify-center",
        
        // Base colors
        tile.isVowel 
          ? "bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border-cyan-400/40"
          : "bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-400/40",
        
        // Power tile
        tile.isPower && "shadow-[0_0_20px_rgba(168,85,247,0.4)] border-purple-400/60",
        
        // Stabilized
        tile.stabilized && "ring-2 ring-gray-400/50",
        
        // Selected state
        isSelected && "scale-105 shadow-xl border-primary",
        isSelected && tile.isVowel && "bg-gradient-to-br from-cyan-400/40 to-teal-400/40",
        isSelected && !tile.isVowel && "bg-gradient-to-br from-amber-400/40 to-orange-400/40",
        
        // Hover
        !isSelected && "hover:scale-105 hover:shadow-lg active:scale-95"
      )}
    >
      {/* Power glow */}
      {tile.isPower && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20 animate-pulse" />
      )}
      
      {/* Letter */}
      <span className={cn(
        "relative z-10",
        tile.isPower && "text-purple-300",
        !tile.isPower && tile.isVowel && "text-cyan-200",
        !tile.isPower && !tile.isVowel && "text-amber-200"
      )}>
        {tile.char}
      </span>
      
      {/* Selection number */}
      {isSelected && selectionIndex !== undefined && (
        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">
          {selectionIndex + 1}
        </div>
      )}
      
      {/* Stabilization indicator */}
      {tile.stabilized && !isSelected && (
        <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-gray-400" />
      )}
    </button>
  );
};
