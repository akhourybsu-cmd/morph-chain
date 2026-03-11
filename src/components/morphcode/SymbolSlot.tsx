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

// Prestige-friendly muted symbol colors (HSL values only)
const PRESTIGE_COLORS: Record<Symbol, { bg: string; bgDark: string }> = {
  circle:   { bg: '210 45% 88%', bgDark: '210 30% 30%' },
  triangle: { bg: '45 55% 85%',  bgDark: '45 35% 32%' },
  wave:     { bg: '180 40% 85%', bgDark: '180 25% 30%' },
  flame:    { bg: '15 55% 87%',  bgDark: '15 35% 32%' },
  eye:      { bg: '270 35% 87%', bgDark: '270 25% 32%' },
  shard:    { bg: '330 40% 88%', bgDark: '330 25% 32%' },
};

export const SymbolSlot = ({ symbol, onClick, selected, disabled, size = 'md', showLabel }: SymbolSlotProps) => {
  const sizeClasses = {
    sm: 'w-10 h-10 text-lg',
    md: 'w-14 h-14 text-2xl',
    lg: 'w-16 h-16 text-3xl',
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
