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
    // Remove color feedback - just show neutral styling for all keys
    return "bg-card hover:bg-accent text-foreground border-border";
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-1.5 md:space-y-2 pb-2 pt-1 select-none px-1 md:px-2">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div 
          key={rowIndex} 
          className="flex justify-center gap-1 md:gap-1.5"
          style={{
            paddingLeft: rowIndex === 1 ? '1.25rem' : rowIndex === 2 ? '2.5rem' : '0',
            paddingRight: rowIndex === 1 ? '1.25rem' : rowIndex === 2 ? '2.5rem' : '0',
          }}
        >
          {rowIndex === 2 && (
            <Button
              onClick={onEnter}
              disabled={disabled}
              className="h-11 md:h-12 min-w-[3.5rem] md:min-w-[4rem] px-2 md:px-3 font-bold text-xs md:text-sm bg-gradient-to-r from-chain to-chain hover:opacity-90 text-white flex-shrink-0"
            >
              ENTER
            </Button>
          )}
          
          {row.map((key) => (
            <Button
              key={key}
              onClick={() => onKeyPress(key)}
              disabled={disabled}
              className={`h-11 md:h-12 min-w-[1.75rem] md:min-w-[2.25rem] flex-1 max-w-[2.5rem] md:max-w-[3rem] px-0 md:px-1 font-bold text-base md:text-lg transition-all ${getKeyStyle(key)} border`}
            >
              {key}
            </Button>
          ))}
          
          {rowIndex === 2 && (
            <Button
              onClick={onBackspace}
              disabled={disabled}
              variant="outline"
              className="h-11 md:h-12 min-w-[2rem] md:min-w-[2.5rem] px-1 md:px-2 bg-card hover:bg-accent border-border flex-shrink-0"
            >
              <Delete className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
