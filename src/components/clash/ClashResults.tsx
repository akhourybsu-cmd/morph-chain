import { useClashStore } from '@/stores/clashStore';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export const ClashResults = () => {
  const { match, userId, clearMatch } = useClashStore();
  const navigate = useNavigate();

  if (!match || match.status !== 'completed') return null;

  const isPlayerA = userId === match.player_a;
  const myTiles = isPlayerA ? match.tiles_a : match.tiles_b;
  const oppTiles = isPlayerA ? match.tiles_b : match.tiles_a;
  const isWin = match.winner_id === userId;
  const isDraw = !match.winner_id;

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
          <div className="text-xs mt-1" style={{ color: 'hsl(var(--clash-text-muted))' }}>Opponent</div>
        </div>
      </div>

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
