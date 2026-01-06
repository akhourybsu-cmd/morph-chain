import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface MeasuredHowToPlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MeasuredHowToPlay({ open, onOpenChange }: MeasuredHowToPlayProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-measured-card border-measured-card-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-measured-text-primary text-xl">
            How to Play
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-measured-text-secondary">
          <div>
            <h4 className="font-semibold text-measured-text-primary mb-1">The Goal</h4>
            <p className="text-sm">
              Match a real-world number by placing tiles into the equation:
            </p>
            <p className="font-mono text-center py-2 text-measured-accent">
              □ × □ + □ − □
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-measured-text-primary mb-1">The Rules</h4>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>You get 10 tiles to choose from</li>
              <li>Place 4 tiles into the A, B, C, D slots</li>
              <li>Only ONE arrangement gives the exact answer</li>
              <li>You have ONE guess per day</li>
              <li>All numbers are integers (no decimals)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-measured-text-primary mb-1">Scoring</h4>
            <ul className="text-sm space-y-1">
              <li><span className="text-measured-band-exact font-medium">Dead On</span> — Exact match (100 pts)</li>
              <li><span className="text-measured-band-sharp font-medium">Sharp</span> — Very close (90-99 pts)</li>
              <li><span className="text-measured-band-close font-medium">Close</span> — Good effort (70-89 pts)</li>
              <li><span className="text-measured-band-warm font-medium">Warm</span> — On the right track (40-69 pts)</li>
              <li><span className="text-measured-band-wide font-medium">Wide</span> — Far off (0-39 pts)</li>
            </ul>
          </div>

          <p className="text-xs text-measured-text-muted text-center pt-2">
            A new puzzle every day. Play fair!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
