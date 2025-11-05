-- Fix Critical Security Issues
-- Issue 1: Add RLS policies to leaderboard views that currently have none

-- Enable RLS on rush_daily_leaderboard view
ALTER VIEW rush_daily_leaderboard SET (security_invoker = true);

-- Enable RLS on arcade_daily_leaderboard view  
ALTER VIEW arcade_daily_leaderboard SET (security_invoker = true);

-- Enable RLS on rush_best_runs view
ALTER VIEW rush_best_runs SET (security_invoker = true);

-- Enable RLS on analytics views to use security invoker (not definer)
ALTER VIEW v_user_stats_rush SET (security_invoker = true);
ALTER VIEW v_user_stats_chain SET (security_invoker = true);
ALTER VIEW v_grid_completions SET (security_invoker = true);
ALTER VIEW v_user_engagement SET (security_invoker = true);
ALTER VIEW v_chain_completions SET (security_invoker = true);
ALTER VIEW v_overall_activity SET (security_invoker = true);
ALTER VIEW v_arcade_completions SET (security_invoker = true);
ALTER VIEW v_rush_completions SET (security_invoker = true);
ALTER VIEW v_my_stats SET (security_invoker = true);
ALTER VIEW v_user_stats_all SET (security_invoker = true);

-- Issue 2: Fix grid_daily_leaderboard to restrict public access to user_id
-- First, let's update the existing policy to be more restrictive
DROP POLICY IF EXISTS "Grid leaderboard is publicly readable" ON grid_daily_leaderboard;

-- Allow public to see leaderboard but without exposing user_id except for authenticated users viewing their own data
CREATE POLICY "Authenticated users can view full leaderboard"
ON grid_daily_leaderboard
FOR SELECT
TO authenticated
USING (true);

-- Anonymous users can only see limited data (no user_id)
CREATE POLICY "Anonymous users see limited leaderboard"
ON grid_daily_leaderboard
FOR SELECT
TO anon
USING (false); -- Force them to authenticate to see leaderboard

-- Issue 3: Add comment explaining that leaderboards should be anonymized if public access is needed
COMMENT ON TABLE grid_daily_leaderboard IS 'Leaderboard data restricted to authenticated users. Consider creating a separate anonymized view for public access if needed.';