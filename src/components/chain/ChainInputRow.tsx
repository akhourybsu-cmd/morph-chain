import { useState, useEffect, useRef } from "react";

interface ChainInputRowProps {
  currentWord: string;
  wordLength: number;
  currentInput: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  error?: string;
  disabled?: boolean;
  isLoading?: boolean;
  useOnScreenKeyboard?: boolean;
}

export const ChainInputRow = ({
  currentWord,
  wordLength,
  currentInput,
  onInputChange,
  onSubmit,
  error,
  disabled,
  isLoading,
  useOnScreenKeyboard,
}: ChainInputRowProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (error) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (!useOnScreenKeyboard && inputRef.current) {
      inputRef.current.focus();
    }
  }, [useOnScreenKeyboard]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !disabled && !isLoading) {
      onSubmit();
    }
  };

  const handleContainerClick = () => {
    if (!useOnScreenKeyboard && inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Create input tiles
  const inputTiles = [];
  for (let i = 0; i < wordLength; i++) {
    const letter = currentInput[i] || "";
    const isCurrentPosition = i === currentInput.length;
    inputTiles.push(
      <div
        key={i}
        className={`chain-tile chain-tile-input w-12 h-12 md:w-14 md:h-14 flex items-center justify-center font-serif text-xl md:text-2xl font-semibold text-[hsl(var(--chain-text-primary))] ${
          isCurrentPosition ? "chain-tile-cursor" : ""
        } ${shake ? "animate-chain-shake" : ""}`}
      >
        {letter}
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <div className="max-w-md mx-auto space-y-3">
        {/* Context label */}
        <p className="text-center text-xs text-[hsl(var(--chain-text-muted))] tracking-wide">
          Change one letter from <span className="font-semibold text-[hsl(var(--chain-text-secondary))]">{currentWord}</span>
        </p>

        {/* Input tiles - clickable to focus */}
        <div 
          className="flex justify-center gap-1.5 cursor-text"
          onClick={handleContainerClick}
        >
          {inputTiles}
        </div>

        {/* Hidden input for physical keyboard */}
        {!useOnScreenKeyboard && (
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => {
              const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
              if (value.length <= wordLength) {
                onInputChange(value);
              }
            }}
            onKeyDown={handleKeyDown}
            className="absolute opacity-0 pointer-events-none"
            maxLength={wordLength}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            autoFocus
          />
        )}

        {/* Submit button */}
        <div className="flex justify-center pt-1">
          <button
            onClick={onSubmit}
            disabled={disabled || isLoading || currentInput.length !== wordLength}
            className="chain-button px-8 py-2.5 text-sm font-medium tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? "..." : "Morph"}
          </button>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-center text-sm text-[hsl(var(--chain-error))] animate-fade-in">
            {error}
          </p>
        )}
      </div>
    </div>
  );
};
