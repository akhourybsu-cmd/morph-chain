import { supabase } from "@/integrations/supabase/client";
import { loadStats, saveStats, loadSettings, saveSettings, GameStats, GameSettings } from "./storage";

/**
 * Syncs Morph Chain stats and settings to Supabase
 * Only syncs for authenticated users
 */
export const syncStatsToSupabase = async (): Promise<void> => {
  try {
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
      }], {
        onConflict: 'user_id'
      });

    if (error) {
      console.error("Error syncing stats to backend:", error);
    } else {
      console.log("Stats synced to backend successfully");
    }
  } catch (err) {
    console.error("Exception syncing stats:", err);
  }
};

/**
 * Syncs Morph Chain stats and settings from Supabase
 * Merges cloud data with local (cloud takes precedence)
 */
export const syncStatsFromSupabase = async (): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('user_stats')
      .select('stats, settings')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error("Error loading stats from backend:", error);
      return;
    }

    if (!data) {
      // No data found, sync local to cloud
      await syncStatsToSupabase();
      return;
    }

    if (data.stats && data.settings) {
      // Merge cloud data with local data (cloud wins)
      saveStats(data.stats as unknown as GameStats);
      saveSettings(data.settings as unknown as GameSettings);
      console.log("Stats loaded from backend successfully");
    }
  } catch (err) {
    console.error("Exception loading stats from backend:", err);
  }
};
