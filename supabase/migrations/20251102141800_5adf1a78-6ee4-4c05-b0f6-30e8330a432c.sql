-- Create comprehensive analytics views for all games
-- These views retroactively calculate stats from all historical data

-- 1. Morph Chain completions by word length
CREATE OR REPLACE VIEW v_chain_completions AS
SELECT 
  word_length,
  COUNT(*) FILTER (WHERE completed = true) as total_completed,
  COUNT(*) FILTER (WHERE won = true) as total_won,
  COUNT(DISTINCT user_id) FILTER (WHERE completed = true) as unique_completers,
  COUNT(DISTINCT user_id) FILTER (WHERE won = true) as unique_winners,
  ROUND(AVG(CASE WHEN won = true THEN jsonb_array_length(moves) END), 2) as avg_moves_to_win,
  MIN(CASE WHEN won = true THEN jsonb_array_length(moves) END) as best_moves,
  MAX(CASE WHEN won = true THEN jsonb_array_length(moves) END) as worst_moves
FROM player_sessions
GROUP BY word_length;

-- 2. Morph Rush completions by mode
CREATE OR REPLACE VIEW v_rush_completions AS
SELECT 
  mode,
  hard_mode,
  COUNT(*) as total_runs,
  COUNT(*) FILTER (WHERE finished_at IS NOT NULL) as total_completed,
  COUNT(DISTINCT user_id) as unique_players,
  COUNT(DISTINCT user_id) FILTER (WHERE finished_at IS NOT NULL) as unique_completers,
  ROUND(AVG(CASE WHEN finished_at IS NOT NULL THEN score END), 0) as avg_score,
  MAX(CASE WHEN finished_at IS NOT NULL THEN score END) as max_score,
  ROUND(AVG(CASE WHEN finished_at IS NOT NULL THEN multiplier_max END), 2) as avg_max_multiplier,
  MAX(multiplier_max) as best_multiplier
FROM rush_runs
GROUP BY mode, hard_mode;

-- 3. Morph Grid completions
CREATE OR REPLACE VIEW v_grid_completions AS
SELECT 
  COUNT(*) as total_completions,
  COUNT(DISTINCT user_id) as unique_completers,
  ROUND(AVG(moves), 1) as avg_moves,
  MIN(moves) as best_moves,
  MAX(moves) as worst_moves,
  ROUND(AVG(time_to_complete_ms)::numeric / 1000, 1) as avg_time_seconds
FROM grid_daily_leaderboard;

-- 4. Arcade completions
CREATE OR REPLACE VIEW v_arcade_completions AS
SELECT 
  COUNT(*) as total_completions,
  COUNT(DISTINCT user_id) as unique_completers,
  ROUND(AVG(moves), 1) as avg_moves,
  MIN(moves) as best_moves,
  MAX(moves) as worst_moves
FROM arcade_completions;

-- 5. Overall game activity summary
CREATE OR REPLACE VIEW v_overall_activity AS
SELECT 
  'Morph Chain' as game,
  COUNT(*) as sessions_started,
  COUNT(*) FILTER (WHERE completed = true) as sessions_completed,
  COUNT(DISTINCT user_id) as unique_users
FROM player_sessions
UNION ALL
SELECT 
  'Morph Rush' as game,
  COUNT(*) as sessions_started,
  COUNT(*) FILTER (WHERE finished_at IS NOT NULL) as sessions_completed,
  COUNT(DISTINCT user_id) as unique_users
FROM rush_runs
UNION ALL
SELECT 
  'Morph Grid' as game,
  COUNT(*) as sessions_started,
  COUNT(*) as sessions_completed,
  COUNT(DISTINCT user_id) as unique_users
FROM grid_daily_leaderboard
UNION ALL
SELECT 
  'Morph Arcade' as game,
  COUNT(*) as sessions_started,
  COUNT(*) as sessions_completed,
  COUNT(DISTINCT user_id) as unique_users
FROM arcade_completions;

-- 6. User engagement metrics
CREATE OR REPLACE VIEW v_user_engagement AS
SELECT 
  user_id,
  COUNT(DISTINCT CASE WHEN source = 'chain' THEN date_played END) as chain_days_played,
  COUNT(DISTINCT CASE WHEN source = 'rush' THEN date_played END) as rush_days_played,
  COUNT(DISTINCT CASE WHEN source = 'grid' THEN date_played END) as grid_days_played,
  COUNT(DISTINCT date_played) as total_days_played,
  MAX(date_played) as last_active_date
FROM (
  SELECT user_id, DATE(started_at) as date_played, 'chain' as source
  FROM player_sessions
  WHERE user_id IS NOT NULL
  UNION ALL
  SELECT user_id, DATE(started_at) as date_played, 'rush' as source
  FROM rush_runs
  WHERE user_id IS NOT NULL
  UNION ALL
  SELECT user_id, DATE(completed_at) as date_played, 'grid' as source
  FROM grid_daily_leaderboard
  WHERE user_id IS NOT NULL
) all_activity
GROUP BY user_id;

-- Grant read access to authenticated users for analytics views
GRANT SELECT ON v_chain_completions TO authenticated;
GRANT SELECT ON v_rush_completions TO authenticated;
GRANT SELECT ON v_grid_completions TO authenticated;
GRANT SELECT ON v_arcade_completions TO authenticated;
GRANT SELECT ON v_overall_activity TO authenticated;
GRANT SELECT ON v_user_engagement TO authenticated;