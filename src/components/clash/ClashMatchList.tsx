import { useState, useMemo } from 'react';
import { Clock, Swords, Eye, Hourglass, X, Loader2 } from 'lucide-react';
import { cancelClashMatch, isClashBotPlayer, type ClashMatchSummary } from '@/lib/clash/matchService';
import { toast } from 'sonner';

interface ClashMatchListProps {
  matches: ClashMatchSummary[];
  completedMatches: ClashMatchSummary[];
  userId: string | null;
  opponentNames: Record<string, string>;
  onSelectMatch: (matchId: string) => void;
  onMatchCancelled?: () => void;
}

export const ClashMatchList = ({ matches, completedMatches, userId, opponentNames, onSelectMatch, onMatchCancelled }: ClashMatchListProps) => {
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  if (matches.length === 0 && completedMatches.length === 0) return null;

  const handleCancel = async (e: React.MouseEvent, matchId: string) => {
    e.stopPropagation();
    setCancellingId(matchId);
    const success = await cancelClashMatch(matchId);
    setCancellingId(null);
    if (success) {
      toast('Match cancelled');
      onMatchCancelled?.();
    } else {
      toast.error('Failed to cancel match');
    }
  };

  const getOpponentId = (m: ClashMatchSummary) => {
    if (!userId) return null;
    return userId === m.player_a ? m.player_b : m.player_a;
  };

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
    if (isMyTurn) return 'Your turn';
    const oppId = getOpponentId(m);
    if (oppId && isClashBotPlayer(oppId)) return "Bot's turn";
    if (oppId && opponentNames[oppId]) return `${opponentNames[oppId]}'s turn`;
    return "Opponent's turn";
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

  // Sort: my turn first, then opponent's turn, then waiting
  const sortPriority = (m: ClashMatchSummary): number => {
    if (m.status === 'active' && m.current_turn === userId) return 0;
    if (m.status === 'active') return 1;
    if (m.status === 'waiting') return 2;
    return 3; // completed
  };

  const allMatches = [...matches, ...completedMatches].sort((a, b) => {
    const pa = sortPriority(a);
    const pb = sortPriority(b);
    if (pa !== pb) return pa - pb;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

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
              boxShadow: isMyTurn ? '0 0 8px hsl(var(--clash-accent) / 0.25)' : 'none',
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

            {/* Cancel / Arrow */}
            {m.status === 'waiting' && userId === m.player_a ? (
              <button
                onClick={(e) => handleCancel(e, m.id)}
                disabled={cancellingId === m.id}
                className="p-1 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                style={{ color: 'hsl(var(--clash-text-muted))' }}
              >
                {cancellingId === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              </button>
            ) : (
              <span className="text-xs" style={{ color: 'hsl(var(--clash-text-muted))' }}>›</span>
            )}
          </button>
        );
      })}
    </div>
  );
};