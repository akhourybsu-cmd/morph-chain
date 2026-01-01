import React from 'react';
import { AlibiPuzzle, AlibiStats, DifficultyTier } from '@/lib/alibi/types';
import { loadStats } from '@/lib/alibi/storage';
import { Button } from '@/components/ui/button';
import { Share2, RotateCcw, Lightbulb, Award } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface AlibiResultsPanelProps {
  puzzle: AlibiPuzzle;
  elapsedTime: number;
  consistencyChecks: number;
  onPlayAgain?: () => void;
  isPractice?: boolean;
}

// V3.0: Difficulty badge colors
function getDifficultyBadge(difficulty?: DifficultyTier) {
  switch (difficulty) {
    case 'easy': return { label: 'Easy', className: 'bg-green-500/20 text-green-600 border-green-500/30' };
    case 'medium': return { label: 'Medium', className: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30' };
    case 'hard': return { label: 'Hard', className: 'bg-red-500/20 text-red-600 border-red-500/30' };
    default: return null;
  }
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function getDetectiveRank(consistencyChecks: number): { title: string; emoji: string } {
  if (consistencyChecks === 0) {
    return { title: 'Ace Detective', emoji: '🕵️' };
  } else if (consistencyChecks <= 2) {
    return { title: 'Solid Sleuth', emoji: '🔍' };
  } else if (consistencyChecks <= 5) {
    return { title: 'Clue Chaser', emoji: '📋' };
  } else {
    return { title: 'Case Closed', emoji: '✅' };
  }
}

/**
 * Generate key insight text based on puzzle validation data (Rule 15)
 */
function generateKeyInsight(puzzle: AlibiPuzzle): string | null {
  // Try to extract from validation data
  if (puzzle.validation?.keyInsight?.description) {
    // Clean up the reasoning text for player-friendly display
    const desc = puzzle.validation.keyInsight.description;
    
    // Extract the key elements from cross-category reasoning
    if (desc.includes('Cross-category')) {
      const match = desc.match(/Cross-category: (.+)/);
      if (match) {
        return match[1];
      }
    }
    
    return desc;
  }
  
  // Generate a generic insight based on the solution
  const { solution, people, locations, times, objects } = puzzle;
  
  // Find an interesting connection
  for (const person of people) {
    const location = solution.personToLocation[person];
    const object = solution.personToObject[person];
    const time = solution.personToTime[person];
    
    // Look for a cross-category pattern
    if (location && object) {
      return `The ${object} and ${location} pointed to the same person.`;
    }
    if (location && time) {
      return `The timing at ${time} connected to the ${location}.`;
    }
  }
  
  return null;
}

export function AlibiResultsPanel({
  puzzle,
  elapsedTime,
  consistencyChecks,
  onPlayAgain,
  isPractice = false,
}: AlibiResultsPanelProps) {
  const stats = loadStats();
  const rank = getDetectiveRank(consistencyChecks);
  const keyInsight = generateKeyInsight(puzzle);

  // Generate narrative recap
  const generateNarrative = () => {
    const narratives: string[] = [];
    for (const person of puzzle.people) {
      const location = puzzle.solution.personToLocation[person];
      const time = puzzle.solution.personToTime[person];
      const object = puzzle.solution.personToObject[person];
      narratives.push(`${person} was at the ${location} at ${time} with the ${object}.`);
    }
    return narratives;
  };

  const handleShare = async () => {
    const shareText = [
      `Solved Alibi #${puzzle.index} in ${formatTime(elapsedTime)}`,
      `${consistencyChecks === 0 ? '🕵️ Perfect!' : `${consistencyChecks} check${consistencyChecks > 1 ? 's' : ''} used`}`,
      `${rank.emoji} ${rank.title}`,
      '',
      'morphchaingame.com/alibi'
    ].join('\n');

    try {
      if (navigator.share) {
        await navigator.share({ text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        toast({
          title: 'Copied to clipboard!',
          description: 'Share your results with friends.',
        });
      }
    } catch (e) {
      console.error('Failed to share:', e);
    }
  };

  const difficultyBadge = getDifficultyBadge(puzzle.difficulty);

  return (
    <div className="bg-alibi-card-bg border border-alibi-divider rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="text-4xl mb-2">{rank.emoji}</div>
        <h2 className="font-serif text-2xl text-alibi-text-primary mb-1">
          Case Solved!
        </h2>
        <p className="text-alibi-accent font-medium">{rank.title}</p>
        {/* V3.0: Difficulty Badge */}
        {difficultyBadge && (
          <Badge variant="outline" className={`mt-2 ${difficultyBadge.className}`}>
            <Award className="h-3 w-3 mr-1" />
            {difficultyBadge.label}
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-serif text-alibi-text-primary">
            {formatTime(elapsedTime)}
          </div>
          <div className="text-xs text-alibi-text-muted uppercase tracking-wide">
            Time
          </div>
        </div>
        <div>
          <div className="text-2xl font-serif text-alibi-text-primary">
            {consistencyChecks}
          </div>
          <div className="text-xs text-alibi-text-muted uppercase tracking-wide">
            Checks
          </div>
        </div>
        <div>
          <div className="text-2xl font-serif text-alibi-text-primary">
            {stats.currentStreak}
          </div>
          <div className="text-xs text-alibi-text-muted uppercase tracking-wide">
            Streak
          </div>
        </div>
      </div>

      {/* Key Insight (Rule 15: Post-Solve Reinforcement) */}
      {keyInsight && (
        <div className="border-t border-alibi-divider pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-alibi-accent" />
            <h3 className="text-sm font-semibold text-alibi-accent uppercase tracking-wide">
              Key Insight
            </h3>
          </div>
          <p className="text-sm text-alibi-text-secondary italic">
            {keyInsight}
          </p>
        </div>
      )}

      {/* Narrative Recap */}
      <div className="border-t border-alibi-divider pt-4">
        <h3 className="text-sm font-semibold text-alibi-text-secondary uppercase tracking-wide mb-3">
          The Truth
        </h3>
        <div className="space-y-2">
          {generateNarrative().map((line, i) => (
            <p key={i} className="text-sm text-alibi-text-primary">
              {line}
            </p>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button
          onClick={handleShare}
          className="w-full bg-alibi-accent hover:bg-alibi-accent/90 text-white"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share Results
        </Button>
        
        {isPractice && onPlayAgain && (
          <Button
            variant="outline"
            onClick={onPlayAgain}
            className="w-full border-alibi-divider"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            New Practice Puzzle
          </Button>
        )}
      </div>
    </div>
  );
}