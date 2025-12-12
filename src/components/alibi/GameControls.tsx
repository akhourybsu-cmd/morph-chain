import React from 'react';
import { Button } from '@/components/ui/button';
import { Undo2, Search } from 'lucide-react';

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
    <div className="flex items-center justify-center gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={onUndo}
        disabled={!canUndo || disabled}
        className="border-alibi-divider text-alibi-text-secondary hover:bg-alibi-divider/50"
      >
        <Undo2 className="h-4 w-4 mr-2" />
        Undo
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onConsistencyCheck}
        disabled={disabled}
        className="border-alibi-divider text-alibi-text-secondary hover:bg-alibi-divider/50"
      >
        <Search className="h-4 w-4 mr-2" />
        Check
        {consistencyChecks > 0 && (
          <span className="ml-2 px-1.5 py-0.5 text-xs bg-alibi-accent/20 text-alibi-accent rounded">
            {consistencyChecks}
          </span>
        )}
      </Button>
    </div>
  );
}
