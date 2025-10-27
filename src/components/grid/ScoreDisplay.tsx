import { useGridStore } from '@/stores/gridStore';

interface ScoreDisplayProps {
  compact?: boolean;
}

export const ScoreDisplay = ({ compact = false }: ScoreDisplayProps) => {
  const totalScore = useGridStore(state => state.totalScore);
  const wordsCount = useGridStore(state => state.submittedWords.length);
  
  if (compact) {
    return (
      <div className="flex items-center gap-3 text-xs sm:text-sm font-medium">
        <span className="text-primary font-bold">{totalScore} pts</span>
        <span className="text-muted-foreground">•</span>
        <span className="text-foreground">{wordsCount} words</span>
      </div>
    );
  }
  
  return (
    <div className="flex justify-around items-center py-3 sm:py-4 px-4 sm:px-6 bg-card/50 rounded-lg border border-border/50">
      <div className="text-center">
        <div className="text-3xl sm:text-4xl font-outfit font-bold text-primary">
          {totalScore}
        </div>
        <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Score</div>
      </div>
      
      <div className="w-px h-10 sm:h-12 bg-border" />
      
      <div className="text-center">
        <div className="text-3xl sm:text-4xl font-outfit font-bold text-foreground">
          {wordsCount}
        </div>
        <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">Words</div>
      </div>
    </div>
  );
};
