import React from 'react';
import { AlibiClue } from '@/lib/alibi/types';
import { cn } from '@/lib/utils';

interface CluePanelProps {
  clues: AlibiClue[];
  className?: string;
}

export function CluePanel({ clues, className }: CluePanelProps) {
  return (
    <div className={cn("", className)}>
      {/* Section header - small caps, letter-spaced */}
      <h3 
        className="text-[10px] tracking-[0.15em] uppercase mb-4"
        style={{ color: 'hsl(var(--alibi-text-muted))' }}
      >
        Clues
      </h3>
      
      {/* Editorial clue column - no cards, clean spacing */}
      <div className="space-y-3 max-h-[200px] md:max-h-[280px] overflow-y-auto pr-2">
        {clues.map((clue, index) => (
          <p
            key={clue.id}
            className="text-sm leading-relaxed"
            style={{ color: 'hsl(var(--alibi-text-primary))' }}
          >
            <span 
              className="font-semibold mr-2"
              style={{ color: 'hsl(var(--alibi-text-secondary))' }}
            >
              {index + 1}.
            </span>
            {clue.text}
          </p>
        ))}
      </div>
    </div>
  );
}
