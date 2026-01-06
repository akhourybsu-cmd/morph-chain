// MEASURED - Core Game Logic
// All calculations use integers only - no decimals

export type Band = 'Dead On' | 'Sharp' | 'Close' | 'Warm' | 'Wide';

export interface SlotValues {
  A: number | null;
  B: number | null;
  C: number | null;
  D: number | null;
}

export interface GameResult {
  result: number;
  target: number;
  error: number;
  score: number;
  band: Band;
  isExact: boolean;
}

/**
 * Compute the equation result: (A × B) + C − D
 * Returns null if any slot is empty
 */
export function computeResult(slots: SlotValues): number | null {
  if (slots.A === null || slots.B === null || slots.C === null || slots.D === null) {
    return null;
  }
  return (slots.A * slots.B) + slots.C - slots.D;
}

/**
 * Calculate the score based on how close the result is to the target
 * Score is 0-100, integers only
 */
export function calculateScore(result: number, target: number): number {
  const error = Math.abs(result - target);
  
  if (error === 0) {
    return 100;
  }
  
  // Scale is 2% of target, minimum 1
  const scale = Math.max(1, Math.round(target * 0.02));
  
  // Raw score calculation
  const raw = 100 - Math.round(50 * (error / scale));
  
  // Clamp to 0-100
  return Math.max(0, Math.min(100, raw));
}

/**
 * Get the band label based on score
 */
export function getBand(score: number): Band {
  if (score === 100) return 'Dead On';
  if (score >= 90) return 'Sharp';
  if (score >= 70) return 'Close';
  if (score >= 40) return 'Warm';
  return 'Wide';
}

/**
 * Get the emoji row for the share string based on band
 */
export function getBandEmoji(band: Band): string {
  switch (band) {
    case 'Dead On': return '🟩🟩🟩🟩';
    case 'Sharp': return '🟦🟦🟦🟦';
    case 'Close': return '🟨🟨🟨🟨';
    case 'Warm': return '🟧🟧🟧🟧';
    case 'Wide': return '🟥🟥🟥🟥';
  }
}

/**
 * Generate the spoiler-free share string
 */
export function generateShareText(date: string, band: Band): string {
  return `Measured · ${date}\n${getBandEmoji(band)}  ${band}`;
}

/**
 * Calculate the full game result from player's submission
 */
export function calculateGameResult(
  slots: SlotValues,
  target: number
): GameResult | null {
  const result = computeResult(slots);
  
  if (result === null) {
    return null;
  }
  
  const error = Math.abs(result - target);
  const score = calculateScore(result, target);
  const band = getBand(score);
  const isExact = result === target;
  
  return {
    result,
    target,
    error,
    score,
    band,
    isExact,
  };
}

/**
 * Check if all slots are filled
 */
export function areSlotsComplete(slots: SlotValues): boolean {
  return slots.A !== null && slots.B !== null && slots.C !== null && slots.D !== null;
}

/**
 * Format the equation display string
 */
export function formatEquation(slots: SlotValues, result: number | null): string {
  const a = slots.A !== null ? slots.A.toString() : '□';
  const b = slots.B !== null ? slots.B.toString() : '□';
  const c = slots.C !== null ? slots.C.toString() : '□';
  const d = slots.D !== null ? slots.D.toString() : '□';
  const r = result !== null ? result.toString() : '?';
  
  return `${a} × ${b} + ${c} − ${d} = ${r}`;
}
