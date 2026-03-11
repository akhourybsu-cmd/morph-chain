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
  const sizeClasses = {
    sm: 'w-10 h-10 text-lg',
    md: 'w-14 h-14 text-2xl',
    lg: 'w-18 h-18 text-3xl',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-xl flex flex-col items-center justify-center transition-all duration-200 font-bold select-none',
        sizeClasses[size],
        symbol ? 'shadow-md' : 'border-2 border-dashed',
        selected && 'ring-2 ring-offset-2',
        disabled ? 'opacity-50 cursor-default' : 'cursor-pointer active:scale-95 hover:scale-105',
      )}
      style={{
        background: symbol 
          ? SYMBOL_DISPLAY[symbol].color 
          : 'hsl(var(--muted) / 0.3)',
        borderColor: symbol ? 'transparent' : 'hsl(var(--muted-foreground) / 0.3)',
        color: symbol ? '#fff' : 'hsl(var(--muted-foreground))',
        ...(selected ? { '--tw-ring-color': 'hsl(var(--primary))' } as React.CSSProperties : {}),
      }}
    >
      <span>{symbol ? SYMBOL_DISPLAY[symbol].emoji : '?'}</span>
      {showLabel && symbol && (
        <span className="text-[8px] uppercase tracking-wider mt-0.5 opacity-80">
          {SYMBOL_DISPLAY[symbol].label}
        </span>
      )}
    </button>
  );
};
