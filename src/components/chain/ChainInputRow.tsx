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
  }, [useOnScreenKeyboard, currentWord]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !disabled && !isLoading) {
      onSubmit();
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
        className={`chain-tile chain-tile-input w-10 h-10 md:w-12 md:h-12 flex items-center justify-center font-serif text-lg md:text-xl font-semibold text-[hsl(var(--chain-text-primary))] ${
          isCurrentPosition ? "chain-tile-cursor" : ""
        } ${shake ? "animate-shake" : ""}`}
      >
        {letter}
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <div className="max-w-sm mx-auto space-y-3">
        {/* Current word display */}
        <div className="flex items-center justify-center gap-4">
          {/* From word */}
          <div className="flex gap-1">
            {currentWord.split("").map((letter, i) => (
              <div
                key={i}
                className="chain-tile w-10 h-10 md:w-12 md:h-12 flex items-center justify-center font-serif text-lg md:text-xl font-medium text-[hsl(var(--chain-text-secondary))] opacity-60"
              >
                {letter}
              </div>
            ))}
          </div>

          <span className="text-[hsl(var(--chain-text-muted))] text-xl">→</span>

          {/* Input tiles */}
          <div className="flex gap-1">{inputTiles}</div>
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
            className="sr-only"
            maxLength={wordLength}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
          />
        )}

        {/* Submit button */}
        <div className="flex justify-center">
          <button
            onClick={onSubmit}
            disabled={disabled || isLoading || currentInput.length !== wordLength}
            className="chain-button px-6 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
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
