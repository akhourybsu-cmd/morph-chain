import React from 'react';
import { GridState, CellState } from '@/lib/alibi/types';
import { Check, X } from 'lucide-react';

interface LogicGridProps {
  grid: GridState;
  onCellClick: (row: string, col: string) => void;
  disabled?: boolean;
}

export function LogicGrid({ grid, onCellClick, disabled = false }: LogicGridProps) {
  const getCellContent = (state: CellState) => {
    switch (state) {
      case 'confirmed':
        return <Check className="h-5 w-5" style={{ color: 'hsl(var(--alibi-success))' }} />;
      case 'ruled_out':
        return <X className="h-5 w-5" style={{ color: 'hsl(var(--alibi-error))' }} />;
      default:
        return null;
    }
  };

  const getCellStyles = (state: CellState): React.CSSProperties => {
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
        return {
          background: 'hsl(var(--alibi-card-bg))',
          borderColor: 'hsl(var(--alibi-divider) / 0.5)'
        };
    }
  };

  return (
    <div className="w-full flex justify-center">
      <table className="border-collapse">
        {/* Column headers */}
        <thead>
          <tr>
            {/* Empty corner cell */}
            <th className="w-20 md:w-24" />
            {/* Column headers */}
            {grid.cols.map(col => (
              <th 
                key={col}
                className="px-1 pb-3 text-[10px] md:text-xs font-normal tracking-wider uppercase text-center"
                style={{ 
                  color: 'hsl(var(--alibi-text-muted))',
                  minWidth: '52px'
                }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.rows.map(row => (
            <tr key={row}>
              {/* Row header */}
              <th 
                className="px-2 py-1 text-xs md:text-sm font-medium text-right pr-3"
                style={{ color: 'hsl(var(--alibi-text-secondary))' }}
              >
                {row}
              </th>
              {/* Cells with uniform spacing */}
              {grid.cols.map(col => {
                const state = grid.cells[row]?.[col] || 'unknown';
                const cellStyles = getCellStyles(state);
                return (
                  <td key={col} className="p-1">
                    <button
                      onClick={() => !disabled && onCellClick(row, col)}
                      disabled={disabled}
                      className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center border rounded transition-all duration-150"
                      style={{
                        ...cellStyles,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.6 : 1
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
