import { Button } from "@/components/ui/button";
import { Delete } from "lucide-react";

interface ChromaKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  disabled?: boolean;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK']
];

export const ChromaKeyboard = ({ onKeyPress, onBackspace, onEnter, disabled }: ChromaKeyboardProps) => {
  const handleClick = (key: string) => {
    if (disabled) return;
    
    if (key === 'ENTER') {
      onEnter();
    } else if (key === 'BACK') {
      onBackspace();
    } else {
      onKeyPress(key);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-2">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex justify-center gap-1">
          {row.map((key) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              onClick={() => handleClick(key)}
              disabled={disabled}
              className={key === 'ENTER' || key === 'BACK' ? 'px-4' : 'w-8 sm:w-10 h-12'}
            >
              {key === 'BACK' ? <Delete className="h-4 w-4" /> : key}
            </Button>
          ))}
        </div>
      ))}
    </div>
  );
};
