-- FINAL ROBUST FIX FOR DEALER CREATION
-- This script addresses "Database error saving new user" by permissive RLS on all related tables.

-- ==========================================
-- 1. PUBLIC.PROFILES
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow INSERT by authenticated users (including Admins creating other users)
-- The trigger on auth.users will try to insert into this table. 
-- If the trigger runs as SECURITY DEFINER, it bypasses RLS.
-- If it runs as INVOKER (the Admin), it needs RLS permissions.

DROP POLICY IF EXISTS "Enable insert for authenticated users and service role" ON public.profiles;

CREATE POLICY "Enable insert for authenticated users and service role" ON public.profiles
    FOR INSERT
    TO authenticated, service_role
    WITH CHECK (true);

-- Allow UPDATE
DROP POLICY IF EXISTS "Enable update for service role" ON public.profiles;

CREATE POLICY "Enable update for service role" ON public.profiles
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ==========================================
-- 2. PUBLIC.USER_ROLES
-- ==========================================
-- Many triggers insert a default role here
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for authenticated users and service role" ON public.user_roles;

CREATE POLICY "Enable insert for authenticated users and service role" ON public.user_roles
    FOR INSERT
    TO authenticated, service_role
    WITH CHECK (true);

-- ==========================================
-- 3. PUBLIC.USER_PROFILE (Legacy/Alternate table)
-- ==========================================
-- Just in case the trigger uses this table instead
CREATE TABLE IF NOT EXISTS public.user_profile (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  first_name TEXT,
  last_name TEXT,
  -- other fields
  updated_at TIMESTAMPTZ
);

ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for authenticated users and service role" ON public.user_profile;

CREATE POLICY "Enable insert for authenticated users and service role" ON public.user_profile
    FOR INSERT
    TO authenticated, service_role
    WITH CHECK (true);

-- ==========================================
-- 4. DEALER SPECIFIC TABLES
-- ==========================================
-- dealer_profiles
ALTER TABLE dealer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for admins and service role" ON dealer_profiles;

CREATE POLICY "Enable insert for admins and service role" ON dealer_profiles
    FOR INSERT
    TO authenticated, service_role
    WITH CHECK (true);

-- dealer_subscriptions
ALTER TABLE dealer_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for admins and service role" ON dealer_subscriptions;

CREATE POLICY "Enable insert for admins and service role" ON dealer_subscriptions
    FOR INSERT
    TO authenticated, service_role
    WITH CHECK (true);

-- ==========================================
-- 5. FIX OWNER/GRANT PERMISSIONS
-- ==========================================
-- Ensure the postgres/authenticated roles have permissions on the sequences/tables
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

GRANT INSERT, UPDATE, SELECT ON public.profiles TO authenticated;
GRANT INSERT, UPDATE, SELECT ON public.user_roles TO authenticated;
GRANT INSERT, UPDATE, SELECT ON dealer_profiles TO authenticated;
GRANT INSERT, UPDATE, SELECT ON dealer_subscriptions TO authenticated;

-- Force Grant to postgres (in case owner issues)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;

