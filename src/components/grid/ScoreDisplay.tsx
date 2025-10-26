import { useGridStore } from '@/stores/gridStore';

export const ScoreDisplay = () => {
  const totalScore = useGridStore(state => state.totalScore);
  const wordsCount = useGridStore(state => state.submittedWords.length);
  
  return (
    <div className="flex justify-around items-center py-4 px-6 bg-card/50 rounded-lg border border-border/50">
      <div className="text-center">
        <div className="text-4xl font-outfit font-bold text-primary">
          {totalScore}
        </div>
        <div className="text-xs text-muted-foreground mt-1">Score</div>
      </div>
      
      <div className="w-px h-12 bg-border" />
      
      <div className="text-center">
        <div className="text-4xl font-outfit font-bold text-foreground">
          {wordsCount}
        </div>
        <div className="text-xs text-muted-foreground mt-1">Words</div>
      </div>
    </div>
  );
};
