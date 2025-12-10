interface WordDropZoneProps {
  word: string;
  selectedLetter: string | null;
  onPlaceLetter: (position: number) => void;
  hasSelection: boolean;
  shake: boolean;
}

export const WordDropZone = ({ 
  word, 
  selectedLetter,
  onPlaceLetter,
  hasSelection,
  shake
}: WordDropZoneProps) => {
  return (
    <div 
      className={`flex justify-center gap-2 ${shake ? 'animate-shake' : ''}`}
      style={{ perspective: '1000px' }}
    >
      {word.split('').map((letter, i) => (
        <button
          key={i}
          onClick={() => hasSelection && onPlaceLetter(i)}
          disabled={!hasSelection}
          className={`
            w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center
            transition-all duration-150 ease-out
            ${hasSelection 
              ? 'cursor-pointer hover:scale-105 hover:ring-2 hover:ring-[hsl(var(--rush-drop-target))]' 
              : 'cursor-default'
            }
          `}
          style={{ 
            fontFamily: "'Playfair Display', Georgia, serif",
            background: 'hsl(var(--rush-card-bg))',
            border: `2px solid hsl(var(--rush-card-border))`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <span 
            className="text-2xl md:text-3xl font-bold uppercase"
            style={{ color: 'hsl(var(--rush-text-primary))' }}
          >
            {letter}
          </span>
        </button>
      ))}
    </div>
  );
};
