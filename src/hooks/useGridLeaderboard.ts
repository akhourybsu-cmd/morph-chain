import { useQuery } from '@tanstack/react-query';
import { fetchGridDailyLeaderboard } from '@/integrations/supabase/gridLeaderboard';
import { formatInTimeZone } from 'date-fns-tz';

export function useGridLeaderboard() {
  const tz = 'America/New_York';
  const dateISO = formatInTimeZone(new Date(), tz, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['gridLeaderboard', dateISO],
    queryFn: async () => {
      try {
        return await fetchGridDailyLeaderboard(dateISO);
      } catch (error) {
        console.error('Error fetching Grid leaderboard:', error);
        throw error;
      }
    },
    staleTime: 15_000, // 15s
    refetchInterval: 30_000, // 30s
    retry: 2,
  });
}
