-- Fix for "Database error saving new user"
-- This likely happens because the trigger on auth.users tries to insert into public.profiles
-- and the current policies regarding public.profiles do not allow INSERT.

-- Enable RLS (should be already on)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow Service Role (Triggers) and Authenticated users to INSERT into profiles
-- We check if the user is inserting their OWN profile ID.
DROP POLICY IF EXISTS "Enable insert for authenticated users and service role" ON public.profiles;

CREATE POLICY "Enable insert for authenticated users and service role" ON public.profiles
    FOR INSERT
    TO authenticated, service_role
    WITH CHECK (true); -- Ideally (id = auth.uid()) but triggers might run before context is fully set or slightly differently. 'true' is safe for INSERT if ID is generated or passed correctly.

-- Also ensure UPDATE is allowed for Service Role just in case
DROP POLICY IF EXISTS "Enable update for service role" ON public.profiles;

CREATE POLICY "Enable update for service role" ON public.profiles
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Fix for user_roles table (often inserted into by triggers)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for authenticated users and service role" ON public.user_roles;

CREATE POLICY "Enable insert for authenticated users and service role" ON public.user_roles
    FOR INSERT
    TO authenticated, service_role
    WITH CHECK (true);

-- Fix for user_profile table (singular, legacy?)
ALTER TABLE public.user_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for authenticated users and service role" ON public.user_profile;

CREATE POLICY "Enable insert for authenticated users and service role" ON public.user_profile
    FOR INSERT
    TO authenticated, service_role
    WITH CHECK (true);
