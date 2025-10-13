import { Button } from "@/components/ui/button";
import { Delete } from "lucide-react";

interface OnScreenKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  disabled?: boolean;
  usedLetters?: Set<string>;
  correctLetters?: Set<string>;
  wrongPositionLetters?: Set<string>;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

export default function OnScreenKeyboard({
  onKeyPress,
  onBackspace,
  onEnter,
  disabled = false,
  usedLetters = new Set(),
  correctLetters = new Set(),
  wrongPositionLetters = new Set()
}: OnScreenKeyboardProps) {
  
  const getKeyStyle = (key: string) => {
    if (correctLetters.has(key)) {
      return "bg-[hsl(180,80%,60%)] text-white hover:bg-[hsl(180,80%,55%)] border-[hsl(180,80%,70%)]";
    }
    if (wrongPositionLetters.has(key)) {
      return "bg-[hsl(300,60%,50%)] text-white hover:bg-[hsl(300,60%,45%)] border-[hsl(300,60%,60%)]";
    }
    if (usedLetters.has(key)) {
      return "bg-muted/40 text-muted-foreground hover:bg-muted/50";
    }
    return "bg-card hover:bg-accent text-foreground border-border";
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-1.5 md:space-y-2 py-2 select-none px-2">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div 
          key={rowIndex} 
          className="flex justify-center gap-1 md:gap-1.5"
          style={{
            paddingLeft: rowIndex === 1 ? '0.5rem' : rowIndex === 2 ? '1rem' : '0',
            paddingRight: rowIndex === 1 ? '0.5rem' : rowIndex === 2 ? '1rem' : '0',
          }}
        >
          {rowIndex === 2 && (
            <Button
              onClick={onEnter}
              disabled={disabled}
              className="h-12 md:h-12 px-2 md:px-4 font-bold text-xs md:text-sm bg-gradient-to-r from-[hsl(var(--prism-accent-start))] via-[hsl(var(--prism-accent-mid))] to-[hsl(var(--prism-accent-end))] hover:opacity-90 text-white"
            >
              ENTER
            </Button>
          )}
          
          {row.map((key) => (
            <Button
              key={key}
              onClick={() => onKeyPress(key)}
              disabled={disabled}
              className={`h-12 md:h-12 w-8 md:min-w-[2.25rem] px-1 md:px-2 font-bold text-sm md:text-sm transition-all ${getKeyStyle(key)} border`}
            >
              {key}
            </Button>
          ))}
          
          {rowIndex === 2 && (
            <Button
              onClick={onBackspace}
              disabled={disabled}
              variant="outline"
              className="h-12 md:h-12 px-2 md:px-4 bg-card hover:bg-accent border-border"
            >
              <Delete className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
