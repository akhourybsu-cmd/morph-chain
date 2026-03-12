import { useState, useEffect } from 'react';
import { Symbol, SYMBOL_DISPLAY } from '@/lib/morphcode/types';
import { cn } from '@/lib/utils';

interface SymbolSlotProps {
  symbol: Symbol | null;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const SYMBOL_BG: Record<Symbol, string> = {
  circle:   'hsla(210, 80%, 60%, 0.12)',
  triangle: 'hsla(45, 90%, 55%, 0.12)',
  wave:     'hsla(180, 70%, 50%, 0.12)',
  flame:    'hsla(15, 90%, 55%, 0.12)',
  eye:      'hsla(270, 60%, 60%, 0.12)',
  shard:    'hsla(330, 70%, 55%, 0.12)',
};

export const SymbolSlot = ({ symbol, onClick, selected, disabled, size = 'md', showLabel }: SymbolSlotProps) => {
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    if (symbol) {
      setBounce(true);
      const t = setTimeout(() => setBounce(false), 150);
      return () => clearTimeout(t);
    }
  }, [symbol]);

  const sizeClasses = {
    sm: 'w-9 h-9 text-base md:w-10 md:h-10 md:text-lg',
    md: 'w-12 h-12 text-xl md:w-14 md:h-14 md:text-2xl',
    lg: 'w-14 h-14 text-2xl md:w-16 md:h-16 md:text-3xl',
  };

  const display = symbol ? SYMBOL_DISPLAY[symbol] : null;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-xl flex flex-col items-center justify-center transition-all duration-200 font-bold select-none border',
        sizeClasses[size],
        selected && 'ring-2 ring-[hsl(var(--code-accent))] ring-offset-2 ring-offset-[hsl(var(--code-page-bg))]',
        disabled ? 'opacity-60 cursor-default' : 'cursor-pointer active:scale-90 hover:scale-105',
        bounce && 'scale-110',
      )}
      style={{
        background: symbol
          ? SYMBOL_BG[symbol]
          : 'hsl(var(--code-pill-bg))',
        borderColor: symbol
          ? 'hsl(var(--code-card-border))'
          : 'hsl(var(--code-divider))',
        color: display
          ? display.color
          : 'hsl(var(--code-text-muted))',
        boxShadow: symbol ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
        transition: 'all 0.15s ease-out',
      }}
    >
      <span>{display ? display.emoji : '?'}</span>
      {showLabel && symbol && display && (
        <span
          className="text-[7px] uppercase tracking-wider mt-0.5 font-medium"
          style={{ color: 'hsl(var(--code-text-muted))' }}
        >
          {display.label}
        </span>
      )}
    </button>
  );
};
