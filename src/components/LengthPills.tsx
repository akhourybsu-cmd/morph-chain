interface LengthPillsProps {
  selectedLength: 4 | 5;
  onLengthChange: (length: 4 | 5) => void;
  statuses: {
    4: "empty" | "won" | "failed" | "in-progress";
    5: "empty" | "won" | "failed" | "in-progress";
  };
}

export const LengthPills = ({ selectedLength, onLengthChange }: LengthPillsProps) => {
  const lengths: Array<4 | 5> = [4, 5];

  return (
    <div 
      role="tablist"
      className="flex items-center justify-center gap-0 p-1 bg-[#1C1F26] rounded-full max-w-[340px] mx-auto"
    >
      {lengths.map((length) => {
        const isSelected = selectedLength === length;
        
        return (
          <button
            key={length}
            role="tab"
            aria-selected={isSelected}
            aria-label={`${length} letters`}
            onClick={() => onLengthChange(length)}
            className={`
              flex-1 min-h-[44px] px-6 py-2.5 rounded-full font-semibold text-base
              transition-all duration-200 ease-in-out
              ${
                isSelected
                  ? "bg-[#00E6E6] text-[#1C1F26]"
                  : "bg-transparent text-white/70 hover:text-white"
              }
            `}
          >
            {length}L
          </button>
        );
      })}
    </div>
  );
};
