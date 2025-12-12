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
        return 'bg-alibi-success/10 border-alibi-success';
      case 'ruled_out':
        return 'bg-alibi-error/5 border-alibi-divider';
      default:
        return 'bg-alibi-card-bg border-alibi-divider hover:bg-alibi-accent/5';
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="border-collapse mx-auto">
        <thead>
          <tr>
            {/* Empty corner cell */}
            <th className="w-20 md:w-24" />
            {/* Column headers */}
            {grid.cols.map(col => (
              <th 
                key={col}
                className="px-1 py-2 text-xs md:text-sm font-medium text-alibi-text-secondary 
                           text-center min-w-[48px] md:min-w-[56px] max-w-[64px]"
              >
                <span className="block truncate">{col}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.rows.map(row => (
            <tr key={row}>
              {/* Row header */}
              <th 
                className="px-2 py-1 text-xs md:text-sm font-medium text-alibi-text-secondary 
                           text-right pr-3"
              >
                {row}
              </th>
              {/* Cells */}
              {grid.cols.map(col => {
                const state = grid.cells[row]?.[col] || 'unknown';
                return (
                  <td key={col} className="p-0.5">
                    <button
                      onClick={() => !disabled && onCellClick(row, col)}
                      disabled={disabled}
                      className={cn(
                        "w-10 h-10 md:w-12 md:h-12 flex items-center justify-center",
                        "border rounded transition-all duration-150",
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
