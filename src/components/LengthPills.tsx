import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LengthPillsProps {
  selectedLength: 4 | 5 | 6;
  onLengthChange: (length: 4 | 5 | 6) => void;
  statuses: {
    4: "empty" | "won" | "failed" | "in-progress";
    5: "empty" | "won" | "failed" | "in-progress";
    6: "empty" | "won" | "failed" | "in-progress";
  };
}

const getRuleBadge = (length: 4 | 5 | 6) => {
  switch (length) {
    case 4:
      return { label: "Δ=1", tooltip: "Change exactly 1 letter per move" };
    case 5:
      return { label: "1st Δ≤2", tooltip: "First move: up to 2 letters, then 1 letter per move" };
    case 6:
      return { label: "Δ≤2", tooltip: "Change up to 2 letters per move" };
  }
};

export const LengthPills = ({ selectedLength, onLengthChange, statuses }: LengthPillsProps) => {
  const lengths: Array<4 | 5 | 6> = [4, 5, 6];

  return (
    <TooltipProvider>
      <div className="flex items-center justify-center gap-2 py-3">
        {lengths.map((length) => {
          const badge = getRuleBadge(length);
          const isSelected = selectedLength === length;
          const status = statuses[length];
          
          return (
            <Tooltip key={length}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onLengthChange(length)}
                  className={`
                    relative flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                    transition-all duration-200
                    ${isSelected 
                      ? 'bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/50' 
                      : 'bg-card hover:bg-muted/50 text-foreground'
                    }
                    ${status === 'won' ? 'ring-2 ring-success/50' : ''}
                    ${status === 'failed' ? 'ring-2 ring-destructive/50' : ''}
                  `}
                >
                  <span className="font-bold">{length}L</span>
                  <Badge 
                    variant="secondary" 
                    className="text-xs px-1.5 py-0 h-5 bg-background/50"
                  >
                    {badge.label}
                  </Badge>
                  {status !== 'empty' && (
                    <div className={`
                      absolute -top-1 -right-1 h-3 w-3 rounded-full
                      ${status === 'won' ? 'bg-success' : ''}
                      ${status === 'failed' ? 'bg-destructive' : ''}
                      ${status === 'in-progress' ? 'bg-warning' : ''}
                    `} />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{badge.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};
