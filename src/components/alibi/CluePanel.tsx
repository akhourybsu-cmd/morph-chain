import React from 'react';
import { AlibiClue } from '@/lib/alibi/types';
import { cn } from '@/lib/utils';

interface CluePanelProps {
  clues: AlibiClue[];
  className?: string;
}

export function CluePanel({ clues, className }: CluePanelProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-sm font-semibold text-alibi-text-secondary uppercase tracking-wide">
        Clues
      </h3>
      <div className="space-y-2 max-h-[200px] md:max-h-[300px] overflow-y-auto pr-2">
        {clues.map((clue, index) => (
          <div
            key={clue.id}
            className="p-3 bg-alibi-card-bg border border-alibi-divider rounded-lg"
          >
            <p className="text-sm text-alibi-text-primary leading-relaxed">
              <span className="text-alibi-text-muted mr-2">{index + 1}.</span>
              {clue.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
