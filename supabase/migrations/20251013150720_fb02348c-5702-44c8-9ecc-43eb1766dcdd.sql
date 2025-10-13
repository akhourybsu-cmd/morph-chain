-- 1) USER PROFILE TABLE
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  default_initials text CHECK (default_initials ~ '^[A-Za-z0-9]{0,3}$'),
  avatar_path text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Owner can read own profile
CREATE POLICY "profile_read_own"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Owner can insert own row
CREATE POLICY "profile_insert_own"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Owner can update own row
CREATE POLICY "profile_update_own"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2) AVATAR STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: owner-only writes to {user_id}/...
CREATE POLICY "avatars_write_own_path"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (name LIKE auth.uid()::text || '/%')
);

CREATE POLICY "avatars_update_own_path"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (name LIKE auth.uid()::text || '/%')
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (name LIKE auth.uid()::text || '/%')
);

CREATE POLICY "avatars_delete_own_path"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (name LIKE auth.uid()::text || '/%')
);

CREATE POLICY "avatars_read_public"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- 3) USER STATS VIEW FOR RUSH
CREATE OR REPLACE VIEW public.v_user_stats_rush AS
SELECT
  user_id,
  COUNT(*)::int AS plays,
  COALESCE(MAX(score), 0)::int AS best_score,
  ROUND(AVG(score))::int AS avg_score,
  COALESCE(MAX(multiplier_max), 0)::numeric AS best_multiplier,
  COALESCE(SUM(EXTRACT(EPOCH FROM (finished_at - started_at)) * 1000), 0)::bigint AS total_ms
FROM public.rush_runs
WHERE user_id IS NOT NULL AND finished_at IS NOT NULL
GROUP BY user_id;

-- 4) USER STATS VIEW FOR CHAIN
CREATE OR REPLACE VIEW public.v_user_stats_chain AS
SELECT
  user_id,
  COUNT(*)::int AS plays,
  COALESCE(MIN(CASE WHEN won THEN jsonb_array_length(moves) END), 0)::int AS best_moves,
  COALESCE(SUM(CASE WHEN completed THEN 1 ELSE 0 END), 0)::int AS clears,
  COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000)), 0)::int AS avg_time_ms
FROM public.player_sessions
WHERE user_id IS NOT NULL AND completed_at IS NOT NULL
GROUP BY user_id;

-- 5) COMBINED STATS VIEW
CREATE OR REPLACE VIEW public.v_user_stats_all AS
SELECT
  u.id AS user_id,
  COALESCE(r.plays, 0) AS rush_plays,
  COALESCE(r.best_score, 0) AS rush_best_score,
  COALESCE(r.avg_score, 0) AS rush_avg_score,
  COALESCE(r.best_multiplier, 0) AS rush_best_multiplier,
  COALESCE(r.total_ms, 0) AS rush_time_ms,
  COALESCE(c.plays, 0) AS chain_plays,
  COALESCE(c.best_moves, 0) AS chain_best_moves,
  COALESCE(c.clears, 0) AS chain_clears,
  COALESCE(c.avg_time_ms, 0) AS chain_avg_time_ms
FROM auth.users u
LEFT JOIN v_user_stats_rush r ON r.user_id = u.id
LEFT JOIN v_user_stats_chain c ON c.user_id = u.id;

-- 6) MY STATS VIEW (filtered to current user)
CREATE OR REPLACE VIEW public.v_my_stats AS
SELECT *
FROM public.v_user_stats_all
WHERE user_id = auth.uid();