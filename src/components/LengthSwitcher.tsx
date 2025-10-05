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
    <div className="flex items-center justify-center gap-1 p-1 bg-card/50 rounded-lg border border-border">
      {lengths.map((length) => (
        <button
          key={length}
          onClick={() => onLengthChange(length)}
          className={`
            relative px-4 py-2 rounded-md font-medium text-sm transition-all
            ${
              selectedLength === length
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-muted text-muted-foreground"
            }
          `}
        >
          <div className="flex items-center gap-1.5">
            <span>{length}L</span>
            {statuses[length] !== "empty" && (
              <span className="absolute -top-1 -right-1">
                {getStatusIcon(statuses[length])}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};
