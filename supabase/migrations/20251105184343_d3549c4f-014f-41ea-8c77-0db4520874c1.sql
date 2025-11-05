-- Enable leaked password protection
-- This setting is configured via Supabase Auth settings and cannot be done via SQL
-- Instead, we'll add documentation for the admin

-- Create a table to track security configuration status
CREATE TABLE IF NOT EXISTS public.security_config_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_name text NOT NULL UNIQUE,
  is_enabled boolean NOT NULL DEFAULT false,
  notes text,
  last_checked_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on security config status
ALTER TABLE public.security_config_status ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage security config
CREATE POLICY "Only admins can manage security config"
ON public.security_config_status
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert current security settings that need manual configuration
INSERT INTO public.security_config_status (setting_name, is_enabled, notes)
VALUES 
  ('leaked_password_protection', false, 'Needs to be enabled in Auth settings. Visit Settings > Authentication > Password settings and enable "Check password against known leaks"')
ON CONFLICT (setting_name) DO UPDATE
SET notes = EXCLUDED.notes,
    last_checked_at = now();

COMMENT ON TABLE public.security_config_status IS 'Tracks security configuration settings that require manual setup or monitoring';