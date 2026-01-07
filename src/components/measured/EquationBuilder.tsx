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
    <div className="bg-measured-card border border-measured-card-border rounded-2xl p-5 md:p-6 shadow-sm">
      <h3 className="text-[11px] font-semibold text-measured-text-muted uppercase tracking-widest mb-4">
        Build the equation
      </h3>

      <div className="flex items-center justify-center gap-1.5 md:gap-2 flex-wrap">
        {SLOT_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-1.5 md:gap-2">
            <button
              onClick={() => slots[label] !== null ? onSlotClear(label) : onSlotFocus(label)}
              className={cn(
                "relative w-[60px] h-[60px] md:w-16 md:h-16 rounded-xl border-2 transition-all duration-200 flex items-center justify-center text-xl md:text-2xl font-bold",
                slots[label] !== null
                  ? "bg-measured-accent/10 border-measured-accent text-measured-accent scale-100"
                  : focusedSlot === label
                    ? "bg-measured-tile-bg border-measured-accent ring-2 ring-measured-accent/30"
                    : "bg-measured-tile-bg border-measured-tile-border text-measured-text-muted hover:border-measured-text-muted/50"
              )}
              style={{
                animation: focusedSlot === label && slots[label] === null ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : undefined
              }}
            >
              {slots[label] !== null ? (
                <>
                  {slots[label]}
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-measured-text-muted rounded-full flex items-center justify-center shadow-sm">
                    <X className="w-3 h-3 text-measured-card" />
                  </span>
                </>
              ) : (
                <span className="text-sm opacity-40 font-medium">{label}</span>
              )}
            </button>
            {i < OPERATORS.length && (
              <span className="text-xl md:text-2xl font-medium text-measured-text-secondary w-6 md:w-7 text-center">
                {OPERATORS[i]}
              </span>
            )}
          </div>
        ))}
        <span className="text-xl md:text-2xl font-medium text-measured-text-secondary mx-2 md:mx-3">=</span>
        <div className={cn(
          "min-w-[72px] md:min-w-20 h-[60px] md:h-16 px-4 rounded-xl flex items-center justify-center text-xl md:text-2xl font-bold transition-all duration-200",
          result !== null
            ? "bg-measured-accent/20 text-measured-accent"
            : "bg-measured-tile-bg text-measured-text-muted"
        )}>
          {result !== null ? result.toLocaleString() : '?'}
        </div>
      </div>

      <p className="text-center text-xs text-measured-text-muted mt-4 opacity-70">
        Tap a slot to select, then tap a tile
      </p>
    </div>
  );
}
