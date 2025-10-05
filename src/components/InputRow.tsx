import { useState, FormEvent, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface InputRowProps {
  previousWord: string;
  onSubmit: (word: string) => void;
  error?: string;
  disabled?: boolean;
  isLoading?: boolean;
  movesUsed?: number;
  maxMoves?: number;
}

export const InputRow = ({
  previousWord,
  onSubmit,
  error,
  disabled,
  isLoading,
  movesUsed = 0,
  maxMoves = 12,
}: InputRowProps) => {
  const [nextWord, setNextWord] = useState("");
  const [shake, setShake] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount and after submit
  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled, movesUsed]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!nextWord.trim() || disabled || isLoading) return;

    const word = nextWord.trim().toUpperCase();
    setHistory((prev) => [...prev, word]);
    setHistoryIndex(-1);
    onSubmit(word);
    setNextWord("");
  };

  const handleChange = (value: string) => {
    const filtered = value.replace(/[^a-zA-Z]/g, "").toUpperCase();
    setNextWord(filtered);
    setHistoryIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setNextWord("");
      setHistoryIndex(-1);
    } else if (e.key === "ArrowUp" && history.length > 0) {
      e.preventDefault();
      const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
      setHistoryIndex(newIndex);
      setNextWord(history[history.length - 1 - newIndex] || "");
    } else if (e.key === "ArrowDown" && historyIndex > 0) {
      e.preventDefault();
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setNextWord(history[history.length - 1 - newIndex] || "");
    } else if (e.key === "ArrowDown" && historyIndex === 0) {
      e.preventDefault();
      setHistoryIndex(-1);
      setNextWord("");
    }
  };

  useEffect(() => {
    if (error) {
      setShake(true);
      setTimeout(() => setShake(false), 300);
    }
  }, [error]);

  return (
    <div className="px-3 py-3 space-y-2 md:px-6 md:py-4 md:space-y-3">
      <form onSubmit={handleSubmit} className={`space-y-2 md:space-y-3 ${shake ? "animate-shake" : ""}`}>
        <div className="flex gap-1.5 md:gap-2">
          <Input
            value={previousWord}
            disabled
            className="flex-1 font-mono uppercase tracking-tiles bg-muted/30 border-muted cursor-not-allowed text-sm md:text-base h-10 md:h-11"
            placeholder="Previous"
            aria-label="Previous word"
          />
          
          <span className="flex items-center text-lg md:text-2xl text-muted-foreground">→</span>
          
          <Input
            ref={inputRef}
            value={nextWord}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="flex-1 font-mono uppercase tracking-tiles text-sm md:text-base h-10 md:h-11"
            placeholder="..."
            maxLength={previousWord.length}
            aria-describedby={error ? "input-error" : "input-hint"}
            aria-label="Next word"
          />
          
          <Button
            type="submit"
            disabled={!nextWord.trim() || disabled || isLoading}
            className="px-3 min-w-[70px] md:px-6 md:min-w-[100px] text-xs md:text-sm h-10 md:h-11"
          >
            {isLoading ? "..." : "Move"}
          </Button>
        </div>

        <div className="flex items-center justify-between text-xs md:text-sm">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            {error && (
              <div
                id="input-error"
                className="flex items-center gap-1 md:gap-1.5 text-destructive animate-slide-in truncate"
                role="alert"
              >
                <AlertCircle className="h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0" />
                <span className="truncate text-[11px] md:text-sm">{error}</span>
              </div>
            )}
          </div>
          
          <div className="text-muted-foreground font-medium text-xs md:text-sm flex-shrink-0">
            <span className="text-foreground">{movesUsed}</span>
            <span className="mx-0.5 md:mx-1">/</span>
            <span>{maxMoves}</span>
          </div>
        </div>
      </form>

      <div id="input-hint" className="sr-only">
        Change exactly one letter. Press Escape to clear, Arrow keys to cycle history.
      </div>
    </div>
  );
};
