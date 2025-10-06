import { supabase } from "@/integrations/supabase/client";
import { Puzzle } from "./gameLogic";

// Cache for daily puzzle to prevent excessive API calls
const PUZZLE_CACHE_KEY = 'morph_chain_daily_puzzle';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

interface CachedPuzzle {
  puzzle: Puzzle;
  timestamp: number;
  date: string;
}

/**
 * Load daily puzzle from secure backend
 * Uses caching to prevent excessive API calls
 */
export const loadSecureDailyPuzzle = async (wordLength: 4 | 5 | 6 = 4): Promise<Puzzle> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Check cache first
    const cached = localStorage.getItem(PUZZLE_CACHE_KEY);
    if (cached) {
      try {
        const { puzzle, timestamp, date }: CachedPuzzle = JSON.parse(cached);
        
        // Return cached puzzle if it's for today and still fresh
        if (date === today && Date.now() - timestamp < CACHE_DURATION) {
          console.log('Using cached puzzle');
          return puzzle;
        }
      } catch (e) {
        console.warn('Invalid puzzle cache, fetching new one');
      }
    }

    console.log('Fetching new puzzle from backend...');

    // Get current session for auth
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Authentication required to load puzzles');
    }

    // Call secure Edge Function
    const { data, error } = await supabase.functions.invoke('get-daily-puzzle', {
      body: { wordLength }
    });

    if (error) {
      console.error('Failed to load puzzle:', error);
      throw new Error('Failed to load puzzle: ' + error.message);
    }

    if (!data || !data.start || !data.goal) {
      throw new Error('Invalid puzzle data received');
    }

    const puzzle: Puzzle = {
      startWord: data.start,
      goalWord: data.goal,
      minDistance: data.minDistance,
      maxMoves: data.maxMoves,
      date: data.date,
      wordLength: wordLength
    };

    // Cache the puzzle
    const cacheData: CachedPuzzle = {
      puzzle,
      timestamp: Date.now(),
      date: today
    };
    
    localStorage.setItem(PUZZLE_CACHE_KEY, JSON.stringify(cacheData));
    
    console.log('Puzzle loaded and cached successfully');
    
    return puzzle;

  } catch (error: any) {
    console.error('Error loading secure puzzle:', error);
    throw new Error('Failed to load daily puzzle. Please try again.');
  }
};

/**
 * Clear puzzle cache (useful for testing or manual refresh)
 */
export const clearPuzzleCache = () => {
  localStorage.removeItem(PUZZLE_CACHE_KEY);
};

/**
 * Validate word using secure backend
 */
export const validateWordSecure = async (word: string, wordLength: number): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.warn('No session for word validation');
      return false;
    }

    const { data, error } = await supabase.functions.invoke('validate-word', {
      body: { word: word.toUpperCase(), wordLength }
    });

    if (error) {
      console.error('Word validation error:', error);
      return false;
    }

    return data?.valid === true;

  } catch (error) {
    console.error('Error validating word:', error);
    return false;
  }
};
