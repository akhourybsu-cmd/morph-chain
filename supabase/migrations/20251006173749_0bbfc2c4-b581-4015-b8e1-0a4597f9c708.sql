-- Phase 1: Critical Security Fixes

-- 1. Lock down audit logs - make them truly append-only
CREATE POLICY "Prevent audit log modification"
ON admin_audit_log
FOR UPDATE
USING (false);

CREATE POLICY "Prevent audit log deletion"
ON admin_audit_log
FOR DELETE
USING (false);

-- 2. Fix RLS policy gaps for user_roles
CREATE POLICY "Prevent unauthorized role deletion"
ON user_roles
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- 3. Fix player_sessions policies
CREATE POLICY "Users can update own sessions"
ON player_sessions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Prevent session deletion by users"
ON player_sessions
FOR DELETE
USING (false);

CREATE POLICY "Admins can delete sessions"
ON player_sessions
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- 4. Protect user_stats from deletion
CREATE POLICY "Prevent stats deletion"
ON user_stats
FOR DELETE
USING (false);

-- Phase 2: Proprietary Data Protection

-- Create table for storing puzzles securely
CREATE TABLE IF NOT EXISTS admin_puzzle_vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word_length integer NOT NULL,
  start_word text NOT NULL,
  goal_word text NOT NULL,
  min_distance integer NOT NULL,
  puzzle_index integer NOT NULL,
  theme_tags text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(word_length, puzzle_index)
);

-- Enable RLS on puzzle vault
ALTER TABLE admin_puzzle_vault ENABLE ROW LEVEL SECURITY;

-- Only admins can manage puzzles
CREATE POLICY "Admins can manage puzzle vault"
ON admin_puzzle_vault
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  last_request timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS on rate limits
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can view their own rate limits
CREATE POLICY "Users can view own rate limits"
ON api_rate_limits
FOR SELECT
USING (auth.uid() = user_id);

-- System can manage rate limits (via service role)
CREATE POLICY "Service role can manage rate limits"
ON api_rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Create function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  _user_id uuid,
  _endpoint text,
  _max_requests integer DEFAULT 10,
  _window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_count integer;
  _window_start timestamptz;
BEGIN
  -- Get or create rate limit record
  INSERT INTO api_rate_limits (user_id, endpoint, request_count, window_start, last_request)
  VALUES (_user_id, _endpoint, 1, now(), al())
  ON CONFLICT (user_id, endpoint)
  DO UPDATE SET
    request_count = CASE
      WHEN api_rate_limits.window_start < now() - (_window_minutes || ' minutes')::interval
      THEN 1
      ELSE api_rate_limits.request_count + 1
    END,
    window_start = CASE
      WHEN api_rate_limits.window_start < now() - (_window_minutes || ' minutes')::interval
      THEN now()
      ELSE api_rate_limits.window_start
    END,
    last_request = now()
  RETURNING request_count, window_start INTO _current_count, _window_start;

  -- Check if rate limit exceeded
  RETURN _current_count <= _max_requests;
END;
$$;

-- Create audit trigger for suspicious activity
CREATE TABLE IF NOT EXISTS security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  ip_address text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security alerts"
ON security_alerts
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can create security alerts"
ON security_alerts
FOR INSERT
WITH CHECK (true);