import { useState, useEffect, useRef } from 'react';
import { Symbol, SLOTS, GuessEntry, MAX_GUESSES } from '@/lib/morphcode/types';
import { SymbolSlot } from './SymbolSlot';
import { FeedbackPips } from './FeedbackPips';
import { TurnTimer } from './TurnTimer';
import { Button } from '@/components/ui/button';
import { Send, RotateCcw } from 'lucide-react';
import { playSymbolPlace, playSymbolRemove, playGuessSubmit, playTimerTick } from '@/lib/morphcode/audioManager';

interface GuessBoardProps {
  symbolPool: Symbol[];
  myGuesses: GuessEntry[];
  opponentGuesses: GuessEntry[];
  isMyTurn: boolean;
  onSubmitGuess: (guess: Symbol[]) => void;
  mySolved: boolean;
  opponentSolved: boolean;
  turnTimeSeconds: number;
  turnStartedAt: string | null;
}

export const GuessBoard = ({
  symbolPool, myGuesses, opponentGuesses, isMyTurn, onSubmitGuess,
  mySolved, opponentSolved, turnTimeSeconds, turnStartedAt,
}: GuessBoardProps) => {
  const [draft, setDraft] = useState<(Symbol | null)[]>(Array(SLOTS).fill(null));
  const [timeLeft, setTimeLeft] = useState(turnTimeSeconds);
  const lastTickRef = useRef<number>(-1);

  const usedInDraft = new Set(draft.filter(Boolean) as Symbol[]);
  const isFull = draft.every(s => s !== null);

  useEffect(() => {
    if (!isMyTurn || !turnStartedAt) return;
    const interval = setInterval(() => {
      const elapsed = (Date.now() - new Date(turnStartedAt).getTime()) / 1000;
      const remaining = Math.max(0, turnTimeSeconds - elapsed);
      const rounded = Math.ceil(remaining);
      setTimeLeft(rounded);

      if (rounded !== lastTickRef.current && (rounded === 30 || rounded <= 10) && rounded > 0) {
        playTimerTick(rounded);
        lastTickRef.current = rounded;
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isMyTurn, turnStartedAt, turnTimeSeconds]);

  const handlePoolSelect = (symbol: Symbol) => {
    if (!isMyTurn || usedInDraft.has(symbol)) return;
    const emptyIdx = draft.findIndex(s => s === null);
    if (emptyIdx !== -1) {
      const newDraft = [...draft];
      newDraft[emptyIdx] = symbol;
      setDraft(newDraft);
      playSymbolPlace();
    }
  };

  const handleSlotClick = (index: number) => {
    if (!isMyTurn || !draft[index]) return;
    const newDraft = [...draft];
    newDraft[index] = null;
    setDraft(newDraft);
    playSymbolRemove();
  };

  const handleSubmit = () => {
    if (!isFull || !isMyTurn) return;
    playGuessSubmit();
    onSubmitGuess(draft as Symbol[]);
    setDraft(Array(SLOTS).fill(null));
  };

  return (
    <div className="flex flex-col gap-3 md:gap-4 w-full max-w-md mx-auto">
      {/* Turn indicator + timer + guess counter */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span
            className="text-xs md:text-sm font-medium font-inter"
            style={{ color: isMyTurn ? 'hsl(var(--code-accent))' : 'hsl(var(--code-text-muted))' }}
          >
            {mySolved ? '✓ Solved!' : isMyTurn ? 'Your turn' : "Opponent's turn"}
          </span>
          <span
            className="text-[10px] md:text-xs font-mono px-1.5 py-0.5 rounded"
            style={{ background: 'hsl(var(--code-pill-bg))', color: 'hsl(var(--code-text-muted))' }}
          >
            {myGuesses.length}/{MAX_GUESSES}
          </span>
        </div>
        {isMyTurn && (
          <TurnTimer timeLeft={timeLeft} total={turnTimeSeconds} />
        )}
      </div>

      {/* Solved banner */}
      {mySolved && !isMyTurn && (
        <div
          className="flex items-center justify-center gap-2 py-3 rounded-lg"
          style={{
            background: 'hsl(var(--code-exact) / 0.1)',
            border: '1px solid hsl(var(--code-exact) / 0.25)',
          }}
        >
          <span className="text-base">✓</span>
          <span className="text-sm font-semibold font-inter" style={{ color: 'hsl(var(--code-exact))' }}>
            Code Cracked — waiting for opponent
          </span>
        </div>
      )}

      {/* Opponent thinking indicator */}
      {!isMyTurn && !mySolved && (
        <div
          className="flex items-center justify-center gap-2 py-2 rounded-lg"
          style={{ background: 'hsl(var(--code-pill-bg))' }}
        >
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{
                  background: 'hsl(var(--code-accent))',
                  animationDelay: `${i * 300}ms`,
                }}
              />
            ))}
          </div>
          <span className="text-xs font-inter" style={{ color: 'hsl(var(--code-text-muted))' }}>
            Opponent is thinking…
          </span>
          {opponentGuesses.length > 0 && (
            <span className="text-[10px] font-mono" style={{ color: 'hsl(var(--code-text-muted))' }}>
              ({opponentGuesses.length} guesses)
            </span>
          )}
        </div>
      )}

      {/* My guess history */}
      <div className="space-y-1.5 md:space-y-2">
        {myGuesses.map((entry, i) => (
          <div
            key={entry.id}
            className={`flex items-center gap-2 md:gap-3 animate-fade-in ${entry.isSolve ? 'ring-1 ring-[hsl(var(--code-success))] rounded-lg p-1' : ''}`}
          >
            <span className="w-4 md:w-5 text-right text-[10px] md:text-xs font-mono" style={{ color: 'hsl(var(--code-text-muted))' }}>
              {i + 1}.
            </span>
            <div className="flex gap-0.5 md:gap-1">
              {entry.guess.map((symbol, j) => (
                <SymbolSlot key={j} symbol={symbol} size="sm" disabled />
              ))}
            </div>
            <FeedbackPips exact={entry.exact} shifted={entry.shifted} animate={i === myGuesses.length - 1} />
          </div>
        ))}
      </div>

      {/* Draft area */}
      {isMyTurn && !mySolved && myGuesses.length < MAX_GUESSES && (
        <>
          <div className="flex gap-1.5 md:gap-2 justify-center">
            {draft.map((symbol, i) => (
              <SymbolSlot
                key={i}
                symbol={symbol}
                onClick={() => handleSlotClick(i)}
                size="md"
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 md:gap-2 justify-center">
            {symbolPool.map((symbol) => (
              <SymbolSlot
                key={symbol}
                symbol={symbol}
                onClick={() => handlePoolSelect(symbol)}
                disabled={usedInDraft.has(symbol)}
                size="sm"
              />
            ))}
          </div>

          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setDraft(Array(SLOTS).fill(null)); playSymbolRemove(); }}
              disabled={draft.every(s => s === null)}
              className="border-[hsl(var(--code-card-border))] text-[hsl(var(--code-text-secondary))]"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Clear
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!isFull}
              className="gap-1"
              style={{ background: 'hsl(var(--code-accent))', color: '#fff' }}
            >
              <Send className="w-4 h-4" />
              Submit
            </Button>
          </div>
        </>
      )}

      {/* Opponent progress */}
      {opponentGuesses.length > 0 && (
        <div
          className="mt-3 md:mt-4 p-2.5 md:p-3 rounded-xl"
          style={{
            background: 'hsl(var(--code-pill-bg))',
            border: '1px solid hsl(var(--code-card-border))',
          }}
        >
          <p className="text-[10px] md:text-xs font-medium mb-1.5 md:mb-2 font-inter" style={{ color: 'hsl(var(--code-text-muted))' }}>
            Opponent's guesses against your sequence:
          </p>
          <div className="space-y-1">
            {opponentGuesses.map((entry, i) => (
              <div key={entry.id} className="flex items-center gap-1.5 md:gap-2 animate-fade-in">
                <span className="w-3 md:w-4 text-right text-[9px] md:text-[10px] font-mono" style={{ color: 'hsl(var(--code-text-muted))' }}>
                  {i + 1}.
                </span>
                <div className="flex gap-0.5">
                  {entry.guess.map((symbol, j) => (
                    <SymbolSlot key={j} symbol={symbol} size="sm" disabled />
                  ))}
                </div>
                <FeedbackPips exact={entry.exact} shifted={entry.shifted} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
