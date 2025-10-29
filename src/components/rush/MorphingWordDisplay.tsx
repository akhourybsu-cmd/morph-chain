import { useEffect, useState } from "react";

interface MorphingWordDisplayProps {
  word: string;
  previousWord?: string;
}

export const MorphingWordDisplay = ({ word, previousWord }: MorphingWordDisplayProps) => {
  const [animating, setAnimating] = useState(false);
  const [displayWord, setDisplayWord] = useState(word);
  
  useEffect(() => {
    if (previousWord && previousWord !== word) {
      setAnimating(true);
      
      // Brief delay before showing new word
      const timeout = setTimeout(() => {
        setDisplayWord(word);
        setAnimating(false);
      }, 150);
      
      return () => clearTimeout(timeout);
    } else {
      setDisplayWord(word);
    }
  }, [word, previousWord]);
  
  // Find which letter changed
  const changedIndex = previousWord 
    ? word.split('').findIndex((letter, i) => letter !== previousWord[i])
    : -1;
  
  return (
    <div className="text-center">
      <p className="text-xs md:text-sm text-muted-foreground mb-2">Current Word</p>
      <div className="flex justify-center">
        <div className="relative px-6 py-3 rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--muted) / 0.3) 100%)',
            border: '2px solid hsl(var(--border))',
            boxShadow: animating 
              ? '0 0 20px hsl(var(--rush-blue) / 0.3)'
              : '0 4px 12px hsl(var(--background) / 0.5)'
          }}
        >
          {/* Animated highlight background */}
          {animating && (
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-rush-blue/20 to-transparent animate-ripple"
            />
          )}
          
          {/* Letters */}
          <div className="relative flex gap-1.5 md:gap-2">
            {displayWord.split("").map((letter, i) => {
              const isChanged = i === changedIndex && animating;
              
              return (
                <span
                  key={i}
                  className={`text-2xl md:text-3xl font-mono font-bold uppercase transition-all duration-200 ${
                    isChanged ? 'text-rush-orange scale-110' : 'text-foreground'
                  }`}
                  style={{
                    textShadow: isChanged 
                      ? '0 0 8px hsl(var(--rush-orange) / 0.5)'
                      : 'none'
                  }}
                >
                  {letter}
                  {isChanged && (
                    <span className="absolute inset-0 animate-neural-spark">
                      {letter}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
