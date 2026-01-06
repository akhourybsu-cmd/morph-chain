import { X } from 'lucide-react';
import { SlotValues } from '@/lib/measured/gameLogic';
import { cn } from '@/lib/utils';

interface EquationBuilderProps {
  slots: SlotValues;
  result: number | null;
  focusedSlot: 'A' | 'B' | 'C' | 'D' | null;
  onSlotFocus: (slot: 'A' | 'B' | 'C' | 'D') => void;
  onSlotClear: (slot: 'A' | 'B' | 'C' | 'D') => void;
}

const SLOT_LABELS: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
const OPERATORS = ['×', '+', '−'];

export function EquationBuilder({
  slots,
  result,
  focusedSlot,
  onSlotFocus,
  onSlotClear,
}: EquationBuilderProps) {
  return (
    <div className="bg-measured-card border border-measured-card-border rounded-2xl p-5">
      <h3 className="text-xs font-medium text-measured-text-muted uppercase tracking-wider mb-4">
        Build the equation
      </h3>

      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {SLOT_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-1.5">
            <button
              onClick={() => slots[label] !== null ? onSlotClear(label) : onSlotFocus(label)}
              className={cn(
                "relative w-14 h-14 rounded-xl border-2 transition-all flex items-center justify-center text-xl font-bold",
                slots[label] !== null
                  ? "bg-measured-accent/10 border-measured-accent text-measured-accent"
                  : focusedSlot === label
                    ? "bg-measured-tile-bg border-measured-accent animate-pulse"
                    : "bg-measured-tile-bg border-measured-tile-border text-measured-text-muted"
              )}
            >
              {slots[label] !== null ? (
                <>
                  {slots[label]}
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-measured-text-muted rounded-full flex items-center justify-center">
                    <X className="w-2.5 h-2.5 text-measured-card" />
                  </span>
                </>
              ) : (
                <span className="text-sm opacity-50">{label}</span>
              )}
            </button>
            {i < OPERATORS.length && (
              <span className="text-xl font-medium text-measured-text-secondary w-6 text-center">
                {OPERATORS[i]}
              </span>
            )}
          </div>
        ))}
        <span className="text-xl font-medium text-measured-text-secondary mx-2">=</span>
        <div className={cn(
          "min-w-16 h-14 px-3 rounded-xl flex items-center justify-center text-xl font-bold",
          result !== null
            ? "bg-measured-accent/20 text-measured-accent"
            : "bg-measured-tile-bg text-measured-text-muted"
        )}>
          {result !== null ? result : '?'}
        </div>
      </div>

      <p className="text-center text-xs text-measured-text-muted mt-4">
        Tap a slot to select, then tap a tile to place
      </p>
    </div>
  );
}
