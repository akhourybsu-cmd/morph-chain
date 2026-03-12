interface FeedbackPipsProps {
  exact: number;
  shifted: number;
  animate?: boolean;
}

export const FeedbackPips = ({ exact, shifted, animate }: FeedbackPipsProps) => {
  return (
    <div
      className={`flex items-center gap-1.5 ${animate ? 'animate-fade-in' : ''}`}
    >
      {exact > 0 && (
        <span
          className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold font-mono"
          style={{
            background: 'hsl(var(--code-exact) / 0.15)',
            color: 'hsl(var(--code-exact))',
          }}
        >
          {exact} ✓
        </span>
      )}
      {shifted > 0 && (
        <span
          className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-bold font-mono"
          style={{
            background: 'hsl(var(--code-shifted) / 0.15)',
            color: 'hsl(var(--code-shifted))',
          }}
        >
          {shifted} ~
        </span>
      )}
      {exact === 0 && shifted === 0 && (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono"
          style={{
            background: 'hsl(var(--code-divider) / 0.3)',
            color: 'hsl(var(--code-text-muted))',
          }}
        >
          0
        </span>
      )}
    </div>
  );
};
