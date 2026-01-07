import { Band, getBandEmoji } from '@/lib/measured/gameLogic';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Copy, Share2, Check, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RevealPanelProps {
  attempt: {
    chosen: { A: number; B: number; C: number; D: number };
    result_value_int: number;
    error_abs_int: number;
    score_int: number;
    band: Band;
    is_exact: boolean;
    share_string: string;
  };
  puzzle: {
    target_value_int: number;
    solution: { A: number; B: number; C: number; D: number };
    fact: {
      unit_label: string;
      reveal_blurb: string;
      source_1: string;
      source_2: string | null;
    };
  };
}

const BAND_COLORS: Record<Band, string> = {
  'Dead On': 'bg-measured-band-exact text-white',
  'Sharp': 'bg-measured-band-sharp text-white',
  'Close': 'bg-measured-band-close text-black',
  'Warm': 'bg-measured-band-warm text-white',
  'Wide': 'bg-measured-band-wide text-white',
};

export function RevealPanel({ attempt, puzzle }: RevealPanelProps) {
  const [copied, setCopied] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (attempt.band === 'Dead On') {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [attempt.band]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(attempt.share_string);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ text: attempt.share_string });
    } else {
      handleCopy();
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4 space-y-4">
      {/* Score Summary */}
      <div className={cn(
        "bg-measured-card border border-measured-card-border rounded-2xl p-6 text-center shadow-sm relative overflow-hidden",
        attempt.band === 'Dead On' && "ring-2 ring-measured-band-exact/50"
      )}>
        {/* Celebration effect for Dead On */}
        {showCelebration && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-2 left-4 animate-bounce delay-100">
              <Sparkles className="w-5 h-5 text-measured-band-exact" />
            </div>
            <div className="absolute top-4 right-6 animate-bounce delay-300">
              <Sparkles className="w-4 h-4 text-measured-band-exact" />
            </div>
            <div className="absolute bottom-6 left-8 animate-bounce delay-500">
              <Sparkles className="w-3 h-3 text-measured-band-exact" />
            </div>
            <div className="absolute bottom-4 right-4 animate-bounce delay-200">
              <Sparkles className="w-4 h-4 text-measured-band-exact" />
            </div>
          </div>
        )}
        
        <div className={cn(
          "inline-block px-5 py-2 rounded-full text-sm font-bold mb-4 shadow-sm",
          BAND_COLORS[attempt.band]
        )}>
          {attempt.band}
        </div>
        <div className={cn(
          "text-6xl font-bold text-measured-text-primary mb-2 tabular-nums",
          attempt.band === 'Dead On' && "text-measured-band-exact"
        )}>
          {attempt.score_int}
        </div>
        {attempt.is_exact ? (
          <p className="text-measured-band-exact text-sm font-medium mb-4">
            Perfect! Exact match!
          </p>
        ) : (
          <p className="text-measured-text-muted text-sm mb-4">
            Off by {attempt.error_abs_int.toLocaleString()}
          </p>
        )}
        <Progress value={attempt.score_int} className="h-2" />
        
        <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-measured-card-border">
          <div>
            <p className="text-xs text-measured-text-muted mb-1">Your result</p>
            <p className="text-2xl font-bold text-measured-text-primary tabular-nums">
              {attempt.result_value_int.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-measured-text-muted mb-1">True value</p>
            <p className="text-2xl font-bold text-measured-accent tabular-nums">
              {puzzle.target_value_int.toLocaleString()}
            </p>
            <p className="text-xs text-measured-text-muted">{puzzle.fact.unit_label}</p>
          </div>
        </div>
      </div>

      {/* Perfect Solution */}
      <div className="bg-measured-card border border-measured-card-border rounded-2xl p-5 shadow-sm">
        <h3 className="text-[11px] font-semibold text-measured-text-muted uppercase tracking-widest mb-3">
          Exact Solution
        </h3>
        <p className="text-lg md:text-xl font-mono text-measured-text-primary tabular-nums">
          {puzzle.solution.A} × {puzzle.solution.B} + {puzzle.solution.C} − {puzzle.solution.D} = {puzzle.target_value_int.toLocaleString()}
        </p>
        <p className="text-xs text-measured-text-muted mt-2 opacity-70">
          One exact arrangement exists.
        </p>
      </div>

      {/* About */}
      <div className="bg-measured-card border border-measured-card-border rounded-2xl p-5 shadow-sm">
        <h3 className="text-[11px] font-semibold text-measured-text-muted uppercase tracking-widest mb-3">
          About today's measure
        </h3>
        <p className="text-measured-text-secondary leading-relaxed text-sm md:text-base">
          {puzzle.fact.reveal_blurb}
        </p>
        <div className="mt-4 pt-3 border-t border-measured-card-border/50 text-xs text-measured-text-muted space-y-0.5">
          <p className="opacity-70">Source: {puzzle.fact.source_1}</p>
          {puzzle.fact.source_2 && <p className="opacity-70">Source: {puzzle.fact.source_2}</p>}
        </div>
      </div>

      {/* Share */}
      <div className="bg-measured-card border border-measured-card-border rounded-2xl p-5 shadow-sm">
        <h3 className="text-[11px] font-semibold text-measured-text-muted uppercase tracking-widest mb-3">
          Share your result
        </h3>
        <div className="bg-measured-tile-bg rounded-xl p-4 font-mono text-sm text-measured-text-primary whitespace-pre-line mb-4 border border-measured-tile-border">
          {attempt.share_string}
        </div>
        <div className="flex gap-3">
          <Button onClick={handleCopy} variant="outline" className="flex-1 h-11 border-measured-card-border">
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button onClick={handleShare} className="flex-1 h-11 bg-measured-accent hover:bg-measured-accent/90 shadow-sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}
