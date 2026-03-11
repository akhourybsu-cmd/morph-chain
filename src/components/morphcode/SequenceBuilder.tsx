import { useState } from 'react';
import { Symbol, SLOTS } from '@/lib/morphcode/types';
import { SymbolSlot } from './SymbolSlot';
import { Button } from '@/components/ui/button';
import { Lock, RotateCcw } from 'lucide-react';

interface SequenceBuilderProps {
  symbolPool: Symbol[];
  onLock: (sequence: Symbol[]) => void;
  locked: boolean;
}

export const SequenceBuilder = ({ symbolPool, onLock, locked }: SequenceBuilderProps) => {
  const [slots, setSlots] = useState<(Symbol | null)[]>(Array(SLOTS).fill(null));

  const usedSymbols = new Set(slots.filter(Boolean) as Symbol[]);
  const isFull = slots.every(s => s !== null);

  const handlePoolSelect = (symbol: Symbol) => {
    if (locked || usedSymbols.has(symbol)) return;
    const emptyIdx = slots.findIndex(s => s === null);
    if (emptyIdx !== -1) {
      const newSlots = [...slots];
      newSlots[emptyIdx] = symbol;
      setSlots(newSlots);
    }
  };

  const handleSlotClick = (index: number) => {
    if (locked) return;
    const newSlots = [...slots];
    newSlots[index] = null;
    setSlots(newSlots);
  };

  const handleReset = () => {
    if (locked) return;
    setSlots(Array(SLOTS).fill(null));
  };

  const handleLock = () => {
    if (!isFull || locked) return;
    onLock(slots as Symbol[]);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h3
          className="font-playfair text-lg font-semibold mb-1"
          style={{ color: 'hsl(var(--code-text-primary))' }}
        >
          Build Your Sequence
        </h3>
        <p
          className="text-sm font-inter"
          style={{ color: 'hsl(var(--code-text-secondary))' }}
        >
          {locked ? 'Sequence locked! Waiting for opponent...' : 'Tap symbols to fill 4 slots. No duplicates.'}
        </p>
      </div>

      {/* Sequence slots */}
      <div className="flex gap-2">
        {slots.map((symbol, i) => (
          <SymbolSlot
            key={i}
            symbol={symbol}
            onClick={() => handleSlotClick(i)}
            disabled={locked}
            size="lg"
          />
        ))}
      </div>

      {/* Symbol pool */}
      {!locked && (
        <div className="flex flex-wrap gap-2 justify-center max-w-xs">
          {symbolPool.map((symbol) => (
            <SymbolSlot
              key={symbol}
              symbol={symbol}
              onClick={() => handlePoolSelect(symbol)}
              disabled={usedSymbols.has(symbol)}
              size="md"
              showLabel
            />
          ))}
        </div>
      )}

      {/* Actions */}
      {!locked && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={slots.every(s => s === null)}
            className="border-[hsl(var(--code-card-border))] text-[hsl(var(--code-text-secondary))]"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={handleLock}
            disabled={!isFull}
            className="gap-1"
            style={{ background: 'hsl(var(--code-accent))', color: '#fff' }}
          >
            <Lock className="w-4 h-4" />
            Lock Sequence
          </Button>
        </div>
      )}

      {locked && (
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-inter"
          style={{
            background: 'hsl(var(--code-accent) / 0.1)',
            color: 'hsl(var(--code-accent))',
          }}
        >
          <Lock className="w-3 h-3" />
          Locked
        </div>
      )}
    </div>
  );
};
