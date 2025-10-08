import { Trophy, Zap } from "lucide-react";

interface RushScoreDisplayProps {
  score: number;
  multiplier: number;
  isActive: boolean;
}

export const RushScoreDisplay = ({ score, multiplier, isActive }: RushScoreDisplayProps) => {
  return (
    <div className="flex items-center gap-3 md:gap-4">
      {/* Score */}
      <div className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 bg-muted/30 rounded-lg">
        <Trophy className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
        <span className="text-sm md:text-base font-semibold tabular-nums">
          {score.toLocaleString()}
        </span>
      </div>
      
      {/* Multiplier */}
      <div className={`flex items-center gap-1.5 md:gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 ${
        multiplier > 1.0 && isActive
          ? "bg-primary/20 text-primary scale-110"
          : "bg-muted/30 text-muted-foreground"
      }`}>
        <Zap className="h-3.5 w-3.5 md:h-4 md:w-4" />
        <span className="text-sm md:text-base font-semibold tabular-nums">
          {multiplier.toFixed(1)}x
        </span>
      </div>
    </div>
  );
};
