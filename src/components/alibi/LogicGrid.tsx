import React, { useMemo } from 'react';
import { GridState, CellState } from '@/lib/alibi/types';
import { Check, X } from 'lucide-react';

interface LogicGridProps {
  grid: GridState;
  onCellClick: (row: string, col: string) => void;
  disabled?: boolean;
}

export function LogicGrid({ grid, onCellClick, disabled = false }: LogicGridProps) {
  // Calculate which cells are "inevitable" - only one unknown left in row or column (Rule 8)
  const inevitableCells = useMemo(() => {
    const inevitable = new Set<string>();
    
    // Check rows - if only one unknown left
    for (const row of grid.rows) {
      const unknowns: string[] = [];
      let hasConfirmed = false;
      for (const col of grid.cols) {
        const state = grid.cells[row]?.[col] || 'unknown';
        if (state === 'unknown') unknowns.push(col);
        if (state === 'confirmed') hasConfirmed = true;
      }
      if (unknowns.length === 1 && !hasConfirmed) {
        inevitable.add(`${row}-${unknowns[0]}`);
      }
    }
    
    // Check columns - if only one unknown left
    for (const col of grid.cols) {
      const unknowns: string[] = [];
      let hasConfirmed = false;
      for (const row of grid.rows) {
        const state = grid.cells[row]?.[col] || 'unknown';
        if (state === 'unknown') unknowns.push(row);
        if (state === 'confirmed') hasConfirmed = true;
      }
      if (unknowns.length === 1 && !hasConfirmed) {
        inevitable.add(`${unknowns[0]}-${col}`);
      }
    }
    
    return inevitable;
  }, [grid]);

  const getCellContent = (state: CellState) => {
    switch (state) {
      case 'confirmed':
        return <Check className="h-4 w-4 md:h-5 md:w-5" style={{ color: 'hsl(var(--alibi-success))' }} />;
      case 'ruled_out':
        return <X className="h-4 w-4 md:h-5 md:w-5" style={{ color: 'hsl(var(--alibi-error))' }} />;
      default:
        return null;
    }
  };

  const getCellStyles = (state: CellState, isInevitable: boolean): React.CSSProperties => {
    switch (state) {
      case 'confirmed':
        return {
          background: 'hsl(var(--alibi-success) / 0.15)',
          borderColor: 'hsl(var(--alibi-success) / 0.5)'
        };
      case 'ruled_out':
        return {
          background: 'hsl(var(--alibi-error) / 0.08)',
          borderColor: 'hsl(var(--alibi-divider) / 0.5)'
        };
      default:
        // Subtle highlight for inevitable cells (Rule 8: Elimination Visibility)
        if (isInevitable) {
          return {
            background: 'hsl(var(--alibi-accent) / 0.06)',
            borderColor: 'hsl(var(--alibi-accent) / 0.25)',
          };
        }
        return {
          background: 'hsl(var(--alibi-card-bg))',
          borderColor: 'hsl(var(--alibi-divider) / 0.5)'
        };
    }
  };

  // Format header text - split for wrapping
  const formatHeader = (text: string) => {
    // For times like "8:00 AM", split into time and period
    if (text.includes(':')) {
      const [time, period] = text.split(' ');
      return (
        <span className="flex flex-col items-center leading-none">
          <span className="text-[9px] md:text-[10px]">{time}</span>
          <span className="text-[7px] md:text-[8px] opacity-60">{period}</span>
        </span>
      );
    }
    // For multi-word headers like "Train Station", stack vertically
    const words = text.split(' ');
    if (words.length > 1) {
      return (
        <span className="flex flex-col items-center leading-none">
          {words.map((word, i) => (
            <span key={i} className="text-[9px] md:text-[10px]">{word}</span>
          ))}
        </span>
      );
    }
    // Single word
    return <span className="text-[9px] md:text-[10px]">{text}</span>;
  };

  return (
    <div className="w-full flex justify-center">
      <div 
        className="grid gap-1"
        style={{
          gridTemplateColumns: `auto repeat(${grid.cols.length}, 44px)`,
          gridTemplateRows: `auto repeat(${grid.rows.length}, 44px)`,
        }}
      >
        {/* Empty corner cell */}
        <div />
        
        {/* Column headers */}
        {grid.cols.map(col => (
          <div
            key={`header-${col}`}
            className="flex items-end justify-center pb-1 text-center"
            style={{ color: 'hsl(var(--alibi-text-muted))' }}
          >
            {formatHeader(col)}
          </div>
        ))}

        {/* Data rows */}
        {grid.rows.map(row => (
          <React.Fragment key={row}>
            {/* Row header */}
            <div 
              className="flex items-center justify-end pr-3"
              style={{ color: 'hsl(var(--alibi-text-secondary))' }}
            >
              <span className="text-xs md:text-sm font-medium whitespace-nowrap">
                {row}
              </span>
            </div>
            
            {/* Cells */}
            {grid.cols.map(col => {
              const state = grid.cells[row]?.[col] || 'unknown';
              const isInevitable = inevitableCells.has(`${row}-${col}`);
              const cellStyles = getCellStyles(state, isInevitable);
              return (
                <button
                  key={`${row}-${col}`}
                  onClick={() => !disabled && onCellClick(row, col)}
                  disabled={disabled}
                  className={`w-11 h-11 flex items-center justify-center border rounded transition-all duration-150 ${
                    isInevitable && state === 'unknown' ? 'animate-pulse' : ''
                  }`}
                  style={{
                    ...cellStyles,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.6 : 1,
                    animationDuration: isInevitable ? '2s' : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (!disabled && state === 'unknown') {
                      e.currentTarget.style.background = 'hsl(var(--alibi-accent) / 0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!disabled) {
                      e.currentTarget.style.background = cellStyles.background as string;
                    }
                  }}
                >
                  {getCellContent(state)}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}