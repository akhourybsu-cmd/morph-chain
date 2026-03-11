import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SYMBOL_DISPLAY, ALL_SYMBOLS } from '@/lib/morphcode/types';
import { SymbolSlot } from './SymbolSlot';

interface MorphcodeHowToPlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MorphcodeHowToPlay = ({ open, onOpenChange }: MorphcodeHowToPlayProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md max-h-[85vh] overflow-y-auto bg-[hsl(var(--code-card-bg))] border-[hsl(var(--code-card-border))]"
        style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
      >
        <DialogHeader>
          <DialogTitle className="font-playfair text-xl text-[hsl(var(--code-text-primary))]">
            How to Play
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 text-sm font-inter">
          <section>
            <h3 className="font-semibold mb-2 text-[hsl(var(--code-text-primary))]">Objective</h3>
            <p className="text-[hsl(var(--code-text-secondary))]">
              Crack your opponent's hidden 4-symbol sequence before they crack yours.
              The player who solves in fewer guesses wins the round. First to 2 rounds wins the match.
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-2 text-[hsl(var(--code-text-primary))]">The Symbols</h3>
            <div className="flex flex-wrap gap-2">
              {ALL_SYMBOLS.map((s) => (
                <div key={s} className="flex items-center gap-1.5">
                  <SymbolSlot symbol={s} size="sm" disabled />
                  <span className="text-xs text-[hsl(var(--code-text-muted))]">
                    {SYMBOL_DISPLAY[s].label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="font-semibold mb-2 text-[hsl(var(--code-text-primary))]">Setup Phase</h3>
            <ul className="space-y-1.5 ml-4 text-[hsl(var(--code-text-secondary))]">
              <li className="flex items-start gap-2">
                <span className="text-[hsl(var(--code-accent))]">•</span>
                Both players secretly build a 4-symbol sequence
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[hsl(var(--code-accent))]">•</span>
                No duplicate symbols allowed
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[hsl(var(--code-accent))]">•</span>
                Once locked, it cannot be changed
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold mb-2 text-[hsl(var(--code-text-primary))]">Guessing Phase</h3>
            <p className="mb-2 text-[hsl(var(--code-text-secondary))]">
              Players alternate turns. Each turn you submit a 4-symbol guess. After each guess you receive feedback:
            </p>
            <div
              className="space-y-2 p-3 rounded-lg bg-[hsl(var(--code-pill-bg))] border border-[hsl(var(--code-card-border))]"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg" style={{ color: 'hsl(var(--code-exact))' }}>⬤</span>
                <span className="text-[hsl(var(--code-text-secondary))]">
                  <strong>Exact</strong> — Right symbol, right slot
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg" style={{ color: 'hsl(var(--code-shifted))' }}>◐</span>
                <span className="text-[hsl(var(--code-text-secondary))]">
                  <strong>Shifted</strong> — Right symbol, wrong slot
                </span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold mb-2 text-[hsl(var(--code-text-primary))]">Winning</h3>
            <ul className="space-y-1.5 ml-4 text-[hsl(var(--code-text-secondary))]">
              <li className="flex items-start gap-2">
                <span className="text-[hsl(var(--code-accent))]">•</span>
                Solve in fewer guesses than your opponent
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[hsl(var(--code-accent))]">•</span>
                If tied on guesses, faster thinking time wins
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[hsl(var(--code-accent))]">•</span>
                Max 8 guesses per round • 90s per turn
              </li>
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};
