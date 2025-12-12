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
      <DialogContent 
        className="max-w-md"
        style={{
          background: 'hsl(var(--alibi-page-bg))',
          border: '1px solid hsl(var(--alibi-divider))',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
        }}
      >
        <DialogHeader>
          <DialogTitle 
            className="font-playfair text-2xl text-center"
            style={{ color: 'hsl(var(--alibi-text-primary))' }}
          >
            How to Play
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6" style={{ color: 'hsl(var(--alibi-text-primary))' }}>
          {/* Goal */}
          <section>
            <h3 
              className="font-semibold mb-2"
              style={{ color: 'hsl(var(--alibi-accent))' }}
            >
              Goal
            </h3>
            <p className="text-sm leading-relaxed">
              Alibi is a daily logic puzzle. Four people were at four different 
              locations, at four different times, each with a different object. 
              Use the clues to figure out who was where, when, and with what.
            </p>
          </section>

          {/* Divider */}
          <div style={{ borderTop: '1px solid hsl(var(--alibi-divider))' }} />

          {/* How to Mark */}
          <section>
            <h3 
              className="font-semibold mb-3"
              style={{ color: 'hsl(var(--alibi-accent))' }}
            >
              How to Mark
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded flex items-center justify-center"
                  style={{ 
                    background: 'hsl(var(--alibi-success) / 0.15)',
                    border: '1px solid hsl(var(--alibi-success))'
                  }}
                >
                  <Check className="h-5 w-5" style={{ color: 'hsl(var(--alibi-success))' }} />
                </div>
                <span>Click once to confirm (this person WAS here)</span>
              </div>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded flex items-center justify-center"
                  style={{ 
                    background: 'hsl(var(--alibi-error) / 0.1)',
                    border: '1px solid hsl(var(--alibi-divider))'
                  }}
                >
                  <X className="h-5 w-5" style={{ color: 'hsl(var(--alibi-error))' }} />
                </div>
                <span>Click twice to rule out (this person was NOT here)</span>
              </div>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded flex items-center justify-center"
                  style={{ 
                    background: 'hsl(var(--alibi-card-bg))',
                    border: '1px solid hsl(var(--alibi-divider))'
                  }}
                />
                <span>Click again to clear</span>
              </div>
            </div>
          </section>

          {/* Divider */}
          <div style={{ borderTop: '1px solid hsl(var(--alibi-divider))' }} />

          {/* Tips */}
          <section>
            <h3 
              className="font-semibold mb-2"
              style={{ color: 'hsl(var(--alibi-accent))' }}
            >
              Tips
            </h3>
            <ul 
              className="text-sm space-y-1.5 list-disc list-inside"
              style={{ color: 'hsl(var(--alibi-text-secondary))' }}
            >
              <li>Use the three grids to track Person-Location, Person-Time, and Person-Object.</li>
              <li>When you confirm a cell, all other cells in that row and column are automatically ruled out.</li>
              <li>Use "Check" sparingly to verify your progress without spoilers.</li>
              <li>Each person has exactly one location, time, and object.</li>
            </ul>
          </section>

          {/* Tagline */}
          <p 
            className="text-center text-xs pt-2"
            style={{ color: 'hsl(var(--alibi-text-muted))' }}
          >
            Solve the case. Find the alibi.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
