import { ColorState, hslToString } from "@/lib/prismColorGrid";
import { cn } from "@/lib/utils";

interface ColorSwatchProps {
  color: ColorState;
  label: string;
  size?: 'small' | 'medium' | 'large';
  showValues?: boolean;
  className?: string;
}

export const ColorSwatch = ({
  color,
  label,
  size = 'medium',
  showValues = false,
  className,
}: ColorSwatchProps) => {
  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-24 h-24',
    large: 'w-48 h-48',
  };
  
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-lg border-2 border-border shadow-lg transition-all",
          sizeClasses[size]
        )}
        style={{ backgroundColor: hslToString(color) }}
        aria-label={`${label} color: Hue ${color.H}, Saturation ${color.S}, Lightness ${color.L}`}
      />
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {showValues && (
          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
            <p>H: {color.H}°</p>
            <p>S: {color.S}%</p>
            <p>L: {color.L}%</p>
          </div>
        )}
      </div>
    </div>
  );
};
