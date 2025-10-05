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

  const lengths: Array<4 | 5 | 6> = [4, 5, 6];

  return (
    <div className="flex items-center justify-center gap-0.5 md:gap-1 p-0.5 md:p-1 bg-card/50 rounded-lg border border-border transition-all">
      {lengths.map((length) => (
        <button
          key={length}
          onClick={() => onLengthChange(length)}
          className={`
            relative px-3 py-1.5 md:px-4 md:py-2 rounded-md font-medium text-xs md:text-sm transition-all duration-200
            ${
              selectedLength === length
                ? "bg-primary text-primary-foreground shadow-sm scale-105"
                : "hover:bg-muted text-muted-foreground hover:scale-105"
            }
          `}
        >
          <div className="flex items-center gap-1 md:gap-1.5">
            <span>{length}L</span>
            {statuses[length] !== "empty" && (
              <span className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1">
                {getStatusIcon(statuses[length])}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};
