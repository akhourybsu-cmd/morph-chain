import { Check, X, Loader2 } from "lucide-react";

interface LengthPillsProps {
  selectedLength: 4 | 5;
  onLengthChange: (length: 4 | 5) => void;
  statuses: {
    4: "empty" | "won" | "failed" | "in-progress";
    5: "empty" | "won" | "failed" | "in-progress";
  };
}

export const LengthPills = ({ selectedLength, onLengthChange, statuses }: LengthPillsProps) => {
  const lengths: Array<4 | 5> = [4, 5];

  const getStatusIcon = (status: "empty" | "won" | "failed" | "in-progress") => {
    switch (status) {
      case "won":
        return <Check className="h-3.5 w-3.5 text-success" />;
      case "failed":
        return <X className="h-3.5 w-3.5 text-destructive" />;
      case "in-progress":
        return <Loader2 className="h-3.5 w-3.5 text-chain animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <div 
      role="tablist"
      className="flex items-center justify-center gap-0 p-1 bg-card border border-border rounded-full max-w-[340px] mx-auto"
    >
      {lengths.map((length) => {
        const isSelected = selectedLength === length;
        const status = statuses[length];
        const statusIcon = getStatusIcon(status);
        
        return (
          <button
            key={length}
            role="tab"
            aria-selected={isSelected}
            aria-label={`${length} letters${status === 'won' ? ' - completed' : status === 'failed' ? ' - failed' : status === 'in-progress' ? ' - in progress' : ''}`}
            onClick={() => onLengthChange(length)}
            className={`
              flex-1 min-h-[44px] px-6 py-2.5 rounded-full font-semibold text-base
              transition-all duration-200 ease-in-out flex items-center justify-center gap-2
              ${
                isSelected
                  ? "bg-chain text-chain-foreground"
                  : "bg-transparent text-muted-foreground hover:text-foreground"
              }
            `}
          >
            {length}L
            {statusIcon && (
              <span className="flex items-center">{statusIcon}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};
