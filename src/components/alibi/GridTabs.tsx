import React from 'react';
import { GridType } from '@/lib/alibi/types';
import { cn } from '@/lib/utils';

interface GridTabsProps {
  activeGrid: GridType;
  onGridChange: (grid: GridType) => void;
}

const tabs: { id: GridType; label: string }[] = [
  { id: 'location', label: 'Location' },
  { id: 'time', label: 'Time' },
  { id: 'object', label: 'Object' },
];

export function GridTabs({ activeGrid, onGridChange }: GridTabsProps) {
  return (
    <div className="flex justify-center gap-1 border-b border-alibi-divider">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onGridChange(tab.id)}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors relative",
            activeGrid === tab.id
              ? "text-alibi-accent"
              : "text-alibi-text-muted hover:text-alibi-text-secondary"
          )}
        >
          {tab.label}
          {activeGrid === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-alibi-accent" />
          )}
        </button>
      ))}
    </div>
  );
}
