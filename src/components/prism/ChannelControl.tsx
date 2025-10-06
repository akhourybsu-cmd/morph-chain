import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { Channel, ColorState, getAvailableDirections } from "@/lib/prismColorGrid";
import { cn } from "@/lib/utils";

interface ChannelControlProps {
  channel: Channel;
  color: ColorState;
  onMove: (channel: Channel, direction: '+' | '-') => void;
  disabled?: boolean;
}

const channelLabels: Record<Channel, string> = {
  H: 'Hue',
  S: 'Saturation',
  L: 'Lightness',
};

const channelColors: Record<Channel, string> = {
  H: 'text-red-500',
  S: 'text-blue-500',
  L: 'text-yellow-500',
};

export const ChannelControl = ({
  channel,
  color,
  onMove,
  disabled = false,
}: ChannelControlProps) => {
  const directions = getAvailableDirections(color, channel);
  const value = color[channel];
  const unit = channel === 'H' ? '°' : '%';
  
  return (
    <div className="flex flex-col gap-2 p-4 bg-card rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <label className={cn("text-sm font-semibold", channelColors[channel])}>
          {channelLabels[channel]}
        </label>
        <span className="text-sm font-mono text-muted-foreground">
          {value}{unit}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onMove(channel, '-')}
          disabled={disabled || !directions.minus}
          aria-label={`Decrease ${channelLabels[channel]}`}
          className="h-10 w-10"
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        <div className="flex-1 h-2 bg-muted rounded-full relative overflow-hidden">
          <div
            className={cn("h-full transition-all", channelColors[channel].replace('text-', 'bg-'))}
            style={{
              width: channel === 'H' ? `${(value / 360) * 100}%` : `${value}%`,
            }}
          />
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => onMove(channel, '+')}
          disabled={disabled || !directions.plus}
          aria-label={`Increase ${channelLabels[channel]}`}
          className="h-10 w-10"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
