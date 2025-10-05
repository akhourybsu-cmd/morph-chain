import { useState, useEffect } from "react";

export type TileState = "match" | "present" | "miss";

interface HintTileProps {
  letter: string;
  state: TileState;
  delay?: number;
  colorblindMode?: boolean;
}

export const HintTile = ({
  letter,
  state,
  delay = 0,
  colorblindMode = false,
}: HintTileProps) => {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const getStateStyles = () => {
    if (!revealed) return "bg-muted/30 border-muted";

    if (colorblindMode) {
      switch (state) {
        case "match":
          return "bg-success border-2 border-success after:content-['='] after:absolute after:top-1 after:right-1 after:text-xs";
        case "present":
          return "bg-warning border-2 border-dashed border-warning after:content-['~'] after:absolute after:top-1 after:right-1 after:text-xs";
        case "miss":
          return "bg-muted border border-muted-foreground/30 after:content-['×'] after:absolute after:top-1 after:right-1 after:text-xs";
      }
    }

    switch (state) {
      case "match":
        return "bg-success border-success";
      case "present":
        return "bg-warning border-warning";
      case "miss":
        return "bg-muted border-muted";
    }
  };

  const ariaLabel = `letter ${letter}: ${state}`;

  return (
    <div
      className={`relative w-9 h-9 flex items-center justify-center rounded-md border transition-all duration-150 ${
        revealed ? "animate-flip" : ""
      } ${getStateStyles()}`}
      aria-label={ariaLabel}
      style={{ animationDelay: revealed ? `${delay}ms` : "0ms" }}
    >
      <span className="text-sm font-mono font-semibold uppercase">
        {letter}
      </span>
    </div>
  );
};
