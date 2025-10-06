-- Block anonymous access to player_sessions table
-- This prevents unauthenticated users from viewing gameplay data
CREATE POLICY "Block anonymous access to sessions"
ON player_sessions
FOR SELECT
TO anon
USING (false);