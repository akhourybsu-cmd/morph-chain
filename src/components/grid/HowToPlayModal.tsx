import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HowToPlayModalProps {
  open: boolean;
  onClose: () => void;
}

export const HowToPlayModal = ({ open, onClose }: HowToPlayModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-lg max-h-[90vh] overflow-y-auto bg-white border-[hsl(var(--grid-card-border))]"
        style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-playfair font-semibold text-[hsl(var(--grid-text-primary))]">
            How to Play
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4 font-inter">
          <section>
            <h3 className="font-semibold text-base mb-2 text-[hsl(var(--grid-text-primary))]">Goal</h3>
            <p className="text-sm text-[hsl(var(--grid-text-secondary))] leading-relaxed">
              Morph all tiles from Tier 1 to Tier 2 to Tier 3 by creating chains of <strong>4+ letter words</strong>. Turn the entire grid to Tier 3 in <strong>20 or fewer moves</strong> to win!
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2 text-[hsl(var(--grid-text-primary))]">Controls</h3>
            <p className="text-sm text-[hsl(var(--grid-text-secondary))] leading-relaxed">
              Drag to chain adjacent letters (diagonals allowed). You can't reuse a tile within the same chain.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2 text-[hsl(var(--grid-text-primary))]">Morphing</h3>
            <p className="text-sm text-[hsl(var(--grid-text-secondary))] leading-relaxed">
              Words with <strong>5+ letters</strong> morph a random tile (or tiles) to the next tier. Valid word chains might change nearby tiles.
            </p>
          </section>

          {/* Color Legend */}
          <section className="pt-3 border-t border-[hsl(var(--grid-divider))]">
            <h3 className="font-semibold text-base mb-3 text-[hsl(var(--grid-text-primary))]">Tile Progress</h3>
            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-lg bg-[hsl(var(--grid-tier1))]" />
                <span className="text-xs text-[hsl(var(--grid-text-muted))]">Tier 1</span>
              </div>
              <span className="text-[hsl(var(--grid-text-muted))]">→</span>
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-lg bg-[hsl(var(--grid-tier2))]" />
                <span className="text-xs text-[hsl(var(--grid-text-muted))]">Tier 2</span>
              </div>
              <span className="text-[hsl(var(--grid-text-muted))]">→</span>
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-lg bg-[hsl(var(--grid-tier3))]" />
                <span className="text-xs text-[hsl(var(--grid-text-muted))]">Tier 3</span>
              </div>
            </div>
          </section>

          <section className="pt-4 border-t border-[hsl(var(--grid-divider))]">
            <p className="text-center text-sm font-medium italic text-[hsl(var(--grid-text-secondary))]">
              "Morph the grid. Master the word."
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};
