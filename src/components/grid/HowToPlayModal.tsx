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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-outfit font-bold">
            How to Play
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <section>
            <h3 className="font-semibold text-lg mb-2">🎯 Goal</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Morph all tiles from orange to blue to purple by creating chains of <strong>4+ letter words</strong>. Turn the entire grid purple in <strong>20 or less moves</strong> to win!
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">✋ Controls</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Drag or tap to chain adjacent letters (diagonals allowed). You can't reuse a tile within the same chain.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">🎨 Morphing</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Words with <strong>5+ letters</strong> morph a random tile (or tiles) to their next color. Valid word chains might change nearby tiles.
            </p>
          </section>

          <section className="pt-4 border-t">
            <p className="text-center text-sm font-semibold italic text-foreground">
              "Morph the grid. Master the word."
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};