-- Add initials column to rush_runs for arcade-style leaderboard
ALTER TABLE public.rush_runs ADD COLUMN IF NOT EXISTS initials text;

-- Create index for leaderboard queries by initials
CREATE INDEX IF NOT EXISTS idx_rush_runs_initials 
  ON public.rush_runs (date_local, mode, initials, score DESC) 
  WHERE initials IS NOT NULL;

-- Update the leaderboard view to include initials
DROP VIEW IF EXISTS public.rush_daily_leaderboard CASCADE;
DROP VIEW IF EXISTS public.rush_best_runs CASCADE;

-- Drop the old function to change its signature
DROP FUNCTION IF EXISTS public.get_rush_daily_leaderboard(date, text, integer);

-- View: Best run per user/day/mode (with initials)
CREATE OR REPLACE VIEW public.rush_best_runs
WITH (security_invoker = on)
AS
SELECT DISTINCT ON (user_id, date_local, mode)
  id,
  user_id,
  session_id,
  date_local,
  mode,
  score,
  multiplier_max,
  invalid_count,
  hard_mode,
  initials,
  finished_at
FROM public.rush_runs
WHERE official_status = 'finished'
ORDER BY user_id, date_local, mode, score DESC, multiplier_max DESC, finished_at ASC;

-- View: Daily leaderboard with rankings (including initials)
CREATE OR REPLACE VIEW public.rush_daily_leaderboard
WITH (security_invoker = on)
AS
SELECT
  date_local,
  mode,
  user_id,
  score,
  multiplier_max,
  hard_mode,
  initials,
  finished_at,
  ROW_NUMBER() OVER (
    PARTITION BY date_local, mode 
    ORDER BY score DESC, multiplier_max DESC, finished_at ASC
  ) as rank
FROM public.rush_best_runs
WHERE initials IS NOT NULL;

-- Create new RPC function with initials
CREATE OR REPLACE FUNCTION public.get_rush_daily_leaderboard(
  p_date date, 
  p_mode text, 
  p_limit int DEFAULT 100
)
RETURNS TABLE(
  user_id uuid, 
  score int, 
  multiplier_max numeric, 
  hard_mode boolean,
  initials text,
  rank bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT user_id, score, multiplier_max, hard_mode, initials, rank
  FROM public.rush_daily_leaderboard
  WHERE date_local = p_date
    AND mode = p_mode
  ORDER BY rank
  LIMIT p_limit;
$$;