import { supabase } from "./client";

export interface GridSessionPayload {
  date_local: string;
  session_id: string;
  moves: number;
  words_used: number;
  time_to_complete_ms?: number;
  completed: boolean;
  won: boolean;
}

/**
 * Start or update a grid session in the backend
 */
export async function upsertGridSession(payload: GridSessionPayload): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return; // Silently skip if not authenticated

  const { error } = await supabase
    .from('grid_sessions')
    .upsert({
      user_id: user.id,
      date_local: payload.date_local,
      session_id: payload.session_id,
      moves: payload.moves,
      words_used: payload.words_used,
      time_to_complete_ms: payload.time_to_complete_ms || null,
      completed: payload.completed,
      won: payload.won,
      completed_at: payload.completed ? new Date().toISOString() : null,
    }, {
      onConflict: 'user_id,date_local'
    });

  if (error) {
    console.error('Error syncing grid session:', error);
  }
}

/**
 * Check if a grid session exists for a date
 */
export async function checkGridSessionExists(dateISO: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('grid_sessions')
    .select('id')
    .eq('user_id', user.id)
    .eq('date_local', dateISO)
    .maybeSingle();

  if (error) {
    console.error('Error checking grid session:', error);
    return false;
  }

  return !!data;
}
