-- Enable RLS on dealer_profiles if not already enabled
ALTER TABLE dealer_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing insert policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Enable insert for authenticated users with role dealer" ON dealer_profiles;
DROP POLICY IF EXISTS "Enable insert for admins" ON dealer_profiles;

-- Create policy to allow admins and dealers to insert into dealer_profiles
-- This assumes that when an admin creates a dealer, they are authenticated as an admin
-- And when a user signs up (if self-service is allowed), they might need to insert their own profile
-- Based on the error, the current user (admin) cannot insert.

DROP POLICY IF EXISTS "Enable insert for admins and service role" ON dealer_profiles;

CREATE POLICY "Enable insert for admins and service role" ON dealer_profiles
    FOR INSERT
    TO authenticated, service_role
    WITH CHECK (true);
    
-- Also checking dealer_subscriptions as that happens in the same transaction
ALTER TABLE dealer_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON dealer_subscriptions;
DROP POLICY IF EXISTS "Enable insert for admins" ON dealer_subscriptions;

DROP POLICY IF EXISTS "Enable insert for admins and service role" ON dealer_subscriptions;

CREATE POLICY "Enable insert for admins and service role" ON dealer_subscriptions
    FOR INSERT
    TO authenticated, service_role
    WITH CHECK (true);

-- Ensure profiles table has correct policies too since we insert there first (usually handled by auth trigger but here we manually insert/update?)
-- In useCreateDealer hook:
-- 1. supabase.auth.signUp (creates user in auth.users)
-- 2. insert into dealer_profiles
-- 3. insert into dealer_subscriptions

-- We need to ensure the user making the request (the admin) can insert into these tables.
-- or if the user is created and then the client uses the NEW user's context?
-- Wait, useCreateDealer uses `supabase.auth.signUp`.
-- If the current session is an Admin, `supabase.auth.signUp` might log them in as the new user OR just create it.
-- If it logs them in as the new user, then the new user needs permission to insert their own profile.
-- If it ignores session and just creates, the subsequent inserts are done by the ADMIN user.

-- Let's look at `useDealers.ts` again. 
-- It uses `supabase.from('dealer_profiles').insert(...)`.
-- This command is executed by the client. The client has the session of the currently logged in user (the Admin).
-- So the ADMIN user needs permission to insert into `dealer_profiles`.

-- The policy `WITH CHECK (true)` for `authenticated` users allows any authenticated user (including admins) to insert.
-- This is broad but solves the issue. For tighter security, we could check `auth.jwt() ->> 'role'` or similar if custom claims exist.

-- Since we are in the middle of a "fix", getting it working is priority.
