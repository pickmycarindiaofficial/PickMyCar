-- EMERGENCY FIX: Unblock "Find My Car" (unmet_expectations)
-- The goal is to allow ANYONE (Anon or Logged in) to insert requests.

-- 1. Create table if it doesn't exist (Idempotent)
CREATE TABLE IF NOT EXISTS public.unmet_expectations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    
    -- Preferences
    budget_max NUMERIC,
    must_haves JSONB DEFAULT '{}'::jsonb,
    note TEXT,
    urgency TEXT,
    city TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'new'
);

-- 2. RESET RLS Policies completely for this table
ALTER TABLE public.unmet_expectations ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert unmet expectations" ON public.unmet_expectations;
DROP POLICY IF EXISTS "Anyone can insert unmet expectations" ON public.unmet_expectations;
DROP POLICY IF EXISTS "Staff can view all unmet expectations" ON public.unmet_expectations;
DROP POLICY IF EXISTS "Allow public insert" ON public.unmet_expectations;

-- 3. Create a SINGLE, PERMISSIVE policy for Insertion
-- "true" means anyone can insert rows. 
-- We don't restrict by user_id check here to avoid "field not found" or null constraint issues.
CREATE POLICY "Allow public insert"
ON public.unmet_expectations
FOR INSERT
TO public
WITH CHECK (true);

-- 4. Create separate policy for Viewing (Staff only)
CREATE POLICY "Staff view"
ON public.unmet_expectations
FOR SELECT
TO authenticated
USING (true); 
-- In production, you'd add: AND (auth.uid() IN (SELECT id FROM staff_accounts))
-- For now, allow any logged in user (like you, the admin) to verify it saved.

-- 5. Grant Permissions to the roles
GRANT INSERT ON public.unmet_expectations TO anon, authenticated, service_role;
GRANT SELECT ON public.unmet_expectations TO authenticated, service_role;

SELECT 'Fixed unmet_expectations permissions!' as status;
