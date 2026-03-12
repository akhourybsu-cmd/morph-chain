import { useEffect, useState } from 'react';
import { MatchState } from '@/lib/morphcode/types';
import { getPlayerStats, getPlayerDisplayName, MorphcodePlayerStats } from '@/lib/morphcode/matchService';

interface MatchScoreBarProps {
  match: MatchState;
  myId: string;
}

export const MatchScoreBar = ({ match, myId }: MatchScoreBarProps) => {
  const isPlayerA = myId === match.playerA;
  const myWins = isPlayerA ? match.roundWinsA : match.roundWinsB;
  const opponentWins = isPlayerA ? match.roundWinsB : match.roundWinsA;
  const opponentId = isPlayerA ? match.playerB : match.playerA;

  const [myStats, setMyStats] = useState<MorphcodePlayerStats | null>(null);
  const [oppStats, setOppStats] = useState<MorphcodePlayerStats | null>(null);
  const [oppName, setOppName] = useState<string>('Opp');

  useEffect(() => {
    getPlayerStats(myId).then(setMyStats);
    if (opponentId) {
      getPlayerStats(opponentId).then(setOppStats);
      getPlayerDisplayName(opponentId).then(setOppName);
    }
  }, [myId, opponentId]);

  const formatRecord = (s: MorphcodePlayerStats | null) =>
    s ? `${s.wins}W–${s.losses}L–${s.draws}D` : '…';

  return (
    <div
      className="flex items-center justify-center gap-4 md:gap-6 py-2 px-3 md:px-4"
      style={{
        borderBottom: '1px solid hsl(var(--code-divider))',
        background: 'hsl(var(--code-page-bg))',
      }}
    >
      <div className="flex flex-col items-center gap-0.5">
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
        <span className="text-[10px] font-mono" style={{ color: 'hsl(var(--code-text-muted))' }}>
          {formatRecord(myStats)}
        </span>
      </div>

      <span className="text-lg font-mono font-bold" style={{ color: 'hsl(var(--code-text-primary))' }}>
        {myWins} – {opponentWins}
      </span>

      <div className="flex flex-col items-center gap-0.5">
        <span className="text-xs font-medium truncate max-w-[5rem]" style={{ color: 'hsl(var(--code-text-muted))' }}>
          {oppName}
        </span>
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
        <span className="text-[10px] font-mono" style={{ color: 'hsl(var(--code-text-muted))' }}>
          {formatRecord(oppStats)}
        </span>
      </div>
    </div>
  );
};
