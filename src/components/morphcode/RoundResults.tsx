import { Symbol, SYMBOL_DISPLAY } from '@/lib/morphcode/types';
import { SymbolSlot } from './SymbolSlot';
import { Button } from '@/components/ui/button';
import { Trophy, Minus, ArrowRight } from 'lucide-react';

interface RoundResultsProps {
  roundNumber: number;
  winnerId: string | null;
  myId: string;
  myGuessCount: number;
  opponentGuessCount: number;
  mySolved: boolean;
  opponentSolved: boolean;
  opponentSequence?: Symbol[];
  onNextRound: () => void;
  matchOver: boolean;
  matchWinnerId: string | null;
}

export const RoundResults = ({
  roundNumber,
  winnerId,
  myId,
  myGuessCount,
  opponentGuessCount,
  mySolved,
  opponentSolved,
  opponentSequence,
  onNextRound,
  matchOver,
  matchWinnerId,
}: RoundResultsProps) => {
  const iWon = winnerId === myId;
  const isDraw = winnerId === null;

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-8 max-w-sm mx-auto text-center">
      {/* Round result */}
      <div>
        <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Round {roundNumber}
        </p>
        {isDraw ? (
          <div className="flex items-center gap-2">
            <Minus className="w-6 h-6" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <span className="font-serif text-2xl font-bold" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Draw
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6" style={{ color: iWon ? 'hsl(45, 90%, 50%)' : 'hsl(var(--muted-foreground))' }} />
            <span 
              className="font-serif text-2xl font-bold"
              style={{ color: iWon ? 'hsl(145, 70%, 45%)' : 'hsl(0, 70%, 55%)' }}
            >
              {iWon ? 'You Win!' : 'You Lose'}
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div 
        className="w-full grid grid-cols-2 gap-4 p-4 rounded-xl"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      >
        <div>
          <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>You</p>
          <p className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
            {mySolved ? myGuessCount : '—'}
          </p>
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {mySolved ? 'guesses' : 'failed'}
          </p>
        </div>
        <div>
          <p className="text-xs mb-1" style={{ color: 'hsl(var(--muted-foreground))' }}>Opponent</p>
          <p className="text-2xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>
            {opponentSolved ? opponentGuessCount : '—'}
          </p>
          <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {opponentSolved ? 'guesses' : 'failed'}
          </p>
        </div>
      </div>

      {/* Opponent's sequence reveal */}
      {opponentSequence && (
        <div>
          <p className="text-xs mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Opponent's sequence:
          </p>
          <div className="flex gap-2 justify-center">
            {opponentSequence.map((s, i) => (
              <SymbolSlot key={i} symbol={s} size="md" disabled />
            ))}
          </div>
        </div>
      )}

      {/* Match over or next round */}
      {matchOver ? (
        <div className="space-y-3">
          <p 
            className="font-serif text-xl font-bold"
            style={{ color: matchWinnerId === myId ? 'hsl(145, 70%, 45%)' : 'hsl(0, 70%, 55%)' }}
          >
            {matchWinnerId === myId ? 'Match Won! 🎉' : 'Match Lost'}
          </p>
          <Button onClick={onNextRound} size="lg">
            Back to Lobby
          </Button>
        </div>
      ) : (
        <Button onClick={onNextRound} size="lg" className="gap-2">
          Next Round
          <ArrowRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};
