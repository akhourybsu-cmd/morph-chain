import { supabase } from "./client";

export interface LeaderboardEntry {
  user_id: string;
  score: number;
  multiplier_max: number;
  hard_mode: boolean;
  rank: number;
}

export async function fetchDailyLeaderboard(
  dateISO: string, 
  mode: 'daily' | 'practice' = 'daily'
): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_rush_daily_leaderboard', {
    p_date: dateISO,
    p_mode: mode,
    p_limit: 100,
  });
  
  if (error) throw error;
  return (data || []) as LeaderboardEntry[];
}
