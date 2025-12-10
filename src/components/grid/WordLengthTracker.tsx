import { useMemo } from 'react';
import { SubmittedWord } from '@/lib/gridStorage';
import { useGridStore } from '@/stores/gridStore';
import { cn } from '@/lib/utils';

interface WordLengthTrackerProps {
  submittedWords: SubmittedWord[];
}

export const WordLengthTracker = ({ submittedWords }: WordLengthTrackerProps) => {
  const { highlightTrackerLength } = useGridStore();
  
  const lengthCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    
    for (const { word } of submittedWords) {
      const len = word.length;
      counts[len] = (counts[len] || 0) + 1;
    }
    
    return counts;
  }, [submittedWords]);

  // Get all lengths that have been used, sorted
  const usedLengths = Object.keys(lengthCounts)
    .map(Number)
    .sort((a, b) => a - b);

  if (submittedWords.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 text-xs font-inter text-[hsl(var(--grid-text-muted))]">
      <span>Words:</span>
      <div className="flex items-center gap-1.5">
        {usedLengths.map((len) => (
          <div
            key={len}
            className={cn(
              "px-2 py-0.5 rounded-md font-medium transition-all duration-300",
              len >= 5
                ? "bg-[hsl(var(--grid-accent)/0.1)] text-[hsl(var(--grid-accent))]"
                : "bg-[hsl(var(--grid-pill-bg))] text-[hsl(var(--grid-text-secondary))]",
              highlightTrackerLength === len && "scale-110 ring-1 ring-[hsl(var(--grid-accent))]"
            )}
          >
            {len}L
            <span className="ml-0.5 opacity-80">
              (<span className="font-semibold">{lengthCounts[len]}</span>)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
