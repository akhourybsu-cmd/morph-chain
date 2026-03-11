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
        className="sm:max-w-md max-h-[85vh] overflow-y-auto"
        style={{
          background: 'hsl(var(--card))',
          borderColor: 'hsl(var(--border))',
        }}
      >
        <DialogHeader>
          <DialogTitle className="font-serif text-xl" style={{ color: 'hsl(var(--foreground))' }}>
            How to Play
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          {/* Overview */}
          <section>
            <h3 className="font-semibold mb-2" style={{ color: 'hsl(var(--foreground))' }}>
              Objective
            </h3>
            <p style={{ color: 'hsl(var(--muted-foreground))' }}>
              Crack your opponent's hidden 4-symbol sequence before they crack yours. 
              The player who solves in fewer guesses wins the round. First to 2 rounds wins the match.
            </p>
          </section>

          {/* Symbols */}
          <section>
            <h3 className="font-semibold mb-2" style={{ color: 'hsl(var(--foreground))' }}>
              The Symbols
            </h3>
            <div className="flex flex-wrap gap-2">
              {ALL_SYMBOLS.map((s) => (
                <div key={s} className="flex items-center gap-1.5">
                  <SymbolSlot symbol={s} size="sm" disabled />
                  <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {SYMBOL_DISPLAY[s].label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Setup */}
          <section>
            <h3 className="font-semibold mb-2" style={{ color: 'hsl(var(--foreground))' }}>
              Setup Phase
            </h3>
            <ul className="space-y-1.5 ml-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <li className="flex items-start gap-2">
                <span style={{ color: 'hsl(280, 70%, 55%)' }}>•</span>
                Both players secretly build a 4-symbol sequence
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'hsl(280, 70%, 55%)' }}>•</span>
                No duplicate symbols allowed
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'hsl(280, 70%, 55%)' }}>•</span>
                Once locked, it cannot be changed
              </li>
            </ul>
          </section>

          {/* Guessing */}
          <section>
            <h3 className="font-semibold mb-2" style={{ color: 'hsl(var(--foreground))' }}>
              Guessing Phase
            </h3>
            <p className="mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Players alternate turns. Each turn you submit a 4-symbol guess. After each guess you receive feedback:
            </p>
            <div 
              className="space-y-2 p-3 rounded-lg"
              style={{ background: 'hsl(var(--muted) / 0.3)', border: '1px solid hsl(var(--border))' }}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg" style={{ color: 'hsl(145, 70%, 45%)' }}>⬤</span>
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <strong>Exact</strong> — Right symbol, right slot
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg" style={{ color: 'hsl(45, 90%, 50%)' }}>◐</span>
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>
                  <strong>Shifted</strong> — Right symbol, wrong slot
                </span>
              </div>
            </div>
          </section>

          {/* Winning */}
          <section>
            <h3 className="font-semibold mb-2" style={{ color: 'hsl(var(--foreground))' }}>
              Winning a Round
            </h3>
            <ul className="space-y-1.5 ml-4" style={{ color: 'hsl(var(--muted-foreground))' }}>
              <li className="flex items-start gap-2">
                <span style={{ color: 'hsl(280, 70%, 55%)' }}>•</span>
                Solve in fewer guesses than your opponent
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'hsl(280, 70%, 55%)' }}>•</span>
                If tied on guesses, faster thinking time wins
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'hsl(280, 70%, 55%)' }}>•</span>
                Max 8 guesses per round
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'hsl(280, 70%, 55%)' }}>•</span>
                90 seconds per turn in live mode
              </li>
            </ul>
          </section>

          {/* Example */}
          <section 
            className="pt-3"
            style={{ borderTop: '1px solid hsl(var(--border))' }}
          >
            <h3 className="font-semibold mb-2" style={{ color: 'hsl(var(--foreground))' }}>
              Example
            </h3>
            <div 
              className="p-3 rounded-lg text-xs space-y-1"
              style={{ background: 'hsl(var(--muted) / 0.3)', color: 'hsl(var(--muted-foreground))' }}
            >
              <div>Hidden: ● ▲ 👁 〰</div>
              <div>Guess:  ● 〰 ◆ 👁</div>
              <div className="mt-1 font-bold">
                Result: <span style={{ color: 'hsl(145, 70%, 45%)' }}>1 Exact</span>, <span style={{ color: 'hsl(45, 90%, 50%)' }}>2 Shifted</span>
              </div>
              <div className="text-[10px] mt-1 opacity-70">
                (● is exact, 〰 and 👁 are shifted, ◆ is wrong)
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};
