import { useState, useEffect } from 'react';
import { Symbol, SLOTS, GuessEntry, MAX_GUESSES, SYMBOL_DISPLAY } from '@/lib/morphcode/types';
import { SymbolSlot } from './SymbolSlot';
import { Button } from '@/components/ui/button';
import { Send, RotateCcw } from 'lucide-react';

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
  symbolPool,
  myGuesses,
  opponentGuesses,
  isMyTurn,
  onSubmitGuess,
  mySolved,
  opponentSolved,
  turnTimeSeconds,
  turnStartedAt,
}: GuessBoardProps) => {
  const [draft, setDraft] = useState<(Symbol | null)[]>(Array(SLOTS).fill(null));
  const [timeLeft, setTimeLeft] = useState(turnTimeSeconds);

  const usedInDraft = new Set(draft.filter(Boolean) as Symbol[]);
  const isFull = draft.every(s => s !== null);

  // Timer
  useEffect(() => {
    if (!isMyTurn || !turnStartedAt) return;
    
    const interval = setInterval(() => {
      const elapsed = (Date.now() - new Date(turnStartedAt).getTime()) / 1000;
      const remaining = Math.max(0, turnTimeSeconds - elapsed);
      setTimeLeft(Math.ceil(remaining));
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
    }
  };

  const handleSlotClick = (index: number) => {
    if (!isMyTurn) return;
    const newDraft = [...draft];
    newDraft[index] = null;
    setDraft(newDraft);
  };

  const handleSubmit = () => {
    if (!isFull || !isMyTurn) return;
    onSubmitGuess(draft as Symbol[]);
    setDraft(Array(SLOTS).fill(null));
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
      {/* Turn indicator + timer */}
      <div className="flex items-center justify-between px-2">
        <span 
          className="text-sm font-medium"
          style={{ color: isMyTurn ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}
        >
          {mySolved ? '✓ Solved!' : isMyTurn ? 'Your turn' : "Opponent's turn"}
        </span>
        {isMyTurn && (
          <span 
            className="text-sm font-mono font-bold px-3 py-1 rounded-full"
            style={{ 
              background: timeLeft <= 10 ? 'hsl(0, 80%, 50%)' : 'hsl(var(--muted))',
              color: timeLeft <= 10 ? '#fff' : 'hsl(var(--foreground))',
            }}
          >
            {timeLeft}s
          </span>
        )}
      </div>

      {/* My guess history */}
      <div className="space-y-2">
        {myGuesses.map((entry, i) => (
          <div key={entry.id} className="flex items-center gap-3">
            <span className="w-5 text-right text-xs font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {i + 1}.
            </span>
            <div className="flex gap-1">
              {entry.guess.map((symbol, j) => (
                <SymbolSlot key={j} symbol={symbol} size="sm" disabled />
              ))}
            </div>
            <div className="flex gap-2 text-xs font-bold">
              <span style={{ color: 'hsl(145, 70%, 45%)' }}>
                {entry.exact}⬤
              </span>
              <span style={{ color: 'hsl(45, 90%, 50%)' }}>
                {entry.shifted}◐
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Draft area */}
      {isMyTurn && !mySolved && myGuesses.length < MAX_GUESSES && (
        <>
          <div className="flex gap-2 justify-center">
            {draft.map((symbol, i) => (
              <SymbolSlot
                key={i}
                symbol={symbol}
                onClick={() => handleSlotClick(i)}
                size="md"
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {symbolPool.map((symbol) => (
              <SymbolSlot
                key={symbol}
                symbol={symbol}
                onClick={() => handlePoolSelect(symbol)}
                disabled={usedInDraft.has(symbol)}
                size="sm"
                showLabel
              />
            ))}
          </div>

          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDraft(Array(SLOTS).fill(null))}
              disabled={draft.every(s => s === null)}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Clear
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!isFull}
              className="gap-1"
            >
              <Send className="w-4 h-4" />
              Submit Guess
            </Button>
          </div>
        </>
      )}

      {/* Opponent progress (compact) */}
      {opponentGuesses.length > 0 && (
        <div 
          className="mt-4 p-3 rounded-xl"
          style={{ 
            background: 'hsl(var(--muted) / 0.3)',
            border: '1px solid hsl(var(--border))',
          }}
        >
          <p className="text-xs font-medium mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Opponent's guesses against your sequence:
          </p>
          <div className="space-y-1">
            {opponentGuesses.map((entry, i) => (
              <div key={entry.id} className="flex items-center gap-2">
                <span className="w-4 text-right text-[10px] font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>
                  {i + 1}.
                </span>
                <div className="flex gap-0.5">
                  {entry.guess.map((symbol, j) => (
                    <SymbolSlot key={j} symbol={symbol} size="sm" disabled />
                  ))}
                </div>
                <span className="text-[10px]" style={{ color: 'hsl(145, 70%, 45%)' }}>
                  {entry.exact}⬤
                </span>
                <span className="text-[10px]" style={{ color: 'hsl(45, 90%, 50%)' }}>
                  {entry.shifted}◐
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
