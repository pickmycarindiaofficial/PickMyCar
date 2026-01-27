-- ============================================================
-- COMPLETE FIX: Dealer Accounts RLS Policies
-- This allows authenticated PowerDesk users to see dealers
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Check if dealer_accounts table exists and has RLS enabled
DO $$
BEGIN
    -- Enable RLS if not already enabled
    ALTER TABLE public.dealer_accounts ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS is enabled on dealer_accounts';
END $$;

-- Step 2: Drop ALL existing policies on dealer_accounts (clean slate)
DROP POLICY IF EXISTS "Service role full access" ON public.dealer_accounts;
DROP POLICY IF EXISTS "Authenticated users can read dealers" ON public.dealer_accounts;
DROP POLICY IF EXISTS "Staff can read all dealers" ON public.dealer_accounts;
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON public.dealer_accounts;
DROP POLICY IF EXISTS "Allow insert for service role" ON public.dealer_accounts;
DROP POLICY IF EXISTS "Allow update for service role" ON public.dealer_accounts;
DROP POLICY IF EXISTS "dealer_accounts_select_policy" ON public.dealer_accounts;
DROP POLICY IF EXISTS "dealer_accounts_insert_policy" ON public.dealer_accounts;
DROP POLICY IF EXISTS "dealer_accounts_update_policy" ON public.dealer_accounts;

-- Step 3: Create comprehensive RLS policies

-- Policy 1: Allow ALL authenticated users to SELECT (read) dealers
CREATE POLICY "authenticated_read_dealers" ON public.dealer_accounts
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Policy 2: Service role can do anything
CREATE POLICY "service_role_full_access" ON public.dealer_accounts
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Policy 3: Allow anon to read active dealers (for public listing)
CREATE POLICY "anon_read_active_dealers" ON public.dealer_accounts
  FOR SELECT 
  TO anon 
  USING (is_active = true);

-- Step 4: Grant table permissions
GRANT SELECT ON public.dealer_accounts TO authenticated;
GRANT SELECT ON public.dealer_accounts TO anon;
GRANT ALL ON public.dealer_accounts TO service_role;

-- Step 5: Also fix related tables
-- dealer_otp_sessions
DROP POLICY IF EXISTS "dealer_otp_sessions_select" ON public.dealer_otp_sessions;
CREATE POLICY "dealer_otp_sessions_service_role" ON public.dealer_otp_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT SELECT ON public.dealer_otp_sessions TO authenticated;

-- dealer_sessions
DROP POLICY IF EXISTS "dealer_sessions_select" ON public.dealer_sessions;
CREATE POLICY "dealer_sessions_service_role" ON public.dealer_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT SELECT ON public.dealer_sessions TO authenticated;

-- Step 6: Verify the fix - this should return dealers now
SELECT 
  'Total dealers:' as info, 
  COUNT(*)::text as count 
FROM public.dealer_accounts;

-- Step 7: List all dealers to confirm
SELECT 
  id, 
  username, 
  dealership_name, 
  owner_name, 
  phone_number,
  is_active,
  created_at 
FROM public.dealer_accounts
ORDER BY created_at DESC
LIMIT 10;

-- Success message
SELECT '✅ SUCCESS: RLS policies updated! Dealers should now be visible in the dashboard.' as status;
