-- FIX dealer_profiles RLS TO ALLOW ADMIN TO CREATE DEALERS
-- Run this in Supabase SQL Editor

-- Enable RLS
ALTER TABLE dealer_profiles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing insert policies
DROP POLICY IF EXISTS "Enable insert for admins and service role" ON dealer_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON dealer_profiles;
DROP POLICY IF EXISTS "Dealers can insert own profile" ON dealer_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON dealer_profiles;

-- Create permissive policy for ALL authenticated users to INSERT
-- This allows admins to create dealer profiles for new users
CREATE POLICY "Allow all authenticated users to insert dealer profiles" ON dealer_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Also add for service_role
CREATE POLICY "Service role can manage dealer_profiles" ON dealer_profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Fix dealer_subscriptions too (next step in the process)
ALTER TABLE dealer_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for admins and service role" ON dealer_subscriptions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON dealer_subscriptions;

CREATE POLICY "Allow all authenticated users to insert subscriptions" ON dealer_subscriptions
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Service role can manage subscriptions" ON dealer_subscriptions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Grant table permissions
GRANT INSERT, UPDATE, SELECT ON dealer_profiles TO authenticated;
GRANT INSERT, UPDATE, SELECT ON dealer_subscriptions TO authenticated;
GRANT ALL ON dealer_profiles TO service_role;
GRANT ALL ON dealer_subscriptions TO service_role;

-- Done!
SELECT 'RLS policies fixed for dealer_profiles and dealer_subscriptions' as status;
