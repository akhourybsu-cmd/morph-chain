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
            How to Play MORPH GRID
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <section>
            <h3 className="font-semibold text-lg mb-2">🎯 Objective</h3>
            <p className="text-sm text-muted-foreground">
              Create valid words by chaining adjacent letters. Each word morphs the grid — watch it evolve!
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">📋 Rules</h3>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>Tap/drag letters to form words (minimum 3 letters)</li>
              <li>Letters must be adjacent (horizontal, vertical, or diagonal)</li>
              <li>Can't reuse tiles within the same word</li>
              <li>Only valid English words count</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">🔄 Shift & Spark Mechanic</h3>
            <p className="text-sm text-muted-foreground mb-2">
              After each valid word:
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li><strong>Used tiles</strong> → transform into new random letters</li>
              <li><strong>Neighbor ripple</strong> → adjacent tiles may mutate</li>
              <li><strong>Stability counter</strong> → unused tiles that morph twice become stabilized (gray rim)</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">💎 Power Tiles</h3>
            <p className="text-sm text-muted-foreground">
              Purple glowing tiles are Power Tiles! Using one in a word morphs its entire row after scoring.
              Only 2 Power Tiles exist on the grid at any time.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">🏆 Scoring</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>3 letters: 10 pts</li>
              <li>4 letters: 20 pts</li>
              <li>5 letters: 40 pts</li>
              <li>6 letters: 65 pts</li>
              <li>7+ letters: 95 pts + 15/extra letter</li>
              <li>Rare letters (J,Q,X,Z,K,V): +10% bonus</li>
              <li>Ripple mutations: +1 pt each</li>
              <li>Power tile used: +20 pts</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">🎨 Tile Colors</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li><span className="text-cyan-400">Cyan/Teal</span> — Vowels</li>
              <li><span className="text-amber-400">Amber/Orange</span> — Consonants</li>
              <li><span className="text-purple-400">Purple</span> — Power Tiles</li>
              <li><span className="text-gray-400">Gray rim</span> — Stabilized</li>
            </ul>
          </section>

          <section className="pt-4 border-t">
            <p className="text-center text-sm font-medium italic">
              "Morph the grid. Master the word."
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};
