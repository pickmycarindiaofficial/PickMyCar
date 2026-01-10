-- ============================================================================
-- FIX FINANCE ROLE RLS POLICIES FOR LOAN APPLICATIONS
-- This will allow finance role users to view and manage loan applications
-- ============================================================================

-- Step 1: Ensure has_role function exists
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Step 2: Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon;
GRANT EXECUTE ON FUNCTION public.get_loan_application_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_loan_application_stats() TO anon;

-- Step 3: Add RLS policies for finance role on loan_applications table
-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Finance role can view all loan applications" ON loan_applications;
DROP POLICY IF EXISTS "Finance role can update loan applications" ON loan_applications;

-- Create new policies for finance role
CREATE POLICY "Finance role can view all loan applications"
ON loan_applications
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'finance'::app_role));

CREATE POLICY "Finance role can update loan applications"
ON loan_applications
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'finance'::app_role))
WITH CHECK (has_role(auth.uid(), 'finance'::app_role));

-- Step 4: Add RLS policies for finance role on loan_documents table
DROP POLICY IF EXISTS "Finance role can view all loan documents" ON loan_documents;

CREATE POLICY "Finance role can view all loan documents"
ON loan_documents
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'finance'::app_role));

-- Step 5: Ensure your user has the finance role assigned
-- Replace 'roshan.kalaitv@gmail.com' with your email if different
INSERT INTO user_roles (user_id, role, assigned_by)
SELECT id, 'finance'::app_role, id
FROM auth.users 
WHERE email = 'roshan.kalaitv@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 6: Verify the role was assigned
SELECT 
  u.email,
  ur.role,
  ur.assigned_at
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE u.email = 'roshan.kalaitv@gmail.com';

-- ============================================================================
-- VERIFICATION QUERIES (Run these to confirm everything works)
-- ============================================================================

-- Check all RLS policies on loan_applications
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'loan_applications'
ORDER BY policyname;

-- Check if has_role function exists and works
SELECT has_role(
  (SELECT id FROM auth.users WHERE email = 'roshan.kalaitv@gmail.com'),
  'finance'::app_role
) as has_finance_role;

-- Check loan applications count
SELECT COUNT(*) as total_applications FROM loan_applications;

-- Test the stats function
SELECT get_loan_application_stats();
