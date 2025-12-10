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
      <DialogContent 
        className="sm:max-w-md max-h-[85vh] overflow-y-auto"
        style={{
          background: 'hsl(var(--chain-card-bg))',
          borderColor: 'hsl(var(--chain-card-border))',
        }}
      >
        <DialogHeader>
          <DialogTitle 
            className="font-serif text-xl"
            style={{ color: 'hsl(var(--chain-text-primary))' }}
          >
            How to Play
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          {/* Goal */}
          <section>
            <h3 
              className="font-semibold mb-2"
              style={{ color: 'hsl(var(--chain-text-primary))' }}
            >
              Goal
            </h3>
            <p style={{ color: 'hsl(var(--chain-text-secondary))' }}>
              Transform the START word into the GOAL word by changing one letter at a time. Each step must be a valid word.
            </p>
          </section>

          {/* Rules */}
          <section>
            <h3 
              className="font-semibold mb-2"
              style={{ color: 'hsl(var(--chain-text-primary))' }}
            >
              Rules
            </h3>
            <ul 
              className="space-y-1.5 ml-4"
              style={{ color: 'hsl(var(--chain-text-secondary))' }}
            >
              <li className="flex items-start gap-2">
                <span style={{ color: 'hsl(var(--chain-accent))' }}>•</span>
                Change exactly one letter per move
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'hsl(var(--chain-accent))' }}>•</span>
                No word can be used twice
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'hsl(var(--chain-accent))' }}>•</span>
                Reach the goal within the move limit
              </li>
            </ul>
          </section>

          {/* Hints */}
          <section>
            <h3 
              className="font-semibold mb-2"
              style={{ color: 'hsl(var(--chain-text-primary))' }}
            >
              Letter Hints
            </h3>
            <p 
              className="mb-3"
              style={{ color: 'hsl(var(--chain-text-secondary))' }}
            >
              After each move, tiles show how your word compares to the GOAL:
            </p>
            <div 
              className="space-y-2 p-3 rounded-lg"
              style={{ 
                background: 'hsl(var(--chain-divider))',
                border: '1px solid hsl(var(--chain-card-border))'
              }}
            >
              <div className="flex items-center gap-3">
                <HintTile state="match" letter="A" colorblindMode={false} />
                <span style={{ color: 'hsl(var(--chain-text-secondary))' }}>Correct position</span>
              </div>
              <div className="flex items-center gap-3">
                <HintTile state="present" letter="B" colorblindMode={false} />
                <span style={{ color: 'hsl(var(--chain-text-secondary))' }}>In goal, wrong spot</span>
              </div>
              <div className="flex items-center gap-3">
                <HintTile state="miss" letter="C" colorblindMode={false} />
                <span style={{ color: 'hsl(var(--chain-text-secondary))' }}>Not in goal</span>
              </div>
            </div>
          </section>

          {/* Example */}
          <section 
            className="pt-3"
            style={{ borderTop: '1px solid hsl(var(--chain-divider))' }}
          >
            <h3 
              className="font-semibold mb-2"
              style={{ color: 'hsl(var(--chain-text-primary))' }}
            >
              Example
            </h3>
            <div 
              className="p-3 rounded-lg text-xs font-mono space-y-1"
              style={{ 
                background: 'hsl(var(--chain-divider))',
                color: 'hsl(var(--chain-text-secondary))'
              }}
            >
              <div>COLD → CORD → CARD → WARD → WARM</div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};
