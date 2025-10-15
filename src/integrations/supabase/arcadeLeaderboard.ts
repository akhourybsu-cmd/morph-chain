import { supabase } from "./client";

export interface ArcadeLeaderboardEntry {
  user_id: string;
  moves: number;
  completed_at: string;
  initials: string | null;
  rank: number;
}

export async function fetchArcadeDailyLeaderboard(
  dateISO: string
): Promise<ArcadeLeaderboardEntry[]> {
  const { data, error } = await supabase.rpc('get_arcade_daily_leaderboard', {
    p_date: dateISO,
    p_limit: 100,
  });
  
  if (error) throw error;
  
  return (data || []) as ArcadeLeaderboardEntry[];
}
