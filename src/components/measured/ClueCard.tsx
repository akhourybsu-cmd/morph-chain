interface ClueCardProps {
  clueText: string;
  unitLabel: string;
  roundingNote: string | null;
}

export function ClueCard({ clueText, unitLabel, roundingNote }: ClueCardProps) {
  return (
    <div className="bg-measured-card border border-measured-card-border rounded-2xl p-5">
      <h2 className="text-xs font-medium text-measured-accent uppercase tracking-wider mb-2">
        Today's Measure
      </h2>
      <p className="text-lg font-medium text-measured-text-primary leading-relaxed">
        {clueText}
      </p>
      <div className="mt-3 flex items-center gap-2 text-sm text-measured-text-secondary">
        <span className="bg-measured-tile-bg px-2 py-0.5 rounded">{unitLabel}</span>
        {roundingNote && (
          <span className="text-measured-text-muted">({roundingNote})</span>
        )}
      </div>
    </div>
  );
}
