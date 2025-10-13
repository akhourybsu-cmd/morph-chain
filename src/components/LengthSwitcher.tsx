import { Check, X, Circle } from "lucide-react";

interface LengthSwitcherProps {
  selectedLength: 4 | 5 | 6;
  onLengthChange: (length: 4 | 5 | 6) => void;
  statuses: {
    4: "empty" | "won" | "failed" | "in-progress";
    5: "empty" | "won" | "failed" | "in-progress";
    6: "empty" | "won" | "failed" | "in-progress";
  };
}

const difficultyConfig = {
  4: { dots: 1, label: "Standard", shortLabel: "Standard", minimal: "4L" },
  5: { dots: 2, label: "Advanced", shortLabel: "Adv.", minimal: "5L" },
  6: { dots: 3, label: "Expert", shortLabel: "Expert", minimal: "6L" },
} as const;

export const LengthSwitcher = ({ selectedLength, onLengthChange, statuses }: LengthSwitcherProps) => {
  const getStatusIcon = (status: "empty" | "won" | "failed" | "in-progress") => {
    switch (status) {
      case "won":
        return <Check className="h-3 w-3 text-success" />;
      case "failed":
        return <X className="h-3 w-3 text-destructive" />;
      case "in-progress":
        return <Circle className="h-3 w-3 text-warning fill-current" />;
      default:
        return null;
    }
  };

  const getDifficultyDots = (count: number, isSelected: boolean) => {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={`w-1 h-1 rounded-full transition-colors ${
              isSelected ? "bg-background" : "bg-primary/40"
            }`}
          />
        ))}
      </div>
    );
  };

  const lengths: Array<4 | 5 | 6> = [4, 5, 6];

  return (
    <div 
      role="tablist"
      className="flex items-center justify-center gap-1.5 p-1 bg-card/50 rounded-xl border border-border max-w-[360px] mx-auto"
    >
      {lengths.map((length) => {
        const config = difficultyConfig[length];
        const isSelected = selectedLength === length;
        
        return (
          <button
            key={length}
            role="tab"
            aria-selected={isSelected}
            aria-label={`${length} letters - ${config.label} difficulty`}
            onClick={() => onLengthChange(length)}
            className={`
              relative flex-1 min-w-[88px] px-3 py-2 rounded-xl font-semibold text-sm
              transition-all duration-200 ease-in-out
              ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:scale-102"
              }
            `}
          >
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5">
                {getDifficultyDots(config.dots, isSelected)}
                <span className="hidden xs:inline">{length}L</span>
                <span className="inline xs:hidden">{config.minimal}</span>
              </div>
              
              {/* Label visibility based on screen size */}
              <span className="hidden sm:inline text-[10px] font-medium opacity-90">
                {config.label}
              </span>
              <span className="hidden xs:inline sm:hidden text-[10px] font-medium opacity-90">
                {config.shortLabel}
              </span>
            </div>

            {statuses[length] !== "empty" && (
              <span className="absolute -top-1 -right-1">
                {getStatusIcon(statuses[length])}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
