import { useEffect, useRef, useState } from 'react';
import { Symbol } from '@/lib/morphcode/types';
import { SymbolSlot } from './SymbolSlot';
import { CodeCelebration } from './CodeCelebration';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Trophy, Minus, ArrowRight, RotateCcw, Zap, ChevronDown, Eye } from 'lucide-react';
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
  mySequence?: Symbol[];
  onNextRound: () => void;
  matchOver: boolean;
  matchWinnerId: string | null;
  onRematch?: () => void;
  myWins?: number;
  myStreak?: number;
}

export const RoundResults = ({
  roundNumber, winnerId, myId, myGuessCount, opponentGuessCount,
  mySolved, opponentSolved, opponentSequence, mySequence, onNextRound,
  matchOver, matchWinnerId, onRematch, myWins = 0, myStreak = 0,
}: RoundResultsProps) => {
  const iWon = winnerId === myId;
  const isDraw = winnerId === null;
  const matchWon = matchWinnerId === myId;
  const soundPlayed = useRef(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [mySeqOpen, setMySeqOpen] = useState(true);
  const [revealedSymbols, setRevealedSymbols] = useState<number>(0);

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

  // Staggered reveal for opponent sequence
  useEffect(() => {
    if (!opponentSequence) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    opponentSequence.forEach((_, i) => {
      timers.push(setTimeout(() => setRevealedSymbols(i + 1), 400 + i * 200));
    });
    return () => timers.forEach(clearTimeout);
  }, [opponentSequence]);

  const xpGained = iWon ? XP_WIN * getStreakMultiplier(myStreak) : isDraw ? XP_SOLVE : XP_LOSS;

  return (
    <div className="flex flex-col items-center gap-4 md:gap-5 px-4 py-6 md:py-8 max-w-sm mx-auto text-center">
      {showCelebration && <CodeCelebration symbols={opponentSequence} />}

      {/* Round result headline */}
      <div className="animate-scale-in">
        <p className="text-[10px] uppercase tracking-[0.2em] mb-2 font-inter" style={{ color: 'hsl(var(--code-text-muted))' }}>
          {matchOver ? 'Match Complete' : `Round ${roundNumber}`}
        </p>
        {isDraw ? (
          <div className="flex items-center justify-center gap-2">
            <Minus className="w-5 h-5" style={{ color: 'hsl(var(--code-text-muted))' }} />
            <span className="font-playfair text-2xl font-bold" style={{ color: 'hsl(var(--code-text-muted))' }}>
              Draw
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <Trophy className="w-5 h-5" style={{ color: iWon ? 'hsl(var(--code-shifted))' : 'hsl(var(--code-text-muted))' }} />
            <span
              className="font-playfair text-2xl font-bold"
              style={{ color: iWon ? 'hsl(var(--code-success))' : 'hsl(var(--code-error))' }}
            >
              {matchOver
                ? (matchWon ? 'Match Won! 🎉' : 'Match Lost')
                : (iWon ? 'You Win!' : 'You Lose')}
            </span>
          </div>
        )}
      </div>

      {/* XP badge */}
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full animate-fade-in"
        style={{
          background: 'hsl(var(--code-accent) / 0.12)',
          color: 'hsl(var(--code-accent))',
          animationDelay: '150ms',
          animationFillMode: 'both',
        }}
      >
        <Zap className="w-3.5 h-3.5" />
        <span className="text-xs font-bold font-mono">+{xpGained} XP</span>
        {iWon && myStreak >= 3 && (
          <span className="text-[10px] font-inter">({getStreakMultiplier(myStreak)}x streak!)</span>
        )}
      </div>

      {/* Stats card */}
      <div
        className="w-full grid grid-cols-2 gap-4 p-4 rounded-xl animate-fade-in"
        style={{
          background: 'hsl(var(--code-card-bg))',
          border: '1px solid hsl(var(--code-card-border))',
          boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
          animationDelay: '200ms',
          animationFillMode: 'both',
        }}
      >
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-1 font-inter" style={{ color: 'hsl(var(--code-text-muted))' }}>You</p>
          <p className="text-2xl font-bold font-mono" style={{ color: 'hsl(var(--code-text-primary))' }}>
            {mySolved ? myGuessCount : '—'}
          </p>
          <p className="text-[10px] font-inter" style={{ color: 'hsl(var(--code-text-muted))' }}>
            {mySolved ? 'guesses' : 'unsolved'}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-1 font-inter" style={{ color: 'hsl(var(--code-text-muted))' }}>Opponent</p>
          <p className="text-2xl font-bold font-mono" style={{ color: 'hsl(var(--code-text-primary))' }}>
            {opponentSolved ? opponentGuessCount : '—'}
          </p>
          <p className="text-[10px] font-inter" style={{ color: 'hsl(var(--code-text-muted))' }}>
            {opponentSolved ? 'guesses' : 'unsolved'}
          </p>
        </div>
      </div>

      {/* Opponent's sequence — staggered reveal */}
      {opponentSequence && (
        <div
          className="w-full rounded-xl p-4 animate-fade-in"
          style={{
            background: 'hsl(var(--code-card-bg))',
            border: '1px solid hsl(var(--code-card-border))',
            animationDelay: '350ms',
            animationFillMode: 'both',
          }}
        >
          <p className="text-[10px] uppercase tracking-[0.15em] mb-3 font-inter font-medium" style={{ color: 'hsl(var(--code-text-muted))' }}>
            Opponent's Code
          </p>
          <div className="flex gap-2 justify-center">
            {opponentSequence.map((s, i) => (
              <div
                key={i}
                className="transition-all duration-300"
                style={{
                  opacity: i < revealedSymbols ? 1 : 0,
                  transform: i < revealedSymbols ? 'scale(1) rotateY(0deg)' : 'scale(0.5) rotateY(90deg)',
                  transitionDelay: `${i * 100}ms`,
                }}
              >
                <SymbolSlot symbol={s} size="lg" disabled />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My sequence — collapsible */}
      {mySequence && (
        <Collapsible open={mySeqOpen} onOpenChange={setMySeqOpen} className="w-full animate-fade-in" style={{ animationDelay: '500ms', animationFillMode: 'both' }}>
          <CollapsibleTrigger asChild>
            <button
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors"
              style={{
                background: 'hsl(var(--code-pill-bg))',
                border: '1px solid hsl(var(--code-card-border))',
                color: 'hsl(var(--code-text-secondary))',
              }}
            >
              <span className="flex items-center gap-2 text-xs font-inter font-medium uppercase tracking-wider">
                <Eye className="w-3.5 h-3.5" />
                Your Code
              </span>
              <ChevronDown
                className="w-4 h-4 transition-transform duration-200"
                style={{ transform: mySeqOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="flex gap-2 justify-center">
              {mySequence.map((s, i) => (
                <SymbolSlot key={i} symbol={s} size="md" disabled />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Rank */}
      {matchOver && myWins > 0 && (
        <p
          className="text-xs font-inter animate-fade-in"
          style={{ color: 'hsl(var(--code-text-muted))', animationDelay: '600ms', animationFillMode: 'both' }}
        >
          Rank: {getRankTitle(myWins)}
        </p>
      )}

      {/* Actions */}
      <div
        className="flex gap-2 justify-center animate-fade-in"
        style={{ animationDelay: matchOver ? '650ms' : '550ms', animationFillMode: 'both' }}
      >
        {matchOver ? (
          <>
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
          </>
        ) : (
          <Button
            onClick={onNextRound}
            size="lg"
            className="gap-2"
            style={{ background: 'hsl(var(--code-accent))', color: '#fff' }}
          >
            Next Round
            <ArrowRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
