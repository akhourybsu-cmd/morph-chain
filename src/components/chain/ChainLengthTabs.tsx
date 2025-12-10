interface ChainLengthTabsProps {
  selectedLength: 4 | 5;
  onLengthChange: (length: 4 | 5) => void;
  statuses: Record<4 | 5, "empty" | "won" | "failed" | "in-progress">;
}

export const ChainLengthTabs = ({
  selectedLength,
  onLengthChange,
  statuses,
}: ChainLengthTabsProps) => {
  const getStatusIndicator = (status: string) => {
    switch (status) {
      case "won":
        return <span className="ml-1.5 text-[hsl(var(--chain-success))]">✓</span>;
      case "failed":
        return <span className="ml-1.5 text-[hsl(var(--chain-error))]">✗</span>;
      case "in-progress":
        return <span className="ml-1.5 text-[hsl(var(--chain-accent))]">•</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex justify-center px-4 py-2">
      <div className="flex gap-8 text-sm font-medium">
        <button
          onClick={() => onLengthChange(4)}
          className={`relative pb-2 transition-colors ${
            selectedLength === 4
              ? "text-[hsl(var(--chain-text-primary))]"
              : "text-[hsl(var(--chain-text-muted))] hover:text-[hsl(var(--chain-text-secondary))]"
          }`}
        >
          <span className="flex items-center">
            4-Letter
            {getStatusIndicator(statuses[4])}
          </span>
          {selectedLength === 4 && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[hsl(var(--chain-accent))]" />
          )}
        </button>
        
        <span className="text-[hsl(var(--chain-divider))]">|</span>
        
        <button
          onClick={() => onLengthChange(5)}
          className={`relative pb-2 transition-colors ${
            selectedLength === 5
              ? "text-[hsl(var(--chain-text-primary))]"
              : "text-[hsl(var(--chain-text-muted))] hover:text-[hsl(var(--chain-text-secondary))]"
          }`}
        >
          <span className="flex items-center">
            5-Letter
            {getStatusIndicator(statuses[5])}
          </span>
          {selectedLength === 5 && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[hsl(var(--chain-accent))]" />
          )}
        </button>
      </div>
    </div>
  );
};
