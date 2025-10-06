import { supabase } from "@/integrations/supabase/client";
import { Move } from "@/components/MoveLog";

export const saveSessionToSupabase = async (
  puzzleDate: string,
  wordLength: number,
  moves: Move[],
  completed: boolean,
  won: boolean,
  hintsUsed: number = 0,
  invalidGuesses: number = 0
) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Generate a unique session ID
  const sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const sessionData = {
    session_id: sessionId,
    user_id: user?.id || null,
    puzzle_date: puzzleDate,
    word_length: wordLength,
    moves: moves.map(m => ({ from: m.from, to: m.to })),
    completed,
    won,
    hints_used: hintsUsed,
    invalid_guesses: invalidGuesses,
    completed_at: completed ? new Date().toISOString() : null
  };

  const { error } = await supabase
    .from('player_sessions')
    .insert(sessionData);

  if (error) {
    console.error("Error saving session to backend:", error);
  }
};
