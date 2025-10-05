import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface InputRowProps {
  previousWord: string;
  onSubmit: (word: string) => void;
  error?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export const InputRow = ({
  previousWord,
  onSubmit,
  error,
  disabled,
  isLoading,
}: InputRowProps) => {
  const [nextWord, setNextWord] = useState("");
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!nextWord.trim() || disabled || isLoading) return;

    if (error) {
      setShake(true);
      setTimeout(() => setShake(false), 300);
    }

    onSubmit(nextWord.trim().toUpperCase());
  };

  const handleChange = (value: string) => {
    // Only allow letters
    const filtered = value.replace(/[^a-zA-Z]/g, "").toUpperCase();
    setNextWord(filtered);
  };

  return (
    <div className="px-6 py-4 space-y-3">
      <form onSubmit={handleSubmit} className={`flex gap-2 ${shake ? "animate-shake" : ""}`}>
        <Input
          value={previousWord}
          disabled
          className="flex-1 font-mono uppercase tracking-tiles bg-muted/30 border-muted cursor-not-allowed"
          placeholder="Previous word"
        />
        
        <Input
          value={nextWord}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          className="flex-1 font-mono uppercase tracking-tiles"
          placeholder="Next word"
          maxLength={previousWord.length}
          autoFocus
          aria-describedby={error ? "input-error" : undefined}
        />
        
        <Button
          type="submit"
          disabled={!nextWord.trim() || disabled || isLoading}
          className="px-6"
        >
          {isLoading ? "..." : "Submit"}
        </Button>
      </form>

      {error && (
        <div
          id="input-error"
          className="flex items-center gap-2 text-sm text-destructive animate-slide-in"
          role="alert"
        >
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {!previousWord && !error && (
        <p className="text-sm text-muted-foreground animate-slide-in">
          Change ONE letter each step (e.g., COLD → CORD)
        </p>
      )}
    </div>
  );
};
