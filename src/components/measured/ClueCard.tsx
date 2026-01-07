interface ClueCardProps {
  clueText: string;
  unitLabel: string;
  roundingNote: string | null;
}

export function ClueCard({ clueText, unitLabel, roundingNote }: ClueCardProps) {
  return (
    <div className="bg-measured-card border border-measured-card-border rounded-2xl p-6 shadow-sm">
      <h2 className="text-[11px] font-semibold text-measured-accent uppercase tracking-widest mb-3">
        Today's Measure
      </h2>
      <p className="text-lg md:text-xl font-medium text-measured-text-primary leading-relaxed">
        {clueText}
      </p>
      <div className="mt-4 flex items-center gap-2 text-sm text-measured-text-secondary">
        <span className="bg-measured-tile-bg px-2.5 py-1 rounded-md font-medium">{unitLabel}</span>
        {roundingNote && (
          <span className="text-measured-text-muted text-xs">({roundingNote})</span>
        )}
      </div>
    </div>
  );
}
