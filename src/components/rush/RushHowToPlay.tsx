import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RushHowToPlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RushHowToPlay = ({ open, onOpenChange }: RushHowToPlayProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-md max-h-[85vh] overflow-y-auto"
        style={{
          background: 'hsl(var(--rush-card-bg))',
          borderColor: 'hsl(var(--rush-card-border))',
        }}
      >
        <DialogHeader>
          <DialogTitle 
            className="font-serif text-xl"
            style={{ color: 'hsl(var(--rush-text-primary))' }}
          >
            How to Play
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 text-sm">
          {/* Goal */}
          <section>
            <h3 
              className="font-semibold mb-2"
              style={{ color: 'hsl(var(--rush-text-primary))' }}
            >
              Goal
            </h3>
            <p style={{ color: 'hsl(var(--rush-text-secondary))' }}>
              Score points by chaining 4-letter words in 2 minutes. Each word must differ by exactly one letter from the previous.
            </p>
          </section>

          {/* How to Play */}
          <section>
            <h3 
              className="font-semibold mb-2"
              style={{ color: 'hsl(var(--rush-text-primary))' }}
            >
              How to Play
            </h3>
            <ul 
              className="space-y-1.5 ml-4"
              style={{ color: 'hsl(var(--rush-text-secondary))' }}
            >
              <li className="flex items-start gap-2">
                <span style={{ color: 'hsl(var(--rush-accent))' }}>•</span>
                Tap a letter tile to select it
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'hsl(var(--rush-accent))' }}>•</span>
                Tap a position in the word to place it
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'hsl(var(--rush-accent))' }}>•</span>
                Words can't repeat within a run
              </li>
            </ul>
          </section>

          {/* Scoring */}
          <section>
            <h3 
              className="font-semibold mb-2"
              style={{ color: 'hsl(var(--rush-text-primary))' }}
            >
              Scoring
            </h3>
            <p style={{ color: 'hsl(var(--rush-text-secondary))' }}>
              100 points per valid word. Keep the chain flowing to maximize your score!
            </p>
          </section>

          {/* Example */}
          <section 
            className="pt-3"
            style={{ borderTop: '1px solid hsl(var(--rush-divider))' }}
          >
            <h3 
              className="font-semibold mb-2"
              style={{ color: 'hsl(var(--rush-text-primary))' }}
            >
              Example
            </h3>
            <div 
              className="p-3 rounded-lg text-xs font-mono"
              style={{ 
                background: 'hsl(var(--rush-divider))',
                color: 'hsl(var(--rush-text-secondary))'
              }}
            >
              FIRE → TIRE → TILE → TALE → MALE
            </div>
          </section>

          {/* Tips */}
          <section>
            <h3 
              className="font-semibold mb-2"
              style={{ color: 'hsl(var(--rush-text-primary))' }}
            >
              Tips
            </h3>
            <ul 
              className="space-y-1.5 ml-4"
              style={{ color: 'hsl(var(--rush-text-secondary))' }}
            >
              <li className="flex items-start gap-2">
                <span style={{ color: 'hsl(var(--rush-accent))' }}>•</span>
                Think ahead to avoid dead ends
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'hsl(var(--rush-accent))' }}>•</span>
                Common word patterns help build longer chains
              </li>
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};
