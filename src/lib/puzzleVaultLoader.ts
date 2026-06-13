// Puzzle Vault Loader - fetches puzzles from database with curated fallback
import { supabase } from '@/integrations/supabase/client';
import { CURATED_4L_PUZZLES } from './curatedPuzzles4L';
import { CURATED_5L_PUZZLES } from './curatedPuzzles5L';

export interface VaultPuzzle {
  id: string;
  startWord: string;
  goalWord: string;
  minDistance: number;
  puzzleIndex: number;
  wordLength: number;
}

// Cache for loaded puzzles
const puzzleCache = new Map<string, VaultPuzzle>();

// Get the puzzle index for a given date (days since game launch).
// Uses the same launch date as getDailyPuzzle() so vault and curated
// fallback serve puzzles from the same position in their respective lists.
function getPuzzleIndexForDate(date: Date): number {
  const launchDate = new Date('2025-10-06T00:00:00');
  const diffTime = date.getTime() - launchDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays); // clamp — no negative indices before launch
}

// Load puzzle from vault or fallback to curated
export async function loadDailyPuzzle(
  wordLength: 4 | 5,
  date: Date = new Date()
): Promise<VaultPuzzle> {
  const dateStr = date.toISOString().split('T')[0];
  const cacheKey = `${wordLength}-${dateStr}`;
  
  // Check cache first
  if (puzzleCache.has(cacheKey)) {
    return puzzleCache.get(cacheKey)!;
  }

  const puzzleIndex = getPuzzleIndexForDate(date);

  try {
    // Try to load from vault first
    const { data, error } = await supabase
      .from('admin_puzzle_vault')
      .select('id, start_word, goal_word, min_distance, puzzle_index')
      .eq('word_length', wordLength)
      .eq('is_active', true)
      .order('puzzle_index', { ascending: true });

    if (!error && data && data.length > 0) {
      // Use modulo to cycle through available puzzles
      const vaultIndex = puzzleIndex % data.length;
      const puzzle = data[vaultIndex];
      
      const result: VaultPuzzle = {
        id: puzzle.id,
        startWord: puzzle.start_word.toUpperCase(),
        goalWord: puzzle.goal_word.toUpperCase(),
        minDistance: puzzle.min_distance,
        puzzleIndex: puzzleIndex + 1, // 1-indexed for display
        wordLength,
      };

      // Update last_served_date (fire and forget)
      supabase
        .from('admin_puzzle_vault')
        .update({ last_served_date: dateStr })
        .eq('id', puzzle.id)
        .then(() => {});

      puzzleCache.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.warn('Failed to load from vault, using curated fallback:', err);
  }

  // Fallback to curated puzzles
  const curatedPuzzles = wordLength === 4 ? CURATED_4L_PUZZLES : CURATED_5L_PUZZLES;
  const curatedIndex = puzzleIndex % curatedPuzzles.length;
  const curated = curatedPuzzles[curatedIndex];

  const result: VaultPuzzle = {
    id: `curated-${wordLength}-${curatedIndex}`,
    startWord: curated.start.toUpperCase(),
    goalWord: curated.goal.toUpperCase(),
    minDistance: curated.minDist || 4,
    puzzleIndex: puzzleIndex + 1,
    wordLength,
  };

  puzzleCache.set(cacheKey, result);
  return result;
}

// Get vault statistics
export async function getVaultStats(): Promise<{ 
  vault4L: number; 
  vault5L: number;
  curated4L: number;
  curated5L: number;
}> {
  try {
    const { data, error } = await supabase
      .from('admin_puzzle_vault')
      .select('word_length')
      .eq('is_active', true);

    if (error) throw error;

    return {
      vault4L: data?.filter(p => p.word_length === 4).length || 0,
      vault5L: data?.filter(p => p.word_length === 5).length || 0,
      curated4L: CURATED_4L_PUZZLES.length,
      curated5L: CURATED_5L_PUZZLES.length,
    };
  } catch {
    return {
      vault4L: 0,
      vault5L: 0,
      curated4L: CURATED_4L_PUZZLES.length,
      curated5L: CURATED_5L_PUZZLES.length,
    };
  }
}

// Clear the puzzle cache (useful for testing or admin operations)
export function clearPuzzleCache(): void {
  puzzleCache.clear();
}
