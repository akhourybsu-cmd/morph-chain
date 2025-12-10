import { useGridStore } from '@/stores/gridStore';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

export const WordPreview = () => {
  const selected = useGridStore(state => state.selected);
  const word = selected.map(t => t.char).join('').toUpperCase();
  const isValid = selected.length >= 4;
  
  return (
    <div className="flex items-center justify-center py-2 min-h-[3rem]">
      {selected.length > 0 ? (
        <div 
          className={cn(
            "px-4 py-2 rounded-full font-inter font-semibold text-base tracking-wide transition-all duration-150",
            "bg-[hsl(var(--grid-pill-bg))]",
            isValid 
              ? "text-[hsl(var(--grid-accent))]" 
              : "text-[hsl(var(--grid-text-secondary))]"
          )}
        >
          <span className="flex items-center gap-2">
            {word}
            {isValid && (
              <Check className="w-4 h-4 text-[hsl(var(--grid-success))]" />
            )}
            <span className="text-xs text-[hsl(var(--grid-text-muted))]">
              ({selected.length})
            </span>
          </span>
        </div>
      ) : (
        <div className="text-[hsl(var(--grid-text-muted))] text-sm font-inter">
          Drag to form words
        </div>
      )}
    </div>
  );
};
