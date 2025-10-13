-- Add hard_mode column to rush_runs
ALTER TABLE public.rush_runs ADD COLUMN IF NOT EXISTS hard_mode boolean NOT NULL DEFAULT false;

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_rush_runs_finished
  ON public.rush_runs (date_local, mode, official_status, score DESC);

CREATE INDEX IF NOT EXISTS idx_rush_runs_hard
  ON public.rush_runs (date_local, mode, hard_mode, official_status, score DESC);

-- View: Best run per user/day/mode
CREATE OR REPLACE VIEW public.rush_best_runs AS
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
  finished_at
FROM public.rush_runs
WHERE official_status = 'finished'
ORDER BY user_id, date_local, mode, score DESC, multiplier_max DESC, finished_at ASC;

-- View: Daily leaderboard with rankings
CREATE OR REPLACE VIEW public.rush_daily_leaderboard AS
SELECT
  date_local,
  mode,
  user_id,
  score,
  multiplier_max,
  hard_mode,
  finished_at,
  ROW_NUMBER() OVER (
    PARTITION BY date_local, mode 
    ORDER BY score DESC, multiplier_max DESC, finished_at ASC
  ) as rank
FROM public.rush_best_runs;

-- RPC function for fetching leaderboard
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
  rank bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT user_id, score, multiplier_max, hard_mode, rank
  FROM public.rush_daily_leaderboard
  WHERE date_local = p_date
    AND mode = p_mode
  ORDER BY rank
  LIMIT p_limit;
$$;