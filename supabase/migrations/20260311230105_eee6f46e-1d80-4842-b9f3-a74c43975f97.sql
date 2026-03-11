
CREATE TABLE public.morphcode_stats (
  user_id uuid PRIMARY KEY NOT NULL,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  draws integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.morphcode_stats ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view stats (needed for VS screen)
CREATE POLICY "Anyone can view morphcode stats"
ON public.morphcode_stats FOR SELECT
TO authenticated
USING (true);

-- Users can upsert own stats
CREATE POLICY "Users can insert own stats"
ON public.morphcode_stats FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
ON public.morphcode_stats FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
