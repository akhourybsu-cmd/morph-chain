import { useEffect, useRef } from 'react';
import { Symbol } from '@/lib/morphcode/types';
import { SymbolSlot } from './SymbolSlot';
import { Button } from '@/components/ui/button';
import { Trophy, Minus, ArrowRight } from 'lucide-react';
import { playMatchWin, playMatchLoss, playCodeSolved } from '@/lib/morphcode/audioManager';

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
  roundNumber, winnerId, myId, myGuessCount, opponentGuessCount,
  mySolved, opponentSolved, opponentSequence, onNextRound,
  matchOver, matchWinnerId,
}: RoundResultsProps) => {
  const iWon = winnerId === myId;
  const isDraw = winnerId === null;
  const soundPlayed = useRef(false);

  useEffect(() => {
    if (soundPlayed.current) return;
    soundPlayed.current = true;
    if (matchOver) {
      if (matchWinnerId === myId) playMatchWin();
      else playMatchLoss();
    } else {
      if (iWon) playCodeSolved();
      else if (!isDraw) playMatchLoss();
    }
  }, [matchOver, matchWinnerId, myId, iWon, isDraw]);

  return (
    <div className="flex flex-col items-center gap-5 md:gap-6 px-4 py-6 md:py-8 max-w-sm mx-auto text-center">
      {/* Round result */}
      <div className="animate-scale-in">
        <p className="text-xs uppercase tracking-wider mb-2 font-inter" style={{ color: 'hsl(var(--code-text-muted))' }}>
          Round {roundNumber}
        </p>
        {isDraw ? (
          <div className="flex items-center gap-2">
            <Minus className="w-6 h-6" style={{ color: 'hsl(var(--code-text-muted))' }} />
            <span className="font-playfair text-2xl font-bold" style={{ color: 'hsl(var(--code-text-muted))' }}>
              Draw
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6" style={{ color: iWon ? 'hsl(var(--code-shifted))' : 'hsl(var(--code-text-muted))' }} />
            <span
              className="font-playfair text-2xl font-bold"
              style={{ color: iWon ? 'hsl(var(--code-success))' : 'hsl(var(--code-error))' }}
            >
              {iWon ? 'You Win!' : 'You Lose'}
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div
        className="w-full grid grid-cols-2 gap-4 p-4 rounded-xl animate-fade-in"
        style={{
          background: 'hsl(var(--code-card-bg))',
          border: '1px solid hsl(var(--code-card-border))',
          boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
          animationDelay: '150ms',
          animationFillMode: 'both',
        }}
      >
        <div>
          <p className="text-xs mb-1 font-inter" style={{ color: 'hsl(var(--code-text-muted))' }}>You</p>
          <p className="text-2xl font-bold font-mono" style={{ color: 'hsl(var(--code-text-primary))' }}>
            {mySolved ? myGuessCount : '—'}
          </p>
          <p className="text-xs font-inter" style={{ color: 'hsl(var(--code-text-muted))' }}>
            {mySolved ? 'guesses' : 'failed'}
          </p>
        </div>
        <div>
          <p className="text-xs mb-1 font-inter" style={{ color: 'hsl(var(--code-text-muted))' }}>Opponent</p>
          <p className="text-2xl font-bold font-mono" style={{ color: 'hsl(var(--code-text-primary))' }}>
            {opponentSolved ? opponentGuessCount : '—'}
          </p>
          <p className="text-xs font-inter" style={{ color: 'hsl(var(--code-text-muted))' }}>
            {opponentSolved ? 'guesses' : 'failed'}
          </p>
        </div>
      </div>

      {/* Opponent's sequence reveal */}
      {opponentSequence && (
        <div className="animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
          <p className="text-xs mb-2 font-inter" style={{ color: 'hsl(var(--code-text-muted))' }}>
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
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: '450ms', animationFillMode: 'both' }}>
          <p
            className="font-playfair text-xl font-bold"
            style={{ color: matchWinnerId === myId ? 'hsl(var(--code-success))' : 'hsl(var(--code-error))' }}
          >
            {matchWinnerId === myId ? 'Match Won! 🎉' : 'Match Lost'}
          </p>
          <Button
            onClick={onNextRound}
            size="lg"
            style={{ background: 'hsl(var(--code-accent))', color: '#fff' }}
          >
            Back to Lobby
          </Button>
        </div>
      ) : (
        <Button
          onClick={onNextRound}
          size="lg"
          className="gap-2 animate-fade-in"
          style={{ background: 'hsl(var(--code-accent))', color: '#fff', animationDelay: '400ms', animationFillMode: 'both' }}
        >
          Next Round
          <ArrowRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};
