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
    <div 
      className="rounded-lg p-1 flex"
      style={{ 
        background: 'hsl(var(--alibi-card-bg))',
        border: '1px solid hsl(var(--alibi-divider))'
      }}
    >
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onGridChange(tab.id)}
          className={cn(
            "flex-1 px-4 py-2 text-sm font-medium transition-all rounded-md",
            activeGrid === tab.id
              ? "bg-alibi-accent/10 text-alibi-accent font-semibold"
              : "text-alibi-text-muted hover:text-alibi-text-secondary"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
