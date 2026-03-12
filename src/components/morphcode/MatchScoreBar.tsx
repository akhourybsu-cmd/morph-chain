import { useEffect, useState } from 'react';
import { MatchState } from '@/lib/morphcode/types';
import { getRankTitle } from '@/lib/morphcode/types';
import { getPlayerStats, getPlayerDisplayName, MorphcodePlayerStats } from '@/lib/morphcode/matchService';
import { Flame } from 'lucide-react';

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

  const renderSide = (label: string, stats: MorphcodePlayerStats | null, wins: number) => (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium truncate max-w-[5rem]" style={{ color: 'hsl(var(--code-text-muted))' }}>{label}</span>
        {(stats?.current_streak || 0) >= 2 && (
          <span className="flex items-center gap-0.5">
            <Flame className="w-3 h-3" style={{ color: 'hsl(15, 90%, 55%)' }} />
            <span className="text-[9px] font-bold" style={{ color: 'hsl(15, 90%, 55%)' }}>{stats!.current_streak}</span>
          </span>
        )}
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full transition-all"
            style={{
              background: i < wins ? (label === 'You' ? 'hsl(var(--code-success))' : 'hsl(var(--code-error))') : 'hsl(var(--code-divider))',
            }}
          />
        ))}
      </div>
      <span className="text-[9px] font-inter" style={{ color: 'hsl(var(--code-accent))' }}>
        {stats ? getRankTitle(stats.wins) : '…'}
      </span>
    </div>
  );

  return (
    <div
      className="flex items-center justify-center gap-4 md:gap-6 py-2 px-3 md:px-4"
      style={{
        borderBottom: '1px solid hsl(var(--code-divider))',
        background: 'hsl(var(--code-page-bg))',
      }}
    >
      {renderSide('You', myStats, myWins)}

      <span className="text-lg font-mono font-bold" style={{ color: 'hsl(var(--code-text-primary))' }}>
        {myWins} – {opponentWins}
      </span>

      {renderSide(oppName, oppStats, opponentWins)}
    </div>
  );
};
