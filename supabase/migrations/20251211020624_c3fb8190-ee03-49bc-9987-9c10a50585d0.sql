-- Fix v_user_stats_chain to properly count wins (won=true) instead of just completed sessions
-- Drop dependent views first

DROP VIEW IF EXISTS public.v_my_stats CASCADE;
DROP VIEW IF EXISTS public.v_user_stats_all CASCADE;
DROP VIEW IF EXISTS public.v_user_stats_chain CASCADE;

-- Recreate v_user_stats_chain with proper wins count
CREATE OR REPLACE VIEW public.v_user_stats_chain
WITH (security_invoker = true) AS
SELECT
  user_id,
  COUNT(*)::int AS plays,
  COALESCE(MIN(CASE WHEN won THEN jsonb_array_length(moves) END), 0)::int AS best_moves,
  COALESCE(SUM(CASE WHEN won THEN 1 ELSE 0 END), 0)::int AS wins,
  COALESCE(ROUND(AVG(CASE WHEN completed THEN EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000 END)), 0)::int AS avg_time_ms
FROM public.player_sessions
WHERE user_id IS NOT NULL
GROUP BY user_id;

-- Recreate v_user_stats_all
CREATE OR REPLACE VIEW public.v_user_stats_all
WITH (security_invoker = true) AS
SELECT
  p.user_id,
  COALESCE(r.plays, 0) AS rush_plays,
  COALESCE(r.best_score, 0) AS rush_best_score,
  COALESCE(r.avg_score, 0) AS rush_avg_score,
  COALESCE(r.best_multiplier, 0) AS rush_best_multiplier,
  COALESCE(r.total_ms, 0) AS rush_time_ms,
  COALESCE(c.plays, 0) AS chain_plays,
  COALESCE(c.best_moves, 0) AS chain_best_moves,
  COALESCE(c.wins, 0) AS chain_wins,
  COALESCE(c.avg_time_ms, 0) AS chain_avg_time_ms
FROM public.user_profiles p
LEFT JOIN v_user_stats_rush r ON r.user_id = p.user_id
LEFT JOIN v_user_stats_chain c ON c.user_id = p.user_id;

-- Recreate v_my_stats
CREATE OR REPLACE VIEW public.v_my_stats
WITH (security_invoker = true) AS
SELECT *
FROM public.v_user_stats_all
WHERE user_id = auth.uid();