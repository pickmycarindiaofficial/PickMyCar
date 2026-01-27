-- ===========================================
-- DIAGNOSE AND FIX AUTH.USERS TRIGGER
-- Run this in Supabase SQL Editor
-- ===========================================

-- STEP 1: Find all triggers on auth.users
SELECT 
    tg.tgname as trigger_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_trigger tg
JOIN pg_class c ON tg.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON tg.tgfoid = p.oid
WHERE n.nspname = 'auth' 
AND c.relname = 'users';

-- STEP 2: If a trigger exists, we have two options:
-- Option A: Disable the trigger temporarily
-- Option B: Fix the trigger function to handle errors

-- ===========================================
-- OPTION A: DISABLE THE TRIGGER (RECOMMENDED)
-- This stops the auto-profile creation
-- ===========================================

-- Find and drop the trigger (replace 'on_auth_user_created' with actual name from Step 1)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;

-- ===========================================
-- OPTION B: FIX THE TRIGGER FUNCTION
-- Make it more robust and handle errors
-- ===========================================

-- First, let's create a fixed version of the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles with minimal required fields
  INSERT INTO public.profiles (
    id, 
    full_name, 
    username, 
    phone_number, 
    role, 
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Don't fail if profile already exists
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger (only if you want auto-profile creation)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- STEP 3: ENSURE PROFILES TABLE HAS CORRECT STRUCTURE
-- ===========================================

-- Add missing columns if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Ensure id is the primary key and references auth.users
-- (Already should be, but just in case)
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey 
--   FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ===========================================
-- STEP 4: VERIFY RLS POLICIES ALLOW INSERTS
-- ===========================================

-- Allow service_role to insert (triggers run as service_role by default in SECURITY DEFINER)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow trigger to insert profiles" ON public.profiles;
CREATE POLICY "Allow trigger to insert profiles" ON public.profiles
  FOR INSERT
  TO service_role, postgres
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated insert own profile" ON public.profiles;
CREATE POLICY "Allow authenticated insert own profile" ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ===========================================
-- DONE! Run the diagnostic query first to see what triggers exist.
-- ===========================================
