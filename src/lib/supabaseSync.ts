import { supabase } from "@/integrations/supabase/client";
import { loadStats, saveStats, loadSettings, saveSettings, GameStats, GameSettings } from "./storage";

export const syncStatsToSupabase = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const stats = loadStats();
  const settings = loadSettings();

  const { error } = await supabase
    .from('user_stats')
    .upsert([{
      user_id: user.id,
      stats: stats as any,
      settings: settings as any,
    }]);

  if (error) {
    console.error("Error syncing stats to backend:", error);
  }
};

export const syncStatsFromSupabase = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from('user_stats')
    .select('stats, settings')
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No data found, sync local to cloud
      await syncStatsToSupabase();
      return;
    }
    console.error("Error loading stats from backend:", error);
    return;
  }

  if (data && data.stats && data.settings) {
    // Merge cloud data with local data (cloud wins)
    saveStats(data.stats as unknown as GameStats);
    saveSettings(data.settings as unknown as GameSettings);
  }
};
