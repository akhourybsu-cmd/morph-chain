import React from 'react';
import { Undo2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameControlsProps {
  onUndo: () => void;
  onConsistencyCheck: () => void;
  canUndo: boolean;
  consistencyChecks: number;
  disabled?: boolean;
}

export function GameControls({
  onUndo,
  onConsistencyCheck,
  canUndo,
  consistencyChecks,
  disabled = false,
}: GameControlsProps) {
  return (
    <div 
      className="flex items-center justify-center gap-6 py-2"
      style={{ borderTop: '1px solid hsl(var(--alibi-divider) / 0.5)' }}
    >
      <button
        onClick={onUndo}
        disabled={!canUndo || disabled}
        className={cn(
          "flex items-center gap-2 text-sm transition-colors",
          !canUndo || disabled 
            ? "opacity-40 cursor-not-allowed" 
            : "hover:text-alibi-accent"
        )}
        style={{ color: 'hsl(var(--alibi-text-muted))' }}
      >
        <Undo2 className="h-4 w-4" />
        <span>Undo</span>
      </button>
      
      <button
        onClick={onConsistencyCheck}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 text-sm transition-colors",
          disabled 
            ? "opacity-40 cursor-not-allowed" 
            : "hover:text-alibi-accent"
        )}
        style={{ color: 'hsl(var(--alibi-text-muted))' }}
      >
        <Search className="h-4 w-4" />
        <span>Check</span>
        {consistencyChecks > 0 && (
          <span 
            className="px-1.5 py-0.5 text-xs rounded"
            style={{ 
              background: 'hsl(var(--alibi-accent) / 0.15)',
              color: 'hsl(var(--alibi-accent))'
            }}
          >
            {consistencyChecks}
          </span>
        )}
      </button>
    </div>
  );
}
