import { useEffect, useRef, useState } from 'react';
import { Symbol } from '@/lib/morphcode/types';
import { SymbolSlot } from './SymbolSlot';
import { CodeCelebration } from './CodeCelebration';
import { Button } from '@/components/ui/button';
import { Trophy, Minus, ArrowRight, RotateCcw, Zap } from 'lucide-react';
import { playMatchWin, playMatchLoss, playCodeSolved } from '@/lib/morphcode/audioManager';
import { getRankTitle, XP_WIN, XP_LOSS, XP_SOLVE, getStreakMultiplier } from '@/lib/morphcode/types';

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
  onRematch?: () => void;
  myWins?: number;
  myStreak?: number;
}

export const RoundResults = ({
  roundNumber, winnerId, myId, myGuessCount, opponentGuessCount,
  mySolved, opponentSolved, opponentSequence, onNextRound,
  matchOver, matchWinnerId, onRematch, myWins = 0, myStreak = 0,
}: RoundResultsProps) => {
  const iWon = winnerId === myId;
  const isDraw = winnerId === null;
  const matchWon = matchWinnerId === myId;
  const soundPlayed = useRef(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (soundPlayed.current) return;
    soundPlayed.current = true;
    if (matchOver) {
      if (matchWon) { playMatchWin(); setShowCelebration(true); }
      else playMatchLoss();
    } else {
      if (iWon) { playCodeSolved(); setShowCelebration(true); }
      else if (!isDraw) playMatchLoss();
    }
    if (showCelebration) {
      const t = setTimeout(() => setShowCelebration(false), 1500);
      return () => clearTimeout(t);
    }
  }, [matchOver, matchWinnerId, myId, iWon, isDraw]);

  const xpGained = iWon ? XP_WIN * getStreakMultiplier(myStreak) : isDraw ? XP_SOLVE : XP_LOSS;

  return (
    <div className="flex flex-col items-center gap-5 md:gap-6 px-4 py-6 md:py-8 max-w-sm mx-auto text-center">
      {showCelebration && <CodeCelebration symbols={opponentSequence} />}

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

      {/* XP gain badge */}
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full animate-fade-in"
        style={{
          background: 'hsl(var(--code-accent) / 0.12)',
          color: 'hsl(var(--code-accent))',
          animationDelay: '100ms',
          animationFillMode: 'both',
        }}
      >
        <Zap className="w-3.5 h-3.5" />
        <span className="text-xs font-bold font-mono">+{xpGained} XP</span>
        {iWon && myStreak >= 3 && (
          <span className="text-[10px] font-inter">({getStreakMultiplier(myStreak)}x streak!)</span>
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
            style={{ color: matchWon ? 'hsl(var(--code-success))' : 'hsl(var(--code-error))' }}
          >
            {matchWon ? 'Match Won! 🎉' : 'Match Lost'}
          </p>
          {myWins > 0 && (
            <p className="text-xs font-inter" style={{ color: 'hsl(var(--code-text-muted))' }}>
              Rank: {getRankTitle(myWins)}
            </p>
          )}
          <div className="flex gap-2 justify-center">
            <Button
              onClick={onNextRound}
              size="lg"
              variant="outline"
              className="border-[hsl(var(--code-card-border))]"
              style={{ color: 'hsl(var(--code-text-primary))' }}
            >
              Lobby
            </Button>
            {onRematch && (
              <Button
                onClick={onRematch}
                size="lg"
                className="gap-2"
                style={{ background: 'hsl(var(--code-accent))', color: '#fff' }}
              >
                <RotateCcw className="w-4 h-4" />
                Rematch
              </Button>
            )}
          </div>
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
