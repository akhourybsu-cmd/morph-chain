import { useState, useEffect, useCallback } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { supabase } from '@/integrations/supabase/client';
import { SlotValues, computeResult, calculateGameResult, areSlotsComplete, generateShareText, Band } from '@/lib/measured/gameLogic';
import { updateMeasuredStats, loadMeasuredStats } from '@/lib/measured/statsStorage';
import { MeasuredPrestigeHeader } from '@/components/measured/MeasuredPrestigeHeader';
import { MeasuredMenuSheet } from '@/components/measured/MeasuredMenuSheet';
import { MeasuredStats } from '@/components/measured/MeasuredStats';
import { ClueCard } from '@/components/measured/ClueCard';
import { EquationBuilder } from '@/components/measured/EquationBuilder';
import { TileBank } from '@/components/measured/TileBank';
import { RevealPanel } from '@/components/measured/RevealPanel';
import { SubmitConfirmation } from '@/components/measured/SubmitConfirmation';
import { MeasuredHowToPlay } from '@/components/measured/MeasuredHowToPlay';
import { Button } from '@/components/ui/button';
import { Lock, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface DailyPuzzle {
  id: string;
  puzzle_date: string;
  target_value_int: number;
  tiles: number[];
  solution: { A: number; B: number; C: number; D: number };
  difficulty: string;
  fact: {
    clue_text: string;
    unit_label: string;
    rounding_note: string | null;
    reveal_blurb: string;
    source_1: string;
    source_2: string | null;
  };
}

interface ExistingAttempt {
  chosen: { A: number; B: number; C: number; D: number };
  result_value_int: number;
  error_abs_int: number;
  score_int: number;
  band: Band;
  is_exact: boolean;
  share_string: string;
}

export default function Measured() {
  const [puzzle, setPuzzle] = useState<DailyPuzzle | null>(null);
  const [attempt, setAttempt] = useState<ExistingAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<SlotValues>({ A: null, B: null, C: null, D: null });
  const [usedTiles, setUsedTiles] = useState<Set<number>>(new Set());
  const [focusedSlot, setFocusedSlot] = useState<'A' | 'B' | 'C' | 'D' | null>('A');
  const [showConfirm, setShowConfirm] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const today = formatInTimeZone(new Date(), 'America/New_York', 'yyyy-MM-dd');
  const result = computeResult(slots);
  const isComplete = areSlotsComplete(slots);

  useEffect(() => {
    loadPuzzle();
  }, []);

  const loadPuzzle = async () => {
    try {
      // Fetch today's puzzle
      const { data: puzzleData, error: puzzleError } = await supabase
        .from('measured_daily_puzzles')
        .select(`
          id,
          puzzle_date,
          target_value_int,
          tiles,
          solution,
          difficulty,
          measured_fact_bank!inner (
            clue_text,
            unit_label,
            rounding_note,
            reveal_blurb,
            source_1,
            source_2
          )
        `)
        .eq('puzzle_date', today)
        .eq('is_published', true)
        .single();

      if (puzzleError || !puzzleData) {
        setLoading(false);
        return;
      }

      const formattedPuzzle: DailyPuzzle = {
        id: puzzleData.id,
        puzzle_date: puzzleData.puzzle_date,
        target_value_int: puzzleData.target_value_int,
        tiles: puzzleData.tiles as number[],
        solution: puzzleData.solution as { A: number; B: number; C: number; D: number },
        difficulty: puzzleData.difficulty,
        fact: puzzleData.measured_fact_bank as DailyPuzzle['fact'],
      };

      setPuzzle(formattedPuzzle);

      // Check for existing attempt
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: attemptData } = await supabase
          .from('measured_attempts')
          .select('*')
          .eq('puzzle_id', puzzleData.id)
          .eq('user_id', user.id)
          .single();

        if (attemptData) {
          setAttempt({
            chosen: attemptData.chosen as ExistingAttempt['chosen'],
            result_value_int: attemptData.result_value_int,
            error_abs_int: attemptData.error_abs_int,
            score_int: attemptData.score_int,
            band: attemptData.band as Band,
            is_exact: attemptData.is_exact,
            share_string: attemptData.share_string,
          });
          
          // Hydrate full stats from database attempt if not already counted today
          // This syncs stats if user completed on another device or stats were lost
          const stats = loadMeasuredStats();
          if (stats.lastPlayedDate !== today) {
            updateMeasuredStats({
              score: attemptData.score_int,
              band: attemptData.band as Band,
              isExact: attemptData.is_exact,
              error: attemptData.error_abs_int,
              targetValue: formattedPuzzle.target_value_int,
            });
          }
        }
      }
    } catch (e) {
      console.error('Error loading puzzle:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleTileSelect = useCallback((tile: number, index: number) => {
    if (usedTiles.has(index) || !focusedSlot) return;

    setSlots(prev => ({ ...prev, [focusedSlot]: tile }));
    setUsedTiles(prev => new Set(prev).add(index));

    // Auto-advance to next empty slot
    const slotOrder: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    const currentIndex = slotOrder.indexOf(focusedSlot);
    for (let i = 1; i <= 4; i++) {
      const nextSlot = slotOrder[(currentIndex + i) % 4];
      if (slots[nextSlot] === null && nextSlot !== focusedSlot) {
        setFocusedSlot(nextSlot);
        return;
      }
    }
    setFocusedSlot(null);
  }, [focusedSlot, slots, usedTiles]);

  const handleSlotClear = useCallback((slot: 'A' | 'B' | 'C' | 'D') => {
    const value = slots[slot];
    if (value === null || !puzzle) return;

    // Find the tile index
    const tileIndex = puzzle.tiles.findIndex((t, i) => t === value && usedTiles.has(i));
    if (tileIndex !== -1) {
      setUsedTiles(prev => {
        const next = new Set(prev);
        next.delete(tileIndex);
        return next;
      });
    }
    setSlots(prev => ({ ...prev, [slot]: null }));
    setFocusedSlot(slot);
  }, [slots, puzzle, usedTiles]);

  const handleReset = () => {
    setSlots({ A: null, B: null, C: null, D: null });
    setUsedTiles(new Set());
    setFocusedSlot('A');
  };

  const handleSubmit = async () => {
    if (!puzzle || !isComplete) return;
    
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to submit');
        setSubmitting(false);
        return;
      }

      const gameResult = calculateGameResult(slots, puzzle.target_value_int);
      if (!gameResult) {
        setSubmitting(false);
        return;
      }

      const shareString = generateShareText(puzzle.puzzle_date, gameResult.band);

      const { error } = await supabase
        .from('measured_attempts')
        .insert({
          user_id: user.id,
          puzzle_id: puzzle.id,
          chosen: { A: slots.A, B: slots.B, C: slots.C, D: slots.D },
          result_value_int: gameResult.result,
          error_abs_int: gameResult.error,
          score_int: gameResult.score,
          band: gameResult.band,
          is_exact: gameResult.isExact,
          share_string: shareString,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('You already submitted today');
        } else {
          toast.error('Failed to submit');
        }
        setSubmitting(false);
        return;
      }

      // Update local stats
      updateMeasuredStats({
        score: gameResult.score,
        band: gameResult.band,
        isExact: gameResult.isExact,
        error: gameResult.error,
        targetValue: puzzle.target_value_int,
      });

      setAttempt({
        chosen: { A: slots.A!, B: slots.B!, C: slots.C!, D: slots.D! },
        result_value_int: gameResult.result,
        error_abs_int: gameResult.error,
        score_int: gameResult.score,
        band: gameResult.band,
        is_exact: gameResult.isExact,
        share_string: shareString,
      });
    } catch (e) {
      toast.error('Submission failed');
    } finally {
      setSubmitting(false);
      setShowConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-measured-page flex flex-col">
        <MeasuredPrestigeHeader onMenuClick={() => setShowMenu(true)} onHelpClick={() => setShowHowToPlay(true)} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-measured-text-secondary">Loading...</div>
        </div>
        <MeasuredMenuSheet open={showMenu} onOpenChange={setShowMenu} onStatsClick={() => setShowStats(true)} />
        <MeasuredStats open={showStats} onOpenChange={setShowStats} />
      </div>
    );
  }

  if (!puzzle) {
    return (
      <div className="min-h-screen bg-measured-page flex flex-col">
        <MeasuredPrestigeHeader onMenuClick={() => setShowMenu(true)} onHelpClick={() => setShowHowToPlay(true)} />
        <div className="max-w-lg mx-auto p-6">
          <div className="bg-measured-card border border-measured-card-border rounded-2xl p-8 text-center">
            <h2 className="text-xl font-semibold text-measured-text-primary mb-2">
              Today's puzzle is not available yet.
            </h2>
            <p className="text-measured-text-secondary">Please check back soon.</p>
          </div>
        </div>
        <MeasuredMenuSheet open={showMenu} onOpenChange={setShowMenu} onStatsClick={() => setShowStats(true)} />
        <MeasuredStats open={showStats} onOpenChange={setShowStats} />
      </div>
    );
  }

  // Show reveal state if already attempted
  if (attempt) {
    return (
      <div className="min-h-screen bg-measured-page flex flex-col">
        <MeasuredPrestigeHeader onMenuClick={() => setShowMenu(true)} onHelpClick={() => setShowHowToPlay(true)} />
        <RevealPanel
          attempt={attempt}
          puzzle={puzzle}
        />
        <MeasuredMenuSheet open={showMenu} onOpenChange={setShowMenu} onStatsClick={() => setShowStats(true)} />
        <MeasuredHowToPlay open={showHowToPlay} onOpenChange={setShowHowToPlay} />
        <MeasuredStats open={showStats} onOpenChange={setShowStats} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-measured-page flex flex-col">
      <MeasuredPrestigeHeader onMenuClick={() => setShowMenu(true)} onHelpClick={() => setShowHowToPlay(true)} />
      
      <div className="max-w-lg mx-auto p-4 space-y-4">
        <ClueCard
          clueText={puzzle.fact.clue_text}
          unitLabel={puzzle.fact.unit_label}
          roundingNote={puzzle.fact.rounding_note}
        />

        <EquationBuilder
          slots={slots}
          result={result}
          focusedSlot={focusedSlot}
          onSlotFocus={setFocusedSlot}
          onSlotClear={handleSlotClear}
        />

        <TileBank
          tiles={puzzle.tiles}
          usedTiles={usedTiles}
          onTileSelect={handleTileSelect}
        />

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1 border-measured-card-border text-measured-text-secondary"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={() => setShowConfirm(true)}
            disabled={!isComplete}
            className="flex-1 bg-measured-accent hover:bg-measured-accent/90 text-white"
          >
            <Lock className="w-4 h-4 mr-2" />
            Submit
          </Button>
        </div>

        <p className="text-center text-xs text-measured-text-muted">
          One guess per day. No decimals.
        </p>
      </div>

      <SubmitConfirmation
        open={showConfirm}
        onOpenChange={setShowConfirm}
        onConfirm={handleSubmit}
        submitting={submitting}
        result={result}
      />

      <MeasuredMenuSheet open={showMenu} onOpenChange={setShowMenu} onStatsClick={() => setShowStats(true)} />
      <MeasuredHowToPlay open={showHowToPlay} onOpenChange={setShowHowToPlay} />
      <MeasuredStats open={showStats} onOpenChange={setShowStats} />
    </div>
  );
}
