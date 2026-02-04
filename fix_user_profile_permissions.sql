-- Fix permission denied error for user_profile table
-- The error 42501 (Permission denied) occurs because upsert() requires both INSERT and UPDATE permissions,
-- and the previous policies only allowed INSERT.

-- ==========================================
-- 1. Fix public.user_profile
-- ==========================================

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.user_profile ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Enable insert for authenticated users and service role" ON public.user_profile;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profile;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profile
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.user_profile
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profile
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Grant necessary table permissions
GRANT SELECT, INSERT, UPDATE ON public.user_profile TO authenticated;


-- ==========================================
-- 2. Fix public.profiles (Safety check)
-- ==========================================

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for authenticated users and service role" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Confirmation
SELECT 'Permissions fixed successfully' as result;
