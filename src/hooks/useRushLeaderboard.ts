import { useQuery } from '@tanstack/react-query';
import { fetchDailyLeaderboard } from '@/integrations/supabase/leaderboard';
import { formatInTimeZone } from 'date-fns-tz';

export function useRushLeaderboard(mode: 'daily' | 'practice' = 'daily', hardMode?: boolean) {
  const tz = 'America/New_York';
  const dateISO = formatInTimeZone(new Date(), tz, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['rushLeaderboard', dateISO, mode, hardMode],
    queryFn: () => fetchDailyLeaderboard(dateISO, mode, hardMode),
    staleTime: 15_000, // 15s
    refetchInterval: 30_000, // 30s
  });
}
