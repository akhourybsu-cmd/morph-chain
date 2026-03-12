import { useState } from 'react';
import { Clock, Swords, Eye, Hourglass, X, Loader2 } from 'lucide-react';
import { cancelClashMatch, type ClashMatchSummary } from '@/lib/clash/matchService';
import { toast } from 'sonner';

interface ClashMatchListProps {
  matches: ClashMatchSummary[];
  completedMatches: ClashMatchSummary[];
  userId: string | null;
  onSelectMatch: (matchId: string) => void;
  onMatchCancelled?: () => void;
}

export const ClashMatchList = ({ matches, completedMatches, userId, onSelectMatch }: ClashMatchListProps) => {
  if (matches.length === 0 && completedMatches.length === 0) return null;

  const getMatchLabel = (m: ClashMatchSummary) => {
    if (m.status === 'waiting') return 'Waiting for opponent';
    if (m.status === 'completed') {
      if (m.tiles_a === m.tiles_b) return 'Draw';
      const isA = userId === m.player_a;
      const myTiles = isA ? m.tiles_a : m.tiles_b;
      const oppTiles = isA ? m.tiles_b : m.tiles_a;
      return myTiles > oppTiles ? 'You won!' : 'You lost';
    }
    const isMyTurn = m.current_turn === userId;
    return isMyTurn ? 'Your turn' : "Opponent's turn";
  };

  const getTurnColor = (m: ClashMatchSummary) => {
    if (m.status === 'waiting') return 'hsl(var(--clash-text-muted))';
    if (m.status === 'completed') return 'hsl(var(--clash-text-secondary))';
    return m.current_turn === userId ? 'hsl(var(--clash-accent))' : 'hsl(var(--clash-text-muted))';
  };

  const getTimeLeft = (m: ClashMatchSummary) => {
    if (!m.turn_deadline || m.status !== 'active') return null;
    const ms = new Date(m.turn_deadline).getTime() - Date.now();
    if (ms <= 0) return 'Expired';
    const hours = Math.floor(ms / 3600000);
    if (hours >= 1) return `${hours}h left`;
    const mins = Math.floor(ms / 60000);
    return `${mins}m left`;
  };

  const allMatches = [...matches, ...completedMatches];

  return (
    <div
      className="w-full rounded-xl p-4 space-y-2 animate-in fade-in-0"
      style={{
        background: 'hsl(var(--clash-card-bg))',
        border: '1px solid hsl(var(--clash-card-border))',
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Swords className="w-4 h-4" style={{ color: 'hsl(var(--clash-text-muted))' }} />
        <p
          className="text-xs font-inter font-semibold uppercase tracking-widest"
          style={{ color: 'hsl(var(--clash-text-muted))' }}
        >
          My Matches ({matches.length} active)
        </p>
      </div>

      {allMatches.map(m => {
        const isA = userId === m.player_a;
        const myTiles = isA ? m.tiles_a : m.tiles_b;
        const oppTiles = isA ? m.tiles_b : m.tiles_a;
        const timeLeft = getTimeLeft(m);
        const isMyTurn = m.status === 'active' && m.current_turn === userId;

        return (
          <button
            key={m.id}
            onClick={() => onSelectMatch(m.id)}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all hover:shadow-sm active:scale-[0.98]"
            style={{
              background: 'hsl(var(--clash-page-bg))',
              border: isMyTurn ? '1px solid hsl(var(--clash-accent) / 0.4)' : '1px solid transparent',
            }}
          >
            {/* Turn indicator */}
            <div className="flex-shrink-0">
              {m.status === 'waiting' ? (
                <Hourglass className="w-4 h-4" style={{ color: 'hsl(var(--clash-text-muted))' }} />
              ) : m.status === 'completed' ? (
                <Eye className="w-4 h-4" style={{ color: 'hsl(var(--clash-text-muted))' }} />
              ) : isMyTurn ? (
                <span className="w-2.5 h-2.5 rounded-full block animate-pulse" style={{ background: 'hsl(var(--clash-accent))' }} />
              ) : (
                <Clock className="w-4 h-4" style={{ color: 'hsl(var(--clash-text-muted))' }} />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-inter font-medium" style={{ color: getTurnColor(m) }}>
                {getMatchLabel(m)}
              </p>
              {m.status !== 'waiting' && (
                <p className="text-[10px] font-mono mt-0.5" style={{ color: 'hsl(var(--clash-text-muted))' }}>
                  {myTiles} – {oppTiles} tiles
                  {timeLeft && ` · ${timeLeft}`}
                </p>
              )}
            </div>

            {/* Arrow */}
            <span className="text-xs" style={{ color: 'hsl(var(--clash-text-muted))' }}>›</span>
          </button>
        );
      })}
    </div>
  );
};
