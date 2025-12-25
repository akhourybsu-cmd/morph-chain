import { useState, useEffect, useRef } from "react";
import { isChristmas } from "@/lib/seasonal/christmas";

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
  successfulSubmit?: boolean; // New prop to trigger Christmas flash
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
  successfulSubmit,
}: ChainInputRowProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [shake, setShake] = useState(false);
  const [christmasFlash, setChristmasFlash] = useState(false);

  useEffect(() => {
    if (error) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Trigger Christmas flash on successful submit
  useEffect(() => {
    if (successfulSubmit && isChristmas()) {
      setChristmasFlash(true);
      const timer = setTimeout(() => setChristmasFlash(false), 600);
      return () => clearTimeout(timer);
    }
  }, [successfulSubmit]);

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
        className={`chain-tile chain-tile-input flex items-center justify-center font-serif text-lg md:text-xl font-semibold text-[hsl(var(--chain-text-primary))] ${
          isCurrentPosition ? "chain-tile-cursor" : ""
        } ${shake ? "animate-chain-shake" : ""} ${christmasFlash ? "animate-christmas-flash" : ""}`}
        style={{
          width: 'var(--chain-input-tile-size, 48px)',
          height: 'var(--chain-input-tile-size, 48px)',
        }}
      >
        {letter}
      </div>
    );
  }

  return (
    <div className="px-[var(--chain-h-padding,16px)] py-3">
      <div className="max-w-md mx-auto space-y-2.5">
        {/* Context label */}
        <p className="text-center text-xs text-[hsl(var(--chain-text-muted))] tracking-wide">
          Change one letter from <span className="font-semibold text-[hsl(var(--chain-text-secondary))]">{currentWord}</span>
        </p>

        {/* Input tiles - clickable to focus */}
        <div 
          className="flex justify-center cursor-text"
          style={{ gap: 'var(--chain-gap, 4px)' }}
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
