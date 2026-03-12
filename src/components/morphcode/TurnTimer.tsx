interface TurnTimerProps {
  timeLeft: number;
  total: number;
}

export const TurnTimer = ({ timeLeft, total }: TurnTimerProps) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, timeLeft / total);
  const offset = circumference * (1 - progress);

  const color =
    timeLeft <= 10 ? 'hsl(var(--code-error))'
    : timeLeft <= 30 ? 'hsl(var(--code-shifted))'
    : 'hsl(var(--code-accent))';

  return (
    <div className="relative inline-flex items-center justify-center w-12 h-12">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
        <circle
          cx="24" cy="24" r={radius}
          fill="none"
          stroke="hsl(var(--code-divider))"
          strokeWidth="3"
        />
        <circle
          cx="24" cy="24" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-linear"
        />
      </svg>
      <span
        className={`absolute text-xs font-mono font-bold ${timeLeft <= 10 ? 'animate-pulse' : ''}`}
        style={{ color }}
      >
        {timeLeft}
      </span>
    </div>
  );
};
