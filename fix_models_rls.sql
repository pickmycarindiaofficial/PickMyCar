-- =================================================================
-- FIX: Models Table RLS Policies (Professional Grade)
-- Description: Adds missing RLS policies for the models table to allow 
--              admins/powerdesk to manage models while keeping public read access.
--              Validates "x-staff-token" header for staff authentication.
-- =================================================================

-- 1. Enable RLS on models table (ensure it is on)
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Public read access" ON public.models;
DROP POLICY IF EXISTS "Public can view models" ON public.models;
DROP POLICY IF EXISTS "Anyone can view models" ON public.models;
DROP POLICY IF EXISTS "Admins can manage models" ON public.models;
DROP POLICY IF EXISTS "Powerdesk can manage models" ON public.models;
DROP POLICY IF EXISTS "Admins and Powerdesk can insert models" ON public.models;
DROP POLICY IF EXISTS "Admins and Powerdesk can update models" ON public.models;
DROP POLICY IF EXISTS "Admins and Powerdesk can delete models" ON public.models;

-- 3. Create Helper Function to validate header token
--    (Wrapper around is_valid_staff_session that extracts header)
CREATE OR REPLACE FUNCTION public.check_staff_header()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT public.is_valid_staff_session(
    current_setting('request.headers', true)::json->>'x-staff-token'
  );
$$;

-- 4. Create Policy: Public Read Access
CREATE POLICY "Public can view models"
ON public.models
FOR SELECT
TO public
USING (true);

-- 5. Create Policy: Insert Access for Authorized Staff
--    Checks either Supabase Auth role OR valid Staff Header
CREATE POLICY "Staff can insert models"
ON public.models
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Check for valid staff session via header (for anon/staff users)
  public.check_staff_header() 
  OR 
  -- Fallback for standard Supabase Auth users (admin/powerdesk)
  (auth.role() = 'authenticated' AND (
    public.current_user_has_role('admin') OR 
    public.current_user_has_role('powerdesk')
  ))
);

-- 6. Create Policy: Update Access for Authorized Staff
CREATE POLICY "Staff can update models"
ON public.models
FOR UPDATE
TO anon, authenticated
USING (
  public.check_staff_header() 
  OR 
  (auth.role() = 'authenticated' AND (
    public.current_user_has_role('admin') OR 
    public.current_user_has_role('powerdesk')
  ))
)
WITH CHECK (
  public.check_staff_header() 
  OR 
  (auth.role() = 'authenticated' AND (
    public.current_user_has_role('admin') OR 
    public.current_user_has_role('powerdesk')
  ))
);

-- 7. Create Policy: Delete Access for Authorized Staff
CREATE POLICY "Staff can delete models"
ON public.models
FOR DELETE
TO anon, authenticated
USING (
  public.check_staff_header() 
  OR 
  (auth.role() = 'authenticated' AND (
    public.current_user_has_role('admin') OR 
    public.current_user_has_role('powerdesk')
  ))
);

-- 8. Verification
SELECT count(*) as policies_count 
FROM pg_policies 
WHERE tablename = 'models';
