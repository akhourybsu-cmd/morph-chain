import { useGridStore } from '@/stores/gridStore';
import { Progress } from '@/components/ui/progress';

interface ScoreDisplayProps {
  compact?: boolean;
}

export const ScoreDisplay = ({ compact = false }: ScoreDisplayProps) => {
  const moves = useGridStore(state => state.moves);
  const purpleCount = useGridStore(state => state.purpleCount);
  const dailySeed = useGridStore(state => state.dailySeed);
  
  const progressPercent = (purpleCount / 25) * 100;
  
  if (compact) {
    return (
      <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm font-medium">
        <span className="text-primary font-bold">Moves: {moves}</span>
        <span className="text-muted-foreground">•</span>
        <span className="text-foreground">Purple: {purpleCount}/25</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-3 py-3 md:py-4 px-4 md:px-6 bg-card/50 rounded-lg border border-border/50">
      <div className="flex justify-around items-center">
        <div className="text-center">
          <div className="text-3xl md:text-4xl font-outfit font-bold text-primary">
            {moves}
          </div>
          <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">Moves</div>
        </div>
        
        <div className="w-px h-10 md:h-12 bg-border" />
        
        <div className="text-center">
          <div className="text-3xl md:text-4xl font-outfit font-bold text-foreground">
            {purpleCount}<span className="text-xl text-muted-foreground">/25</span>
          </div>
          <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1">Purple</div>
        </div>
      </div>
      
      <div className="space-y-1">
        <Progress value={progressPercent} className="h-2" />
        <div className="text-[10px] text-center text-muted-foreground">
          Daily #{dailySeed}
        </div>
      </div>
    </div>
  );
};
