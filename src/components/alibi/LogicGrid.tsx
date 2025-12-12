import React from 'react';
import { GridState, CellState } from '@/lib/alibi/types';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogicGridProps {
  grid: GridState;
  onCellClick: (row: string, col: string) => void;
  disabled?: boolean;
}

export function LogicGrid({ grid, onCellClick, disabled = false }: LogicGridProps) {
  const getCellContent = (state: CellState) => {
    switch (state) {
      case 'confirmed':
        return <Check className="h-4 w-4 text-alibi-success" />;
      case 'ruled_out':
        return <X className="h-4 w-4 text-alibi-error" />;
      default:
        return null;
    }
  };

  const getCellClass = (state: CellState) => {
    switch (state) {
      case 'confirmed':
        return 'bg-alibi-success/10 border-alibi-success/50';
      case 'ruled_out':
        return 'bg-alibi-error/5 border-alibi-divider/50';
      default:
        return 'bg-alibi-card-bg border-alibi-divider/50 hover:bg-alibi-accent/5';
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="border-collapse mx-auto">
        {/* Column headers in dedicated row */}
        <thead>
          <tr>
            {/* Empty corner cell */}
            <th className="w-20 md:w-24" />
            {/* Column headers - small caps, muted, letter-spaced */}
            {grid.cols.map(col => (
              <th 
                key={col}
                className="px-1 pb-3 text-[10px] md:text-xs font-normal tracking-wider uppercase
                           text-center min-w-[48px] md:min-w-[56px]"
                style={{ color: 'hsl(var(--alibi-text-muted))' }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.rows.map(row => (
            <tr key={row}>
              {/* Row header - slightly darker, vertically centered */}
              <th 
                className="px-2 py-1 text-xs md:text-sm font-medium text-right pr-3"
                style={{ color: 'hsl(var(--alibi-text-secondary))' }}
              >
                {row}
              </th>
              {/* Cells - more square, hairline borders, increased spacing */}
              {grid.cols.map(col => {
                const state = grid.cells[row]?.[col] || 'unknown';
                return (
                  <td key={col} className="p-1">
                    <button
                      onClick={() => !disabled && onCellClick(row, col)}
                      disabled={disabled}
                      className={cn(
                        "w-10 h-10 md:w-11 md:h-11 flex items-center justify-center",
                        "border rounded-sm transition-all duration-150",
                        getCellClass(state),
                        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                      )}
                    >
                      {getCellContent(state)}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
