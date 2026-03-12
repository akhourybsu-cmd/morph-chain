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

export const SymbolSlot = ({ symbol, onClick, selected, disabled, size = 'md', showLabel }: SymbolSlotProps) => {
  const [bounce, setBounce] = useState(false);

  // Trigger bounce animation when symbol is placed
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
          ? `hsl(var(--code-card-bg))`
          : 'hsl(var(--code-pill-bg))',
        borderColor: symbol
          ? 'hsl(var(--code-card-border))'
          : 'hsl(var(--code-divider))',
        color: symbol
          ? 'hsl(var(--code-text-primary))'
          : 'hsl(var(--code-text-muted))',
        boxShadow: symbol ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
        transition: 'all 0.15s ease-out',
      }}
    >
      <span>{symbol ? SYMBOL_DISPLAY[symbol].emoji : '?'}</span>
      {showLabel && symbol && (
        <span
          className="text-[7px] uppercase tracking-wider mt-0.5 font-medium"
          style={{ color: 'hsl(var(--code-text-muted))' }}
        >
          {SYMBOL_DISPLAY[symbol].label}
        </span>
      )}
    </button>
  );
};
