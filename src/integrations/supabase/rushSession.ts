import { supabase } from "./client";

export interface RushSessionPayload {
  date_local: string;
  session_id: string;
  mode: string;
  score: number;
  multiplier_max: number;
  invalid_count: number;
  hard_mode: boolean;
  words: any[];
}

/**
 * Auto-sync Rush run to backend for authenticated users
 * This ensures stats are tracked even without manual leaderboard submission
 */
export async function upsertRushSession(payload: RushSessionPayload): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return; // Silently skip if not authenticated

  const { error } = await supabase
    .from('rush_runs')
    .upsert({
      user_id: user.id,
      date_local: payload.date_local,
      session_id: payload.session_id,
      mode: payload.mode,
      score: payload.score,
      multiplier_max: payload.multiplier_max,
      invalid_count: payload.invalid_count,
      hard_mode: payload.hard_mode,
      words: payload.words as any,
      official_status: 'finished',
      finished_at: new Date().toISOString(),
    }, {
      onConflict: 'session_id'
    });

  if (error) {
    console.error('Error syncing Rush session:', error);
  } else {
    console.log('Rush session synced to backend');
  }
}
