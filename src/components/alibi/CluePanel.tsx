import React from 'react';
import { AlibiClue } from '@/lib/alibi/types';
import { cn } from '@/lib/utils';
import { HelpCircle, Sparkles, Lock } from 'lucide-react';

interface CluePanelProps {
  clues: AlibiClue[];
  className?: string;
  // Hidden Final Question props
  finalQuestion?: string;
  showFinalQuestion: boolean;
  totalConfirmations: number;
  revealThreshold: number;
  questionJustRevealed?: boolean;
}

export function CluePanel({ 
  clues, 
  className,
  finalQuestion,
  showFinalQuestion,
  totalConfirmations,
  revealThreshold,
  questionJustRevealed,
}: CluePanelProps) {
  const confirmationsRemaining = Math.max(0, revealThreshold - totalConfirmations);
  
  return (
    <div className={cn("", className)}>
      {/* Clues Section */}
      <h3 
        className="text-[10px] tracking-[0.15em] uppercase mb-4"
        style={{ color: 'hsl(var(--alibi-text-muted))' }}
      >
        Clues
      </h3>
      
      {/* Editorial clue column - no cards, clean spacing */}
      <div className="space-y-3 max-h-[160px] md:max-h-[220px] overflow-y-auto pr-2">
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
      
      {/* Final Question Section - with reveal mechanic */}
      <div className="mt-6 pt-4 border-t" style={{ borderColor: 'hsl(var(--alibi-border))' }}>
        <h3 
          className="text-[10px] tracking-[0.15em] uppercase mb-3 flex items-center gap-2"
          style={{ color: 'hsl(var(--alibi-text-muted))' }}
        >
          <HelpCircle className="w-3 h-3" />
          The Mystery
        </h3>
        
        {showFinalQuestion && finalQuestion ? (
          <div 
            className={cn(
              "p-4 rounded-lg transition-all duration-500",
              questionJustRevealed && "animate-pulse ring-2 ring-violet-500/50"
            )}
            style={{ 
              backgroundColor: 'hsl(var(--alibi-accent) / 0.08)',
              border: '1px solid hsl(var(--alibi-accent) / 0.2)',
            }}
          >
            {questionJustRevealed && (
              <div className="flex items-center gap-2 mb-2 text-violet-600 dark:text-violet-400">
                <Sparkles className="w-4 h-4 animate-bounce" />
                <span className="text-xs font-medium uppercase tracking-wide">Question Revealed!</span>
              </div>
            )}
            <p 
              className="text-base font-medium leading-relaxed"
              style={{ color: 'hsl(var(--alibi-text-primary))' }}
            >
              {finalQuestion}
            </p>
          </div>
        ) : (
          <div 
            className="p-4 rounded-lg"
            style={{ 
              backgroundColor: 'hsl(var(--alibi-card-bg) / 0.5)',
              border: '1px dashed hsl(var(--alibi-border))',
            }}
          >
            <div className="flex items-center gap-3">
              <Lock 
                className="w-5 h-5 flex-shrink-0" 
                style={{ color: 'hsl(var(--alibi-text-muted))' }}
              />
              <div>
                <p 
                  className="text-sm font-medium"
                  style={{ color: 'hsl(var(--alibi-text-secondary))' }}
                >
                  Mystery question locked
                </p>
                <p 
                  className="text-xs mt-1"
                  style={{ color: 'hsl(var(--alibi-text-muted))' }}
                >
                  Confirm {confirmationsRemaining} more cell{confirmationsRemaining !== 1 ? 's' : ''} to reveal
                </p>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-3">
              <div 
                className="h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: 'hsl(var(--alibi-border))' }}
              >
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ 
                    width: `${Math.min(100, (totalConfirmations / revealThreshold) * 100)}%`,
                    backgroundColor: 'hsl(var(--alibi-accent))',
                  }}
                />
              </div>
              <p 
                className="text-[10px] mt-1.5 text-right"
                style={{ color: 'hsl(var(--alibi-text-muted))' }}
              >
                {totalConfirmations} / {revealThreshold} confirmations
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}