-- Fix leaderboard functions to prevent unlimited data extraction
-- Add hard limits and improve security

-- Update rush daily leaderboard function
CREATE OR REPLACE FUNCTION public.get_rush_daily_leaderboard(
  p_date date,
  p_mode text,
  p_limit integer DEFAULT 100
)
RETURNS TABLE(
  user_id uuid,
  score integer,
  multiplier_max numeric,
  hard_mode boolean,
  initials text,
  rank bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT user_id, score, multiplier_max, hard_mode, initials, rank
  FROM public.rush_daily_leaderboard
  WHERE date_local = p_date
    AND mode = p_mode
  ORDER BY rank
  LIMIT LEAST(p_limit, 100);  -- Hard cap at 100 rows
$$;

-- Update arcade daily leaderboard function
CREATE OR REPLACE FUNCTION public.get_arcade_daily_leaderboard(
  p_date date,
  p_limit integer DEFAULT 100
)
RETURNS TABLE(
  user_id uuid,
  moves integer,
  completed_at timestamp with time zone,
  initials text,
  rank bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT user_id, moves, completed_at, initials, rank
  FROM public.arcade_daily_leaderboard
  WHERE date_local = p_date
  ORDER BY rank
  LIMIT LEAST(p_limit, 100);  -- Hard cap at 100 rows
$$;

-- Remove redundant RLS policy from player_sessions
DROP POLICY IF EXISTS "Block anonymous access to sessions" ON player_sessions;

-- Make avatars bucket private for better security
UPDATE storage.buckets 
SET public = false 
WHERE id = 'avatars';

-- Add read policy for authenticated users to view avatars
DROP POLICY IF EXISTS "Users can view avatars" ON storage.objects;
CREATE POLICY "Users can view avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');