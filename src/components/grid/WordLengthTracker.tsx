import { useMemo } from 'react';
import { SubmittedWord } from '@/lib/gridStorage';

interface WordLengthTrackerProps {
  submittedWords: SubmittedWord[];
}

export const WordLengthTracker = ({ submittedWords }: WordLengthTrackerProps) => {
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
    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
      <span className="opacity-70">Words:</span>
      <div className="flex items-center gap-1.5">
        {usedLengths.map((len) => (
          <div
            key={len}
            className={`px-1.5 py-0.5 rounded-md font-medium ${
              len >= 5
                ? "bg-chain/20 text-chain border border-chain/30"
                : "bg-muted/50 text-muted-foreground"
            }`}
          >
            {len}L
            <span className="ml-0.5 opacity-80">({lengthCounts[len]})</span>
          </div>
        ))}
      </div>
    </div>
  );
};
