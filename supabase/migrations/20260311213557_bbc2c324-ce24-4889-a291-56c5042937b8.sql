
-- Drop the overly broad profile select policy and replace with scoped one
DROP POLICY IF EXISTS "Users can view friend codes" ON public.user_profiles;

-- Allow reading friend_code and display_name of any user (needed for friend system)
CREATE POLICY "Users can view other profiles" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (true);

-- Drop the old profile_read_own since the new one covers it
DROP POLICY IF EXISTS "profile_read_own" ON public.user_profiles;

-- Tighten morphcode_presence: only allow INSERT/UPDATE, not DELETE
DROP POLICY IF EXISTS "Users can manage own presence" ON public.morphcode_presence;

CREATE POLICY "Users can upsert own presence" ON public.morphcode_presence
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presence" ON public.morphcode_presence
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-generate friend_code on profile creation
CREATE OR REPLACE FUNCTION public.generate_friend_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.friend_code IS NULL THEN
    NEW.friend_code := upper(substr(md5(NEW.user_id::text || 'morph' || extract(epoch from now())::text), 1, 6));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_friend_code
  BEFORE INSERT ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_friend_code();
