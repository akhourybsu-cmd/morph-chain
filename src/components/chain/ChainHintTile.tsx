import { cn } from "@/lib/utils";

interface ChainHintTileProps {
  letter: string;
  hint: "match" | "present" | "miss";
  colorblindMode?: boolean;
}

export const ChainHintTile = ({ letter, hint, colorblindMode }: ChainHintTileProps) => {
  const getHintClass = () => {
    switch (hint) {
      case "match":
        return "chain-tile-match";
      case "present":
        return "chain-tile-present";
      default:
        return "chain-tile-miss";
    }
  };

  return (
    <div
      className={cn(
        "chain-tile w-8 h-8 md:w-10 md:h-10 flex items-center justify-center font-serif text-base md:text-lg font-medium",
        getHintClass()
      )}
    >
      {letter}
      {colorblindMode && hint === "match" && (
        <span className="absolute -top-0.5 -right-0.5 text-[8px]">✓</span>
      )}
      {colorblindMode && hint === "present" && (
        <span className="absolute -top-0.5 -right-0.5 text-[8px]">○</span>
      )}
    </div>
  );
};
