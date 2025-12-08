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
              Morph Chain uses <strong>standard, modern American English</strong>—no archaic, dialect, proper-noun, brand, texting, or highly technical words.
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Goal</h3>
            <p className="text-muted-foreground">
              You're given a START word and a GOAL word (both shown). Your job is to transform the start into the goal by changing one letter at a time. Every step must be a valid English word, and you must reach the goal within the move limit.
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">How It Works</h3>
            <p className="text-muted-foreground mb-3">
              Both the START and GOAL words are visible from the beginning. Transform the START word into the GOAL word by changing <strong>exactly one letter</strong> per move. Each intermediate word must be a valid English word from our dictionary.
            </p>
            
            <div className="bg-card p-3 rounded-lg border border-border">
              <p className="font-medium text-sm mb-2">The Rule:</p>
              <p className="text-muted-foreground text-sm">
                Change <strong>exactly one letter</strong> per move. For example: COLD → CORD → CARD → WARD → WARM
              </p>
            </div>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Important Rules</h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                <strong>No Repeating Words:</strong> Once you use a word in your chain, you cannot use it again.
              </li>
              <li>
                <strong>Move Limit:</strong> Each puzzle has a maximum number of moves (typically 10-14). Plan your path carefully!
              </li>
              <li>
                <strong>Valid Words Only:</strong> All words must be from our curated dictionary of modern American English.
              </li>
              <li>
                <strong>Daily Puzzles:</strong> One puzzle per day for 4-letter and 5-letter words.
              </li>
              <li>
                <strong>Letter Position Matters:</strong> You must change specific letter positions while keeping others the same.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Letter Feedback (Hints)</h3>
            <p className="text-muted-foreground mb-3">
              After each valid move, the tiles change color to show how your current word compares to the visible GOAL word:
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
              Each move shows whether you're getting closer to or farther from the goal word:
            </p>
            <div className="space-y-2 bg-card p-3 rounded-lg border border-border">
              <div className="flex items-start gap-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-success/10 text-success rounded text-xs font-medium whitespace-nowrap">
                  ↑ Closer
                </div>
                <span className="text-muted-foreground text-xs">Your move decreased the distance to the GOAL. You're on the right track!</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-warning/10 text-warning rounded text-xs font-medium whitespace-nowrap">
                  ↔ Sideways
                </div>
                <span className="text-muted-foreground text-xs">The distance to the GOAL stayed the same. You're exploring alternative paths.</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-destructive/10 text-destructive rounded text-xs font-medium whitespace-nowrap">
                  ↓ Worse
                </div>
                <span className="text-muted-foreground text-xs">Your move increased the distance. Sometimes necessary for complex puzzles.</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Hard Mode</h3>
            <p className="text-muted-foreground text-sm">
              When Hard Mode is enabled, every move must get you <strong>closer</strong> to the goal word. Sideways and worse moves are rejected.
            </p>
          </section>

          <section>
            <h3 className="font-semibold mb-2">Winning & Sharing</h3>
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">
                <strong>Victory:</strong> Reach the GOAL word within the move limit.
              </p>
              <p className="text-muted-foreground text-sm">
                <strong>Share:</strong> Copy a spoiler-free emoji grid showing your path's efficiency.
              </p>
              <p className="text-muted-foreground text-sm">
                <strong>Streak:</strong> Win at least one puzzle each day to maintain your streak.
              </p>
            </div>
          </section>

          <section className="pt-2 border-t border-border">
            <h3 className="font-semibold mb-2">Example</h3>
            <div className="bg-muted/30 p-3 rounded text-xs font-mono space-y-1">
              <div>START: <strong>COLD</strong> → GOAL: <strong>WARM</strong></div>
              <div>Step 1: COLD → CORD (change L to R)</div>
              <div>Step 2: CORD → CARD (change O to A)</div>
              <div>Step 3: CARD → WARD (change C to W)</div>
              <div>Step 4: WARD → WARM (change D to M) ✓</div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};
