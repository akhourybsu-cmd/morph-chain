-- Fix conflicting RLS policies on grid_daily_leaderboard
-- Drop the confusing restrictive policies
DROP POLICY IF EXISTS "Anonymous users see limited leaderboard" ON grid_daily_leaderboard;
DROP POLICY IF EXISTS "Authenticated users can view full leaderboard" ON grid_daily_leaderboard;

-- Create single clear policy for authenticated users
CREATE POLICY "Authenticated users can view leaderboard"
ON grid_daily_leaderboard FOR SELECT
TO authenticated
USING (true);