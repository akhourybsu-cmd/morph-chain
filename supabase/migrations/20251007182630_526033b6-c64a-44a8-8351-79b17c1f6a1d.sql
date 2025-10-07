-- Create table for Morph Prism feedback
CREATE TABLE public.prism_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  feedback_text TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.prism_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit feedback
CREATE POLICY "Anyone can submit prism feedback" 
ON public.prism_feedback 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view feedback
CREATE POLICY "Only admins can view prism feedback" 
ON public.prism_feedback 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Prevent feedback modification
CREATE POLICY "Prevent prism feedback modification" 
ON public.prism_feedback 
FOR UPDATE 
USING (false);

-- Prevent feedback deletion
CREATE POLICY "Prevent prism feedback deletion" 
ON public.prism_feedback 
FOR DELETE 
USING (false);