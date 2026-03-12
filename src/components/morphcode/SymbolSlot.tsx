import { useState, useEffect } from 'react';
import { Symbol, SYMBOL_DISPLAY } from '@/lib/morphcode/types';
import { cn } from '@/lib/utils';

interface SymbolSlotProps {
  symbol: Symbol | null;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SYMBOL_BG: Record<Symbol, string> = {
  circle:   'hsla(210, 80%, 60%, 0.18)',
  triangle: 'hsla(45, 90%, 55%, 0.18)',
  wave:     'hsla(180, 70%, 50%, 0.18)',
  flame:    'hsla(15, 90%, 55%, 0.18)',
  eye:      'hsla(270, 60%, 60%, 0.18)',
  shard:    'hsla(330, 70%, 55%, 0.18)',
};

export const SymbolSlot = ({ symbol, onClick, selected, disabled, size = 'md' }: SymbolSlotProps) => {
  const [bounce, setBounce] = useState(false);

  useEffect(() => {
    if (symbol) {
      setBounce(true);
      const t = setTimeout(() => setBounce(false), 150);
      return () => clearTimeout(t);
    }
  }, [symbol]);

  const sizeClasses = {
    sm: 'w-10 h-10 text-lg md:w-11 md:h-11 md:text-xl',
    md: 'w-13 h-13 text-2xl md:w-14 md:h-14 md:text-3xl',
    lg: 'w-14 h-14 text-3xl md:w-16 md:h-16 md:text-4xl',
  };

  const display = symbol ? SYMBOL_DISPLAY[symbol] : null;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-xl flex items-center justify-center transition-all duration-200 font-bold select-none border',
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
    </button>
  );
};
