import { supabase } from "@/integrations/supabase/client";
import { Move } from "@/components/MoveLog";

/**
 * Saves Morph Chain game session to Supabase
 * Only saves for authenticated users
 */
export const saveSessionToSupabase = async (
  puzzleDate: string,
  wordLength: number,
  moves: Move[],
  completed: boolean,
  won: boolean,
  hintsUsed: number = 0,
  invalidGuesses: number = 0
): Promise<{ data?: any; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn("Cannot save session: User not authenticated");
      return { error: "User not authenticated" };
    }
    
    // Generate a unique session ID
    const sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const sessionData = {
      session_id: sessionId,
      user_id: user.id,
      puzzle_date: puzzleDate,
      word_length: wordLength,
      moves: moves.map(m => ({ from: m.from, to: m.to })),
      completed,
      won,
      hints_used: hintsUsed,
      invalid_guesses: invalidGuesses,
      completed_at: completed ? new Date().toISOString() : null
    };

    const { data, error } = await supabase
      .from('player_sessions')
      .insert(sessionData)
      .select();

    if (error) {
      console.error("Error saving session to backend:", error);
      return { error: error.message };
    }

    console.log("Morph Chain session saved successfully");
    return { data };
  } catch (err: any) {
    console.error("Exception while saving session:", err);
    return { error: err.message };
  }
};
