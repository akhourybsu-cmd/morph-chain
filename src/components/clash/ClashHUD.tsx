import { useClashStore } from '@/stores/clashStore';
import { useEffect, useState } from 'react';
import { isClashBotPlayer } from '@/lib/clash/matchService';

export const ClashHUD = () => {
  const { match, userId } = useClashStore();
  const [timeLeft, setTimeLeft] = useState('');

  const isPlayerA = userId === match?.player_a;
  const isWaiting = match?.status === 'waiting';
  const myTiles = isPlayerA ? match?.tiles_a ?? 0 : match?.tiles_b ?? 0;
  const oppTiles = isWaiting ? 0 : (isPlayerA ? match?.tiles_b ?? 0 : match?.tiles_a ?? 0);
  const myMoves = isPlayerA ? match?.moves_a ?? 0 : match?.moves_b ?? 0;
  const oppMoves = isWaiting ? 0 : (isPlayerA ? match?.moves_b ?? 0 : match?.moves_a ?? 0);
  const isMyTurn = match?.current_turn === userId;

  useEffect(() => {
    if (!match?.turn_deadline) { setTimeLeft(''); return; }
    
    const update = () => {
      const deadline = new Date(match.turn_deadline!).getTime();
      const remaining = Math.max(0, deadline - Date.now());
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(remaining <= 0 ? 'Expired' : `${hours}h ${mins}m`);
    };
    
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [match?.turn_deadline]);

  if (!match) return null;

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{
        background: 'hsl(var(--clash-card-bg))',
        border: '1px solid hsl(var(--clash-card-border))',
      }}
    >
      {/* Score bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(var(--clash-player-mine))' }} />
          <span className="text-sm font-semibold font-mono" style={{ color: 'hsl(var(--clash-text-primary))' }}>
            {myTiles}
          </span>
          <span className="text-[10px] uppercase" style={{ color: 'hsl(var(--clash-text-muted))' }}>You</span>
        </div>

        {/* Territory bar */}
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'hsl(var(--clash-neutral))' }}>
          <div className="h-full flex">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${(myTiles / 25) * 100}%`,
                background: 'hsl(var(--clash-player-mine))',
              }}
            />
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${(oppTiles / 25) * 100}%`,
                background: 'hsl(var(--clash-player-opponent))',
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase" style={{ color: 'hsl(var(--clash-text-muted))' }}>
            {isWaiting ? '…' : 'Opp'}
          </span>
          <span className="text-sm font-semibold font-mono" style={{ color: 'hsl(var(--clash-text-primary))' }}>
            {isWaiting ? '—' : oppTiles}
          </span>
          <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(var(--clash-player-opponent))' }} />
        </div>
      </div>

      {/* Moves + Timer */}
      <div className="flex items-center justify-between text-xs" style={{ color: 'hsl(var(--clash-text-muted))' }}>
        <span>Moves: {myMoves}/12{!isWaiting && ` · Opp: ${oppMoves}/12`}</span>
        {isMyTurn && timeLeft && (
          <span className="font-mono">⏱ {timeLeft}</span>
        )}
      </div>

      <div className="text-center">
        <span
          className={`text-xs font-semibold uppercase tracking-widest ${isMyTurn && !isWaiting ? 'animate-pulse' : ''}`}
          style={{ color: isWaiting ? 'hsl(var(--clash-text-muted))' : isMyTurn ? 'hsl(var(--clash-accent))' : 'hsl(var(--clash-text-muted))' }}
        >
          {match.status === 'completed'
            ? match.winner_id === userId ? '🏆 You Won!' : match.winner_id ? 'You Lost' : 'Draw'
            : isWaiting ? 'Waiting for opponent'
            : isMyTurn ? 'Your Turn' : "Opponent's Turn"
          }
        </span>
      </div>
    </div>
  );
};
