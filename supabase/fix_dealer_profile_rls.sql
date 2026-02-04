-- =============================================
-- FIX: Allow Dealers to Create/Update Their Profiles
-- Run this script in the Supabase SQL Editor
-- =============================================

-- 1. Enable RLS on dealer_profiles (safety first)
ALTER TABLE public.dealer_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Remove potentially conflicting policies
DROP POLICY IF EXISTS "Dealers can update own profile" ON public.dealer_profiles;
DROP POLICY IF EXISTS "Dealers can insert own profile" ON public.dealer_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.dealer_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.dealer_profiles;
DROP POLICY IF EXISTS "Public can view dealer profiles" ON public.dealer_profiles;

-- 3. Allow Public Read Access (Essential for Spec Sheets & Public Pages)
CREATE POLICY "Public can view dealer profiles"
ON public.dealer_profiles
FOR SELECT
USING (true);

-- 4. Allow Dealers to CREATE (INSERT) their own profile
-- This fixes the "new row violates row-level security policy" error
CREATE POLICY "Dealers can insert own profile"
ON public.dealer_profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- 5. Allow Dealers to UPDATE their own profile
CREATE POLICY "Dealers can update own profile"
ON public.dealer_profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 6. Grant necessary permissions (just in case)
GRANT ALL ON public.dealer_profiles TO authenticated;
GRANT SELECT ON public.dealer_profiles TO anon;

SELECT 'Success: Dealer Profile policies updated.' as status;
