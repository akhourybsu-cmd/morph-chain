-- Make user_id NOT NULL for security-sensitive tables
-- This ensures all game completions and sessions are properly attributed to authenticated users

-- First, we need to delete any existing rows with NULL user_id
-- These are orphaned anonymous records that cannot be properly attributed
DELETE FROM player_sessions WHERE user_id IS NULL;
DELETE FROM arcade_completions WHERE user_id IS NULL;
DELETE FROM rush_runs WHERE user_id IS NULL;

-- Now make the columns NOT NULL
ALTER TABLE player_sessions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE arcade_completions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE rush_runs ALTER COLUMN user_id SET NOT NULL;

-- Update RLS policies to remove the NULL user_id checks since they're no longer possible

-- arcade_completions: Update the INSERT policy
DROP POLICY IF EXISTS "Users can insert own arcade completions" ON arcade_completions;
CREATE POLICY "Users can insert own arcade completions" 
ON arcade_completions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- arcade_completions: Update the SELECT policy
DROP POLICY IF EXISTS "Users can view own arcade completions" ON arcade_completions;
CREATE POLICY "Users can view own arcade completions" 
ON arcade_completions 
FOR SELECT 
USING (auth.uid() = user_id);

-- rush_runs: Update the INSERT policy
DROP POLICY IF EXISTS "Users can insert own runs" ON rush_runs;
CREATE POLICY "Users can insert own runs" 
ON rush_runs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- rush_runs: Update the SELECT policy
DROP POLICY IF EXISTS "Users can view own runs" ON rush_runs;
CREATE POLICY "Users can view own runs" 
ON rush_runs 
FOR SELECT 
USING (auth.uid() = user_id);

-- rush_runs: Update the UPDATE policy  
DROP POLICY IF EXISTS "Users can update own runs" ON rush_runs;
CREATE POLICY "Users can update own runs" 
ON rush_runs 
FOR UPDATE 
USING (auth.uid() = user_id);