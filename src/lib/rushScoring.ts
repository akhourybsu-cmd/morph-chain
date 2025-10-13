// Centralized scoring for Morph Rush
import { calculateRarityBonus, calculateBranchBonus, calculateFlowMultiplier } from './rushLogic';

export interface WordScore {
  base: number;
  rarity: number;
  branch: number;
  multiplier: number;
  total: number;
}

export function scoreWord(
  word: string,
  usedWords: Set<string>,
  currentMultiplier: number,
  lastValidTime: number | undefined,
  now: number
): WordScore {
  const base = 100;
  const rarity = calculateRarityBonus(word);
  const branch = calculateBranchBonus(word, usedWords);
  const nextMult = calculateFlowMultiplier(currentMultiplier, lastValidTime, now);
  const total = Math.round((base + rarity + branch) * nextMult);
  
  return { 
    base, 
    rarity, 
    branch, 
    multiplier: nextMult, 
    total 
  };
}
