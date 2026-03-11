
-- Activity feed table for app-wide social features
CREATE TABLE public.app_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  game text NOT NULL,
  activity_type text NOT NULL DEFAULT 'score',
  payload jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fetching friend activity efficiently
CREATE INDEX idx_app_activity_user_id ON public.app_activity (user_id);
CREATE INDEX idx_app_activity_created_at ON public.app_activity (created_at DESC);

-- Enable RLS
ALTER TABLE public.app_activity ENABLE ROW LEVEL SECURITY;

-- Users can insert their own activity
CREATE POLICY "Users can insert own activity"
  ON public.app_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own activity
CREATE POLICY "Users can view own activity"
  ON public.app_activity
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can view activity from their friends
CREATE POLICY "Users can view friend activity"
  ON public.app_activity
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.morphcode_friends
      WHERE status = 'accepted'
        AND (
          (user_id = auth.uid() AND friend_id = app_activity.user_id)
          OR (friend_id = auth.uid() AND user_id = app_activity.user_id)
        )
    )
  );

-- Prevent updates and deletes
CREATE POLICY "No updates on activity"
  ON public.app_activity
  FOR UPDATE
  TO public
  USING (false);

CREATE POLICY "No deletes on activity"
  ON public.app_activity
  FOR DELETE
  TO public
  USING (false);
