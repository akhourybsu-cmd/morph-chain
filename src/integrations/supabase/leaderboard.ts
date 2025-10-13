import { supabase } from "./client";

export interface LeaderboardEntry {
  user_id: string;
  score: number;
  multiplier_max: number;
  hard_mode: boolean;
  initials: string | null;
  rank: number;
}

export async function fetchDailyLeaderboard(
  dateISO: string, 
  mode: 'daily' | 'practice' = 'daily',
  hardMode?: boolean
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_rush_daily_leaderboard', {
    p_date: dateISO,
    p_mode: mode,
    p_limit: 100,
  });
  
  if (error) throw error;
  
  // Filter by hard mode if specified
  let results = (data || []) as LeaderboardEntry[];
  if (hardMode !== undefined) {
    results = results.filter(entry => entry.hard_mode === hardMode);
  }
  
  return results;
}
