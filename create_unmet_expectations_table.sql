-- Create the missing 'unmet_expectations' table
-- Required for the "Find My Car" / "Exit Rescue" feature

CREATE TABLE IF NOT EXISTS public.unmet_expectations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    
    -- Preferences
    budget_max NUMERIC,
    must_haves JSONB DEFAULT '{}'::jsonb, -- Stores body_types, fuel_types arrays
    note TEXT,
    urgency TEXT, -- 'hot', 'warm', 'cold'
    city TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'new' -- 'new', 'reviewed', 'contacted'
);

-- Enable RLS
ALTER TABLE public.unmet_expectations ENABLE ROW LEVEL SECURITY;

-- create RLS policies
-- 1. Authenticated users can insert their own requests
CREATE POLICY "Users can insert unmet expectations" 
ON public.unmet_expectations FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 2. Staff can view all requests
CREATE POLICY "Staff can view all unmet expectations" 
ON public.unmet_expectations FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.staff_accounts 
    WHERE id = auth.uid() 
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  OR auth.uid() = user_id -- Users can see their own
);

-- 3. Anonymous users can insert (if logic requires it later, currently disabled for safety)
-- In the component, we see user?.id usage, implying it might be used by anon users too.
-- If user is null (anon), we normally can't constrain by user_id = auth.uid().
-- Modifying policy to allow anon inserts if user_id is null:

CREATE POLICY "Anyone can insert unmet expectations" 
ON public.unmet_expectations FOR INSERT 
TO anon, authenticated
WITH CHECK (
  (auth.role() = 'anon' AND user_id IS NULL)
  OR
  (auth.role() = 'authenticated' AND user_id = auth.uid())
);

-- Grant privileges
GRANT INSERT ON public.unmet_expectations TO anon, authenticated;
GRANT SELECT ON public.unmet_expectations TO authenticated;

SELECT 'Table unmet_expectations created successfully' as result;
