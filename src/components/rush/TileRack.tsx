import { DraggableTile } from './DraggableTile';

interface TileRackProps {
  tiles: string[];
  onTileDragStart: (letter: string, index: number) => void;
  onTileDragEnd: () => void;
  draggingIndex: number | null;
}

export const TileRack = ({ 
  tiles, 
  onTileDragStart, 
  onTileDragEnd, 
  draggingIndex 
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
            onDragStart={onTileDragStart}
            onDragEnd={onTileDragEnd}
            isDragging={draggingIndex === i}
          />
        ))}
      </div>
      <p 
        className="text-center mt-3 text-xs"
        style={{ color: 'hsl(var(--rush-text-muted))' }}
      >
        Drag a letter onto the word above
      </p>
    </div>
  );
};
