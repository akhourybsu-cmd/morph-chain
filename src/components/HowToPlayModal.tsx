import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HintTile } from "./HintTile";

interface HowToPlayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const HowToPlayModal = ({ open, onOpenChange }: HowToPlayModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>How to Play</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Modern English Policy */}
          <section className="bg-primary/10 border border-primary/30 rounded-lg p-3">
            <p className="text-sm font-medium text-foreground">
              Morph Chain uses <strong>standard, modern American English</strong>—no archaic, dialect, proper-noun, brand, texting, or highly technical words. If a word wouldn't appear in a contemporary general-audience newspaper or dictionary entry, it won't appear here.
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Goal</h3>
            <p className="text-muted-foreground">
              Turn the START word into the GOAL word.
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">How</h3>
            <p className="text-muted-foreground mb-2">
              <strong>4-Letter:</strong> Change exactly <strong>one letter</strong> each step.
            </p>
            <p className="text-muted-foreground mb-2">
              <strong>5-Letter:</strong> Change <strong>one OR two letters</strong> on your <strong>first move only</strong>, then one letter per step.
            </p>
            <p className="text-muted-foreground mb-2">
              <strong>6-Letter:</strong> Change <strong>one OR two letters</strong> on <strong>any move</strong>.
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Every step must be a real word.
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Rules</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>No repeats:</strong> You can't use the same word twice</li>
              <li><strong>Moves limit:</strong> You have up to 14 moves (varies by puzzle difficulty)</li>
              <li><strong>Daily choice:</strong> Play today's 4-letter, 5-letter, or 6-letter puzzle (or all three!)</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Hints</h3>
            <p className="text-muted-foreground mb-3">
              After each valid step, tiles show how your current word compares to the GOAL:
            </p>
            <div className="space-y-2 bg-card p-3 rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <HintTile state="match" letter="A" colorblindMode={false} />
                <span className="text-muted-foreground">Letter is correct and in the right spot</span>
              </div>
              <div className="flex items-center gap-3">
                <HintTile state="present" letter="B" colorblindMode={false} />
                <span className="text-muted-foreground">Letter is in GOAL but a different spot</span>
              </div>
              <div className="flex items-center gap-3">
                <HintTile state="miss" letter="C" colorblindMode={false} />
                <span className="text-muted-foreground">Letter isn't in GOAL</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Distance Indicators</h3>
            <div className="space-y-2 bg-card p-3 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-success/10 text-success rounded text-xs font-medium">
                  ↑ Closer
                </div>
                <span className="text-muted-foreground text-xs">Your step moved you nearer to the GOAL</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-warning/10 text-warning rounded text-xs font-medium">
                  ↔ Sideways
                </div>
                <span className="text-muted-foreground text-xs">Same distance from GOAL</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-destructive/10 text-destructive rounded text-xs font-medium">
                  ↓ Worse
                </div>
                <span className="text-muted-foreground text-xs">You moved farther from GOAL</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Winning</h3>
            <p className="text-muted-foreground">
              <strong>Win:</strong> Reach the GOAL within the move limit.
            </p>
            <p className="text-muted-foreground">
              <strong>Share:</strong> Copy your spoiler-free emoji grid to share with friends.
            </p>
            <p className="text-muted-foreground">
              <strong>Streaks:</strong> Build streaks by winning at least one puzzle each day.
            </p>
          </section>

          <section className="pt-2 border-t border-border">
            <h3 className="font-semibold mb-2">Example</h3>
            <div className="bg-muted/30 p-3 rounded text-xs font-mono space-y-1">
              <div>START: <strong>COLD</strong></div>
              <div>Step 1: COLD → CORD (change L to R)</div>
              <div>Step 2: CORD → WORD (change C to W)</div>
              <div>Step 3: WORD → WARM (change D to M)</div>
              <div>GOAL: <strong>WARM</strong> ✓</div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};
