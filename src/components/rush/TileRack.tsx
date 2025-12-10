import { DraggableTile } from './DraggableTile';

interface TileRackProps {
  tiles: string[];
  selectedIndex: number | null;
  onTileSelect: (letter: string, index: number) => void;
}

export const TileRack = ({ 
  tiles, 
  selectedIndex,
  onTileSelect 
}: TileRackProps) => {
  return (
    <div 
      className="p-4 rounded-xl mx-auto max-w-[400px]"
      style={{
        background: 'hsl(var(--rush-card-bg))',
        border: '1px solid hsl(var(--rush-card-border))',
        boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex flex-wrap justify-center gap-2">
        {tiles.map((letter, i) => (
          <DraggableTile
            key={`${letter}-${i}`}
            letter={letter}
            index={i}
            isSelected={selectedIndex === i}
            onSelect={onTileSelect}
          />
        ))}
      </div>
      <p 
        className="text-center mt-3 text-xs"
        style={{ color: 'hsl(var(--rush-text-muted))' }}
      >
        {selectedIndex !== null ? 'Tap a letter above to place it' : 'Tap a letter to select it'}
      </p>
    </div>
  );
};
