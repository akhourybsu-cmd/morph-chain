import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, X } from 'lucide-react';

interface AlibiHowToPlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AlibiHowToPlay({ open, onOpenChange }: AlibiHowToPlayProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-alibi-page-bg border-alibi-divider max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-alibi-text-primary text-center">
            How to Play
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 text-alibi-text-primary">
          {/* Goal */}
          <section>
            <h3 className="font-semibold text-alibi-accent mb-2">Goal</h3>
            <p className="text-sm leading-relaxed">
              Alibi is a daily logic puzzle. Four people were at four different 
              locations, at four different times, each with a different object. 
              Use the clues to figure out who was where, when, and with what.
            </p>
          </section>

          {/* How to Mark */}
          <section>
            <h3 className="font-semibold text-alibi-accent mb-2">How to Mark</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border border-alibi-success bg-alibi-success/10 rounded flex items-center justify-center">
                  <Check className="h-4 w-4 text-alibi-success" />
                </div>
                <span>Click once to confirm (this person WAS here)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border border-alibi-divider bg-alibi-error/5 rounded flex items-center justify-center">
                  <X className="h-4 w-4 text-alibi-error" />
                </div>
                <span>Click twice to rule out (this person was NOT here)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border border-alibi-divider bg-alibi-card-bg rounded" />
                <span>Click again to clear</span>
              </div>
            </div>
          </section>

          {/* Tips */}
          <section>
            <h3 className="font-semibold text-alibi-accent mb-2">Tips</h3>
            <ul className="text-sm space-y-1 list-disc list-inside text-alibi-text-secondary">
              <li>Use the three grids to track Person-Location, Person-Time, and Person-Object.</li>
              <li>When you confirm a cell, all other cells in that row and column are automatically ruled out.</li>
              <li>Use "Check" sparingly to verify your progress without spoilers.</li>
              <li>Each person has exactly one location, time, and object.</li>
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
