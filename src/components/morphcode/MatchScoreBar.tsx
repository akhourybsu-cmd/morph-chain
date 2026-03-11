import { MatchState } from '@/lib/morphcode/types';

interface MatchScoreBarProps {
  match: MatchState;
  myId: string;
}

export const MatchScoreBar = ({ match, myId }: MatchScoreBarProps) => {
  const isPlayerA = myId === match.playerA;
  const myWins = isPlayerA ? match.roundWinsA : match.roundWinsB;
  const opponentWins = isPlayerA ? match.roundWinsB : match.roundWinsA;

  return (
    <div
      className="flex items-center justify-center gap-6 py-2 px-4"
      style={{ 
        borderBottom: '1px solid hsl(var(--code-divider))',
        background: 'hsl(var(--code-page-bg))',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium" style={{ color: 'hsl(var(--code-text-muted))' }}>You</span>
        <div className="flex gap-1">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full transition-all"
              style={{
                background: i < myWins ? 'hsl(var(--code-success))' : 'hsl(var(--code-divider))',
              }}
            />
          ))}
        </div>
      </div>

      <span className="text-lg font-mono font-bold" style={{ color: 'hsl(var(--code-text-primary))' }}>
        {myWins} – {opponentWins}
      </span>

      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full transition-all"
              style={{
                background: i < opponentWins ? 'hsl(var(--code-error))' : 'hsl(var(--code-divider))',
              }}
            />
          ))}
        </div>
        <span className="text-xs font-medium" style={{ color: 'hsl(var(--code-text-muted))' }}>Opp</span>
      </div>
    </div>
  );
};
