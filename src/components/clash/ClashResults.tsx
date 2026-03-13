import { useEffect, useState } from 'react';
import { useClashStore } from '@/stores/clashStore';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { isClashBotPlayer } from '@/lib/clash/matchService';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ClashMove {
  word: string;
  player_id: string;
  move_number: number;
}

export const ClashResults = () => {
  const { match, userId, clearMatch } = useClashStore();
  const navigate = useNavigate();
  const [moves, setMoves] = useState<ClashMove[]>([]);

  useEffect(() => {
    if (!match?.id || match.status !== 'completed') return;
    supabase
      .from('clash_moves')
      .select('word, player_id, move_number')
      .eq('match_id', match.id)
      .order('move_number', { ascending: true })
      .then(({ data }) => {
        if (data) setMoves(data as ClashMove[]);
      });
  }, [match?.id, match?.status]);

  if (!match || match.status !== 'completed') return null;

  const isPlayerA = userId === match.player_a;
  const myTiles = isPlayerA ? match.tiles_a : match.tiles_b;
  const oppTiles = isPlayerA ? match.tiles_b : match.tiles_a;
  const isWin = match.winner_id === userId;
  const isDraw = !match.winner_id;
  const oppId = isPlayerA ? match.player_b : match.player_a;
  const isBotMatch = isClashBotPlayer(oppId ?? null);

  const myWords = moves.filter(m => m.player_id === userId);
  const oppWords = moves.filter(m => m.player_id !== userId);

  return (
    <div
      className="rounded-xl p-6 text-center space-y-5 animate-in fade-in-0 slide-in-from-bottom-2"
      style={{
        background: 'hsl(var(--clash-card-bg))',
        border: `1px solid ${isWin ? 'hsl(var(--clash-success) / 0.4)' : isDraw ? 'hsl(var(--clash-card-border))' : 'hsl(var(--clash-error) / 0.4)'}`,
      }}
    >
      <div className="text-4xl">{isWin ? '🏆' : isDraw ? '🤝' : '💀'}</div>
      <h2
        className="font-playfair text-2xl font-bold"
        style={{ color: 'hsl(var(--clash-text-primary))' }}
      >
        {isWin ? 'Victory!' : isDraw ? 'Draw!' : 'Defeat'}
      </h2>
      
      <div className="flex justify-center gap-8">
        <div className="text-center">
          <div className="text-3xl font-mono font-bold" style={{ color: 'hsl(var(--clash-player-mine))' }}>
            {myTiles}
          </div>
          <div className="text-xs mt-1" style={{ color: 'hsl(var(--clash-text-muted))' }}>Your tiles</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-mono font-bold" style={{ color: 'hsl(var(--clash-player-opponent))' }}>
            {oppTiles}
          </div>
          <div className="text-xs mt-1" style={{ color: 'hsl(var(--clash-text-muted))' }}>
            {isBotMatch ? 'Bot' : 'Opponent'}
          </div>
        </div>
      </div>

      {/* Side-by-side word history */}
      {moves.length > 0 && (
        <div
          className="rounded-lg p-3 mt-2"
          style={{ background: 'hsl(var(--clash-page-bg))', border: '1px solid hsl(var(--clash-card-border))' }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="text-left">
              <div
                className="text-[10px] font-semibold uppercase tracking-wider mb-2 pb-1"
                style={{ color: 'hsl(var(--clash-player-mine))', borderBottom: '1px solid hsl(var(--clash-card-border))' }}
              >
                You ({myWords.length})
              </div>
              <ScrollArea className="max-h-40">
                <div className="space-y-0.5">
                  {myWords.map((m, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs font-inter">
                      <span className="font-mono opacity-40 w-4 text-right" style={{ color: 'hsl(var(--clash-text-muted))' }}>
                        {i + 1}
                      </span>
                      <span className="font-mono font-medium uppercase" style={{ color: 'hsl(var(--clash-text-primary))' }}>
                        {m.word}
                      </span>
                    </div>
                  ))}
                  {myWords.length === 0 && (
                    <span className="text-xs italic" style={{ color: 'hsl(var(--clash-text-muted))' }}>—</span>
                  )}
                </div>
              </ScrollArea>
            </div>
            <div className="text-left">
              <div
                className="text-[10px] font-semibold uppercase tracking-wider mb-2 pb-1"
                style={{ color: 'hsl(var(--clash-player-opponent))', borderBottom: '1px solid hsl(var(--clash-card-border))' }}
              >
                {isBotMatch ? 'Bot' : 'Opponent'} ({oppWords.length})
              </div>
              <ScrollArea className="max-h-40">
                <div className="space-y-0.5">
                  {oppWords.map((m, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs font-inter">
                      <span className="font-mono opacity-40 w-4 text-right" style={{ color: 'hsl(var(--clash-text-muted))' }}>
                        {i + 1}
                      </span>
                      <span className="font-mono font-medium uppercase" style={{ color: 'hsl(var(--clash-text-primary))' }}>
                        {m.word}
                      </span>
                    </div>
                  ))}
                  {oppWords.length === 0 && (
                    <span className="text-xs italic" style={{ color: 'hsl(var(--clash-text-muted))' }}>—</span>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-center pt-2">
        <Button
          onClick={() => { clearMatch(); }}
          className="font-inter"
          style={{
            background: 'hsl(var(--clash-accent))',
            color: '#fff',
          }}
        >
          New Match
        </Button>
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="font-inter"
          style={{ color: 'hsl(var(--clash-text-muted))' }}
        >
          Home
        </Button>
      </div>
    </div>
  );
};
