import { useQuery } from '@tanstack/react-query';
import { fetchArcadeDailyLeaderboard } from '@/integrations/supabase/arcadeLeaderboard';
import { formatInTimeZone } from 'date-fns-tz';

export function useArcadeLeaderboard() {
  const tz = 'America/New_York';
  const dateISO = formatInTimeZone(new Date(), tz, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['arcadeLeaderboard', dateISO],
    queryFn: async () => {
      try {
        return await fetchArcadeDailyLeaderboard(dateISO);
      } catch (error) {
        console.error('Error fetching Arcade leaderboard:', error);
        throw error;
      }
    },
    staleTime: 15_000, // 15s
    refetchInterval: 30_000, // 30s
    retry: 2,
  });
}
