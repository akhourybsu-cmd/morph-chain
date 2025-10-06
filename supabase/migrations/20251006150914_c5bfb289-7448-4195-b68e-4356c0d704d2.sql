-- ================================
-- ADMIN ROLES & SECURITY
-- ================================

-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table (CRITICAL: separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents recursive RLS issues)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ================================
-- PUZZLE MANAGEMENT
-- ================================

-- Puzzle status enum
CREATE TYPE public.puzzle_status AS ENUM ('draft', 'preview', 'live', 'disabled', 'completed');

-- Puzzle variants (graph type)
CREATE TYPE public.puzzle_variant AS ENUM ('delta1', 'delta2', 'delta2_first');

-- Admin puzzles table (master puzzle database)
CREATE TABLE public.admin_puzzles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word_length INTEGER NOT NULL CHECK (word_length IN (4, 5, 6)),
  start_word TEXT NOT NULL,
  goal_word TEXT NOT NULL,
  variant public.puzzle_variant NOT NULL,
  min_distance INTEGER NOT NULL,
  max_moves INTEGER NOT NULL,
  shortest_path_count INTEGER,
  avg_branching_factor DECIMAL(5,2),
  health_score INTEGER, -- 0-100, based on quality metrics
  theme_tags TEXT[],
  status public.puzzle_status NOT NULL DEFAULT 'draft',
  scheduled_date DATE,
  puzzle_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (word_length, start_word, goal_word)
);

-- Enable RLS
ALTER TABLE public.admin_puzzles ENABLE ROW LEVEL SECURITY;

-- RLS: Admins only
CREATE POLICY "Only admins can manage puzzles"
ON public.admin_puzzles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Dictionary management
CREATE TABLE public.admin_dictionary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL UNIQUE,
  word_length INTEGER NOT NULL,
  is_banned BOOLEAN NOT NULL DEFAULT false,
  ban_reason TEXT,
  frequency_score INTEGER,
  complaint_count INTEGER DEFAULT 0,
  first_seen DATE,
  last_seen DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_dictionary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage dictionary"
ON public.admin_dictionary
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Audit log
CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view audit log"
ON public.admin_audit_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can insert audit log"
ON public.admin_audit_log
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- ================================
-- CONFIGURATION & FEATURE FLAGS
-- ================================

-- Configuration table
CREATE TABLE public.admin_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage config"
ON public.admin_config
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Feature flags
CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage feature flags"
ON public.feature_flags
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ================================
-- PLAYER SUPPORT & ANALYTICS
-- ================================

-- Player sessions (for support/debugging)
CREATE TABLE public.player_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id TEXT NOT NULL,
  puzzle_date DATE NOT NULL,
  word_length INTEGER NOT NULL,
  moves JSONB NOT NULL DEFAULT '[]',
  hints_used INTEGER DEFAULT 0,
  invalid_guesses INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  won BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.player_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
ON public.player_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
ON public.player_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
ON public.player_sessions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ================================
-- INDEXES & TRIGGERS
-- ================================

-- Indexes for performance
CREATE INDEX idx_admin_puzzles_date ON public.admin_puzzles(scheduled_date);
CREATE INDEX idx_admin_puzzles_status ON public.admin_puzzles(status);
CREATE INDEX idx_admin_puzzles_length ON public.admin_puzzles(word_length);
CREATE INDEX idx_player_sessions_user ON public.player_sessions(user_id);
CREATE INDEX idx_player_sessions_date ON public.player_sessions(puzzle_date);
CREATE INDEX idx_audit_log_user ON public.admin_audit_log(user_id);
CREATE INDEX idx_audit_log_created ON public.admin_audit_log(created_at DESC);

-- Updated timestamp triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_puzzles_updated_at
BEFORE UPDATE ON public.admin_puzzles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_dictionary_updated_at
BEFORE UPDATE ON public.admin_dictionary
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_config_updated_at
BEFORE UPDATE ON public.admin_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at
BEFORE UPDATE ON public.feature_flags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();