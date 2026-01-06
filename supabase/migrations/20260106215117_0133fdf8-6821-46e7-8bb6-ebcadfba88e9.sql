-- =============================================
-- MEASURED ADMIN SUITE: COMPLETE DATABASE SCHEMA
-- =============================================

-- 1. Add columns to measured_fact_bank for auto-ingestion tracking
ALTER TABLE public.measured_fact_bank 
ADD COLUMN IF NOT EXISTS source_candidate_id uuid,
ADD COLUMN IF NOT EXISTS is_auto_ingested boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS last_used_date date,
ADD COLUMN IF NOT EXISTS times_used integer NOT NULL DEFAULT 0;

-- 2. Create measured_fact_candidates table for auto-ingested facts
CREATE TABLE IF NOT EXISTS public.measured_fact_candidates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_name text NOT NULL DEFAULT 'wikidata',
  source_entity_id text,
  source_property_id text,
  raw_value numeric NOT NULL,
  raw_unit text,
  normalized_value_int integer NOT NULL,
  unit_label text NOT NULL,
  category text NOT NULL,
  clue_text text NOT NULL,
  reveal_blurb text NOT NULL,
  title text NOT NULL,
  sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  reference_count integer NOT NULL DEFAULT 0,
  confidence_score numeric(3,2) NOT NULL DEFAULT 0.00,
  sanity_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'new',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  CONSTRAINT valid_status CHECK (status IN ('new', 'needs_review', 'approved', 'blocked')),
  CONSTRAINT valid_confidence CHECK (confidence_score >= 0 AND confidence_score <= 1)
);

-- 3. Create measured_category_usage table for diversity tracking
CREATE TABLE IF NOT EXISTS public.measured_category_usage (
  category text NOT NULL PRIMARY KEY,
  last_used_date date,
  usage_count_7d integer NOT NULL DEFAULT 0,
  usage_count_30d integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 4. Create measured_audit_log table for admin action logging
CREATE TABLE IF NOT EXISTS public.measured_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 5. Enable RLS on all new tables
ALTER TABLE public.measured_fact_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measured_category_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measured_audit_log ENABLE ROW LEVEL SECURITY;

-- 6. Drop and recreate policies to ensure clean state
DROP POLICY IF EXISTS "Only admins can manage fact candidates" ON public.measured_fact_candidates;
CREATE POLICY "Only admins can manage fact candidates"
ON public.measured_fact_candidates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 7. RLS policies for measured_category_usage
DROP POLICY IF EXISTS "Anyone can view category usage" ON public.measured_category_usage;
DROP POLICY IF EXISTS "Only admins can manage category usage" ON public.measured_category_usage;

CREATE POLICY "Anyone can view category usage"
ON public.measured_category_usage
FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage category usage"
ON public.measured_category_usage
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 8. RLS policies for measured_audit_log
DROP POLICY IF EXISTS "Only admins can view audit log" ON public.measured_audit_log;
DROP POLICY IF EXISTS "Admins can insert audit log" ON public.measured_audit_log;
DROP POLICY IF EXISTS "Prevent audit log modification" ON public.measured_audit_log;
DROP POLICY IF EXISTS "Prevent audit log deletion" ON public.measured_audit_log;

CREATE POLICY "Only admins can view audit log"
ON public.measured_audit_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert audit log"
ON public.measured_audit_log
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Prevent audit log modification"
ON public.measured_audit_log
FOR UPDATE
USING (false);

CREATE POLICY "Prevent audit log deletion"
ON public.measured_audit_log
FOR DELETE
USING (false);

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fact_candidates_status ON public.measured_fact_candidates(status);
CREATE INDEX IF NOT EXISTS idx_fact_candidates_category ON public.measured_fact_candidates(category);
CREATE INDEX IF NOT EXISTS idx_fact_candidates_confidence ON public.measured_fact_candidates(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_measured_audit_log_created ON public.measured_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_measured_audit_log_action ON public.measured_audit_log(action);

-- 10. Function to update category usage when a puzzle is published
CREATE OR REPLACE FUNCTION public.update_measured_category_usage()
RETURNS TRIGGER AS $$
DECLARE
  fact_category text;
BEGIN
  -- Only trigger when is_published changes to true
  IF NEW.is_published = true AND (OLD IS NULL OR OLD.is_published = false) THEN
    -- Get the category from the associated fact
    SELECT category INTO fact_category
    FROM public.measured_fact_bank
    WHERE id = NEW.fact_id;
    
    IF fact_category IS NOT NULL THEN
      -- Upsert into category usage
      INSERT INTO public.measured_category_usage (category, last_used_date, usage_count_7d, usage_count_30d, updated_at)
      VALUES (fact_category, NEW.puzzle_date, 1, 1, now())
      ON CONFLICT (category) DO UPDATE SET
        last_used_date = NEW.puzzle_date,
        updated_at = now();
      
      -- Update the fact's last_used_date and times_used
      UPDATE public.measured_fact_bank
      SET last_used_date = NEW.puzzle_date, times_used = times_used + 1
      WHERE id = NEW.fact_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 11. Trigger to auto-update category usage on puzzle publish
DROP TRIGGER IF EXISTS trigger_update_category_usage ON public.measured_daily_puzzles;
CREATE TRIGGER trigger_update_category_usage
AFTER INSERT OR UPDATE ON public.measured_daily_puzzles
FOR EACH ROW
EXECUTE FUNCTION public.update_measured_category_usage();

-- 12. Function to recalculate category usage counts
CREATE OR REPLACE FUNCTION public.recalculate_measured_category_usage()
RETURNS void AS $$
BEGIN
  UPDATE public.measured_category_usage cu SET
    usage_count_7d = COALESCE((
      SELECT COUNT(*)
      FROM public.measured_daily_puzzles dp
      JOIN public.measured_fact_bank fb ON dp.fact_id = fb.id
      WHERE fb.category = cu.category
        AND dp.puzzle_date >= CURRENT_DATE - INTERVAL '7 days'
        AND dp.is_published = true
    ), 0),
    usage_count_30d = COALESCE((
      SELECT COUNT(*)
      FROM public.measured_daily_puzzles dp
      JOIN public.measured_fact_bank fb ON dp.fact_id = fb.id
      WHERE fb.category = cu.category
        AND dp.puzzle_date >= CURRENT_DATE - INTERVAL '30 days'
        AND dp.is_published = true
    ), 0),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 13. Insert default categories
INSERT INTO public.measured_category_usage (category) VALUES
  ('geography'),
  ('astronomy'),
  ('science'),
  ('culture'),
  ('sports'),
  ('anatomy'),
  ('history'),
  ('nature')
ON CONFLICT (category) DO NOTHING;