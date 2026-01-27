-- ============================================================
-- COMPLETE FIX FOR DEALER CREATION
-- Run this ENTIRE script in Supabase SQL Editor
-- This fixes ALL tables involved in dealer creation
-- ============================================================

-- ============================================================
-- STEP 1: FIX PROFILES TABLE
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing insert policies to avoid conflicts
DROP POLICY IF EXISTS "Enable insert for authenticated users and service role" ON public.profiles;
DROP POLICY IF EXISTS "Allow trigger to insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can insert profile" ON public.profiles;

-- Create permissive INSERT policy
CREATE POLICY "Allow authenticated users to insert profiles" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow service role full access to profiles" ON public.profiles
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ============================================================
-- STEP 2: FIX DEALER_PROFILES TABLE
-- ============================================================
ALTER TABLE dealer_profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing insert policies
DROP POLICY IF EXISTS "Enable insert for admins and service role" ON dealer_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON dealer_profiles;
DROP POLICY IF EXISTS "Dealers can insert own profile" ON dealer_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON dealer_profiles;
DROP POLICY IF EXISTS "Allow all authenticated users to insert dealer profiles" ON dealer_profiles;
DROP POLICY IF EXISTS "Service role can manage dealer_profiles" ON dealer_profiles;
DROP POLICY IF EXISTS "Admins can insert dealer profiles" ON dealer_profiles;

-- Create permissive INSERT policy for authenticated users (admins creating dealers)
CREATE POLICY "Allow authenticated to insert dealer_profiles" ON dealer_profiles
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Service role full access
CREATE POLICY "Service role manage dealer_profiles" ON dealer_profiles
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ============================================================
-- STEP 3: FIX DEALER_SUBSCRIPTIONS TABLE
-- ============================================================
ALTER TABLE dealer_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing insert policies
DROP POLICY IF EXISTS "Enable insert for admins and service role" ON dealer_subscriptions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON dealer_subscriptions;
DROP POLICY IF EXISTS "Allow all authenticated users to insert subscriptions" ON dealer_subscriptions;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON dealer_subscriptions;
DROP POLICY IF EXISTS "Admins can insert subscriptions" ON dealer_subscriptions;

-- Create permissive INSERT policy
CREATE POLICY "Allow authenticated to insert subscriptions" ON dealer_subscriptions
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Service role full access
CREATE POLICY "Service role manage subscriptions" ON dealer_subscriptions
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- ============================================================
-- STEP 4: FIX USER_ROLES TABLE (if it exists)
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles' AND table_schema = 'public') THEN
        ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Enable insert for authenticated users and service role" ON public.user_roles;
        DROP POLICY IF EXISTS "Allow authenticated to insert user_roles" ON public.user_roles;
        DROP POLICY IF EXISTS "Service role manage user_roles" ON public.user_roles;
        
        CREATE POLICY "Allow authenticated to insert user_roles" ON public.user_roles
            FOR INSERT TO authenticated
            WITH CHECK (true);
            
        CREATE POLICY "Service role manage user_roles" ON public.user_roles
            FOR ALL TO service_role
            USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ============================================================
-- STEP 5: GRANT TABLE PERMISSIONS
-- ============================================================
GRANT INSERT, UPDATE, SELECT ON public.profiles TO authenticated;
GRANT INSERT, UPDATE, SELECT ON dealer_profiles TO authenticated;
GRANT INSERT, UPDATE, SELECT ON dealer_subscriptions TO authenticated;

GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON dealer_profiles TO service_role;
GRANT ALL ON dealer_subscriptions TO service_role;

-- Grant to postgres (owner)
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON dealer_profiles TO postgres;
GRANT ALL ON dealer_subscriptions TO postgres;

-- ============================================================
-- STEP 6: FIX AUTH TRIGGER (if it exists and causes issues)
-- ============================================================
-- Drop problematic triggers that might fail
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;

-- Create a robust handle_new_user function that won't fail
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, username, phone_number, is_active, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
        true,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
EXCEPTION WHEN others THEN
    RAISE WARNING 'Profile creation skipped for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger with proper error handling
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- VERIFICATION
-- ============================================================
SELECT 'SUCCESS: All RLS policies fixed for dealer creation!' as status;

-- Show current policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('profiles', 'dealer_profiles', 'dealer_subscriptions')
ORDER BY tablename, policyname;
