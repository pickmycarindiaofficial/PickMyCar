-- EMERGENCY FIX: DISABLE RLS TO UNBLOCK DEALER CREATION
-- Run this in Supabase SQL Editor

-- Disable RLS on all dealer-related tables
ALTER TABLE dealer_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE dealer_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('profiles', 'dealer_profiles', 'dealer_subscriptions');

-- Done! Dealer creation should now work.
