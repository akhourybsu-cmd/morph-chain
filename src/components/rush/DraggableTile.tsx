interface DraggableTileProps {
  letter: string;
  index: number;
  isSelected: boolean;
  onSelect: (letter: string, index: number) => void;
}

export const DraggableTile = ({ 
  letter, 
  index, 
  isSelected,
  onSelect 
}: DraggableTileProps) => {
  return (
    <button
      onClick={() => onSelect(letter, index)}
      className={`
        w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center
        cursor-pointer select-none transition-all duration-150 ease-out
        ${isSelected
          ? 'scale-110 ring-2 ring-[hsl(var(--rush-accent))] shadow-lg' 
          : 'hover:shadow-md hover:scale-105'
        }
      `}
      style={{
        background: 'hsl(var(--rush-tile-bg))',
        border: '1px solid hsl(var(--rush-tile-border))',
        boxShadow: isSelected
          ? '0 8px 20px rgba(0,0,0,0.15)'
          : '0 2px 4px rgba(0,0,0,0.05)',
        fontFamily: "'Playfair Display', Georgia, serif",
      }}
    >
      <span className="text-xl md:text-2xl font-bold uppercase text-[hsl(var(--rush-text-primary))]">
        {letter}
      </span>
    </button>
  );
};
