import { Band, getBandEmoji } from '@/lib/measured/gameLogic';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Copy, Share2, Check } from 'lucide-react';
import { useState } from 'react';
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
      <div className="bg-measured-card border border-measured-card-border rounded-2xl p-5 text-center">
        <div className={cn("inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-3", BAND_COLORS[attempt.band])}>
          {attempt.band}
        </div>
        <div className="text-5xl font-bold text-measured-text-primary mb-2">
          {attempt.score_int}
        </div>
        <p className="text-measured-text-muted text-sm mb-4">
          Off by {attempt.error_abs_int.toLocaleString()}
        </p>
        <Progress value={attempt.score_int} className="h-2" />
        
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-measured-card-border">
          <div>
            <p className="text-xs text-measured-text-muted">Your result</p>
            <p className="text-xl font-bold text-measured-text-primary">
              {attempt.result_value_int.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-measured-text-muted">True value</p>
            <p className="text-xl font-bold text-measured-accent">
              {puzzle.target_value_int.toLocaleString()} {puzzle.fact.unit_label}
            </p>
          </div>
        </div>
      </div>

      {/* Perfect Solution */}
      <div className="bg-measured-card border border-measured-card-border rounded-2xl p-5">
        <h3 className="text-xs font-medium text-measured-text-muted uppercase tracking-wider mb-3">
          Exact Solution
        </h3>
        <p className="text-lg font-mono text-measured-text-primary">
          {puzzle.solution.A} × {puzzle.solution.B} + {puzzle.solution.C} − {puzzle.solution.D} = {puzzle.target_value_int}
        </p>
        <p className="text-xs text-measured-text-muted mt-2">
          One exact arrangement exists.
        </p>
      </div>

      {/* About */}
      <div className="bg-measured-card border border-measured-card-border rounded-2xl p-5">
        <h3 className="text-xs font-medium text-measured-text-muted uppercase tracking-wider mb-3">
          About today's measure
        </h3>
        <p className="text-measured-text-secondary leading-relaxed">
          {puzzle.fact.reveal_blurb}
        </p>
        <div className="mt-3 text-xs text-measured-text-muted space-y-1">
          <p>Source: {puzzle.fact.source_1}</p>
          {puzzle.fact.source_2 && <p>Source: {puzzle.fact.source_2}</p>}
        </div>
      </div>

      {/* Share */}
      <div className="bg-measured-card border border-measured-card-border rounded-2xl p-5">
        <h3 className="text-xs font-medium text-measured-text-muted uppercase tracking-wider mb-3">
          Share your result
        </h3>
        <div className="bg-measured-tile-bg rounded-lg p-3 font-mono text-sm text-measured-text-primary whitespace-pre-line mb-4">
          {attempt.share_string}
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCopy} variant="outline" className="flex-1">
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <Button onClick={handleShare} className="flex-1 bg-measured-accent hover:bg-measured-accent/90">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}
