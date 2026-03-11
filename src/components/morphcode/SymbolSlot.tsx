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
    lg: 'w-16 h-16 text-3xl',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-xl flex flex-col items-center justify-center transition-all duration-200 font-bold select-none',
        sizeClasses[size],
        symbol ? 'shadow-lg' : 'border-2 border-dashed',
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        disabled ? 'opacity-60 cursor-default' : 'cursor-pointer active:scale-90 hover:scale-105 hover:shadow-xl',
      )}
      style={{
        background: symbol 
          ? `linear-gradient(135deg, ${SYMBOL_DISPLAY[symbol].color}, ${SYMBOL_DISPLAY[symbol].color}dd)` 
          : 'hsl(var(--muted) / 0.2)',
        borderColor: symbol ? 'transparent' : 'hsl(var(--muted-foreground) / 0.25)',
        color: symbol ? '#fff' : 'hsl(var(--muted-foreground) / 0.5)',
        textShadow: symbol ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
      }}
    >
      <span className={cn(size === 'lg' && 'drop-shadow-md')}>{symbol ? SYMBOL_DISPLAY[symbol].emoji : '?'}</span>
      {showLabel && symbol && (
        <span className="text-[7px] uppercase tracking-wider mt-0.5 opacity-80 font-medium">
          {SYMBOL_DISPLAY[symbol].label}
        </span>
      )}
    </button>
  );
};
