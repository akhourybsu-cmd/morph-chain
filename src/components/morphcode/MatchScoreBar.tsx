import { MatchState } from '@/lib/morphcode/types';

interface MatchScoreBarProps {
  match: MatchState;
  myId: string;
}

export const MatchScoreBar = ({ match, myId }: MatchScoreBarProps) => {
  const isPlayerA = myId === match.playerA;
  const myWins = isPlayerA ? match.roundWinsA : match.roundWinsB;
  const opponentWins = isPlayerA ? match.roundWinsB : match.roundWinsA;
  const roundsToWin = match.roundWinsA + match.roundWinsB > 0 ? match.roundWinsA + match.roundWinsB : 0;

  return (
    <div 
      className="flex items-center justify-center gap-6 py-2 px-4"
      style={{ borderBottom: '1px solid hsl(var(--border))' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>You</span>
        <div className="flex gap-1">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full transition-all"
              style={{
                background: i < myWins ? 'hsl(145, 70%, 45%)' : 'hsl(var(--muted) / 0.3)',
                boxShadow: i < myWins ? '0 0 6px hsl(145, 70%, 45% / 0.5)' : 'none',
              }}
            />
          ))}
        </div>
      </div>

      <span className="text-lg font-mono font-bold" style={{ color: 'hsl(var(--foreground))' }}>
        {myWins} – {opponentWins}
      </span>

      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full transition-all"
              style={{
                background: i < opponentWins ? 'hsl(0, 70%, 55%)' : 'hsl(var(--muted) / 0.3)',
                boxShadow: i < opponentWins ? '0 0 6px hsl(0, 70%, 55% / 0.5)' : 'none',
              }}
            />
          ))}
        </div>
        <span className="text-xs font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>Opp</span>
      </div>
    </div>
  );
};
