import { supabase } from "./client";

export interface GridLeaderboardEntry {
  user_id: string;
  moves: number;
  words_used: number;
  time_to_complete_ms: number | null;
  completed_at: string;
  initials: string | null;
  rank: number;
}

export async function fetchGridDailyLeaderboard(
  dateISO: string
): Promise<GridLeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_grid_daily_leaderboard', {
    p_date: dateISO,
    p_limit: 100,
  });
  
  if (error) throw error;
  
  return (data || []) as GridLeaderboardEntry[];
}

export async function submitGridScore(payload: {
  date_local: string;
  moves: number;
  words_used: number;
  time_to_complete_ms?: number;
  initials?: string;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Must be authenticated to submit score');

  const { error } = await supabase
    .from('grid_daily_leaderboard')
    .insert({
      user_id: user.id,
      date_local: payload.date_local,
      moves: payload.moves,
      words_used: payload.words_used,
      time_to_complete_ms: payload.time_to_complete_ms || null,
      initials: payload.initials || null,
    });

  if (error) {
    // Check if it's a duplicate submission error
    if (error.code === '23505') {
      throw new Error('You have already submitted a score for today');
    }
    throw error;
  }
}

export async function checkGridSubmissionExists(dateISO: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('grid_daily_leaderboard')
    .select('id')
    .eq('user_id', user.id)
    .eq('date_local', dateISO)
    .maybeSingle();

  if (error) {
    console.error('Error checking Grid submission:', error);
    return false;
  }

  return !!data;
}
