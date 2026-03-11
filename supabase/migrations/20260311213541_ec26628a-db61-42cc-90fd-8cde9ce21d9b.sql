
-- Add friend_code to user_profiles
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS friend_code text UNIQUE;

-- Generate friend codes for existing profiles
UPDATE public.user_profiles SET friend_code = upper(substr(md5(user_id::text || 'morph'), 1, 6)) WHERE friend_code IS NULL;

-- Friends table
CREATE TABLE public.morphcode_friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  friend_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE public.morphcode_friends ENABLE ROW LEVEL SECURITY;

-- Users can see their own friend entries (sent or received)
CREATE POLICY "Users can view own friend entries" ON public.morphcode_friends
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can insert friend requests
CREATE POLICY "Users can send friend requests" ON public.morphcode_friends
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update friend entries they received (accept/block) or sent (cancel)
CREATE POLICY "Users can update own friend entries" ON public.morphcode_friends
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can delete own friend entries
CREATE POLICY "Users can delete own friend entries" ON public.morphcode_friends
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Presence table
CREATE TABLE public.morphcode_presence (
  user_id uuid PRIMARY KEY,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  is_online boolean NOT NULL DEFAULT true
);

ALTER TABLE public.morphcode_presence ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view presence
CREATE POLICY "Authenticated users can view presence" ON public.morphcode_presence
  FOR SELECT TO authenticated
  USING (true);

-- Users can upsert their own presence
CREATE POLICY "Users can manage own presence" ON public.morphcode_presence
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime on presence
ALTER PUBLICATION supabase_realtime ADD TABLE public.morphcode_presence;

-- Also let users read other profiles' friend_code and display_name
CREATE POLICY "Users can view friend codes" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (true);
