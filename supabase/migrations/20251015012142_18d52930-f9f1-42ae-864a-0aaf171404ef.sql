-- Fix SECURITY DEFINER views issue
-- Convert rush_best_runs, rush_daily_leaderboard, and arcade_daily_leaderboard to security_invoker

-- Drop and recreate rush_best_runs with security_invoker
DROP VIEW IF EXISTS public.rush_daily_leaderboard CASCADE;
DROP VIEW IF EXISTS public.rush_best_runs CASCADE;
DROP VIEW IF EXISTS public.arcade_daily_leaderboard CASCADE;

-- Recreate rush_best_runs with security_invoker
CREATE OR REPLACE VIEW public.rush_best_runs
WITH (security_invoker = true) AS
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
  finished_at,
  initials
FROM public.rush_runs
WHERE official_status = 'finished'
ORDER BY user_id, date_local, mode, score DESC, multiplier_max DESC, finished_at ASC;

-- Recreate rush_daily_leaderboard with security_invoker
CREATE OR REPLACE VIEW public.rush_daily_leaderboard
WITH (security_invoker = true) AS
SELECT
  date_local,
  mode,
  user_id,
  score,
  multiplier_max,
  hard_mode,
  finished_at,
  initials,
  ROW_NUMBER() OVER (
    PARTITION BY date_local, mode 
    ORDER BY score DESC, multiplier_max DESC, finished_at ASC
  ) as rank
FROM public.rush_best_runs;

-- Recreate arcade_daily_leaderboard with security_invoker
CREATE OR REPLACE VIEW public.arcade_daily_leaderboard
WITH (security_invoker = true) AS
SELECT 
  ac.user_id,
  ac.date_local,
  ac.moves,
  ac.completed_at,
  up.default_initials as initials,
  ROW_NUMBER() OVER (
    PARTITION BY ac.date_local 
    ORDER BY ac.moves ASC, ac.completed_at ASC
  ) as rank
FROM public.arcade_completions ac
LEFT JOIN public.user_profiles up ON ac.user_id = up.user_id
WHERE ac.user_id IS NOT NULL
ORDER BY ac.date_local DESC, ac.moves ASC, ac.completed_at ASC;