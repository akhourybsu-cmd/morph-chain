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
            <h3 className="font-semibold mb-2">How It Works</h3>
            <p className="text-muted-foreground mb-3">
              Transform the START word into the GOAL word by changing letters one step at a time. Each intermediate word must be a valid English word from our dictionary.
            </p>
            
            <div className="space-y-3">
              <div className="bg-card p-3 rounded-lg border border-border">
                <p className="font-medium text-sm mb-1">4-Letter Words:</p>
                <p className="text-muted-foreground text-sm">
                  Change <strong>exactly one letter</strong> per move. For example: LAKE → MAKE → MARE → CARE → CART
                </p>
              </div>
              
              <div className="bg-card p-3 rounded-lg border border-border">
                <p className="font-medium text-sm mb-1">5-Letter Words (Combo Swap):</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-base">✏️</span>
                    <p className="text-muted-foreground text-sm">Change <strong>one letter per move</strong> to form a valid English word.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-base">🔄</span>
                    <p className="text-muted-foreground text-sm">Every <strong>three correct morphs</strong> in a row, you earn a <strong>Double Swap</strong> — a chance to change two letters at once.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-base">💔</span>
                    <p className="text-muted-foreground text-sm"><strong>Invalid or repeated words</strong> break your combo.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-base">🚫</span>
                    <p className="text-muted-foreground text-sm">No repeats. All words must be valid modern U.S. English.</p>
                  </div>
                </div>
              </div>
              
            </div>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Important Rules</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                <strong>No Repeating Words:</strong> Once you use a word in your chain, you cannot use it again in the same puzzle.
              </li>
              <li>
                <strong>Move Limit:</strong> Each puzzle has a maximum number of moves (typically 10-14 depending on difficulty). Plan your path carefully!
              </li>
              <li>
                <strong>Valid Words Only:</strong> All words must be from our curated dictionary of modern American English—no proper nouns, abbreviations, slang, or archaic terms.
              </li>
              <li>
                <strong>Daily Puzzles:</strong> Morph Chain now focuses on 4-letter and 5-letter puzzle formats for the best balance of challenge and playability.
              </li>
              <li>
                <strong>Letter Position Matters:</strong> You must change specific letter positions while keeping others the same. Simply rearranging (anagramming) doesn't count.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Letter Feedback (Hints)</h3>
            <p className="text-muted-foreground mb-3">
              After each valid move, the tiles change color to show how your current word compares to the GOAL word. This feedback helps you plan your next moves:
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
            <h3 className="font-semibold mb-2">Distance Progress Indicators</h3>
            <p className="text-muted-foreground mb-2 text-sm">
              Each move shows whether you're getting closer to or farther from the goal word. Use these indicators to guide your strategy:
            </p>
            <div className="space-y-2 bg-card p-3 rounded-lg border border-border">
              <div className="flex items-start gap-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-success/10 text-success rounded text-xs font-medium whitespace-nowrap">
                  ↑ Closer
                </div>
                <span className="text-muted-foreground text-xs">Your move decreased the minimum number of steps needed to reach the GOAL. You're on the right track!</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-warning/10 text-warning rounded text-xs font-medium whitespace-nowrap">
                  ↔ Sideways
                </div>
                <span className="text-muted-foreground text-xs">The distance to the GOAL stayed the same. You're exploring alternative paths but not progressing directly.</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-destructive/10 text-destructive rounded text-xs font-medium whitespace-nowrap">
                  ↓ Worse
                </div>
                <span className="text-muted-foreground text-xs">Your move increased the distance to the GOAL. Sometimes necessary for complex puzzles, but use sparingly.</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Winning & Sharing</h3>
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">
                <strong>Victory Condition:</strong> Successfully transform the START word into the GOAL word within the allowed number of moves. The fewer moves you use, the better!
              </p>
              <p className="text-muted-foreground text-sm">
                <strong>Share Your Results:</strong> After completing a puzzle, you can copy a spoiler-free emoji grid showing your path's efficiency without revealing the actual words. Perfect for comparing strategies with friends!
              </p>
              <p className="text-muted-foreground text-sm">
                <strong>Build Your Streak:</strong> Win at least one puzzle (any word length) each day to maintain and grow your streak. Streaks reset at midnight Eastern Time.
              </p>
            </div>
          </section>

          <section className="pt-2 border-t border-border">
            <h3 className="font-semibold mb-2">Example</h3>
            <div className="bg-muted/30 p-3 rounded text-xs font-mono space-y-1">
              <div>START: <strong>LAKE</strong></div>
              <div>Step 1: LAKE → MAKE (change L to M)</div>
              <div>Step 2: MAKE → MARE (change K to R)</div>
              <div>Step 3: MARE → CARE (change M to C)</div>
              <div>GOAL: <strong>CART</strong> ✓</div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};
