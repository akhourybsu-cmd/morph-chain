-- Add RLS to rush_daily_leaderboard view
ALTER VIEW public.rush_daily_leaderboard SET (security_invoker = on);

-- Add RLS to rush_best_runs view
ALTER VIEW public.rush_best_runs SET (security_invoker = on);

-- Add RLS to v_user_stats_rush view
ALTER VIEW public.v_user_stats_rush SET (security_invoker = on);

-- Add RLS to arcade_daily_leaderboard view
ALTER VIEW public.arcade_daily_leaderboard SET (security_invoker = on);

-- Note: Views with security_invoker = on will respect RLS policies on the underlying tables.
-- The underlying tables (rush_runs, arcade_completions, user_profiles) already have proper RLS.
-- This ensures that:
-- 1. Anonymous users cannot query these views directly
-- 2. Authenticated users can only see data they're authorized to see via underlying table RLS
-- 3. The existing SECURITY DEFINER functions (get_rush_daily_leaderboard, get_arcade_daily_leaderboard) 
--    remain the safe way to access leaderboard data with controlled output