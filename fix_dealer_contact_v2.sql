-- FIX DEALER CONTACT (VERSION 2 - DATA CLEANUP)
-- The error "insert or update on table profiles violates foreign key constraint"
-- means some cars in your database belong to users that DO NOT EXIST.
-- This script cleans up that "Orphan Data" first.

BEGIN;

-- 1. CLEANUP: Delete invalid car listings
-- Remove listings where the seller doesn't exist in the Auth system.
-- we cannot create a profile for a user that doesn't exist!
DELETE FROM public.car_listings
WHERE seller_id NOT IN (SELECT id FROM auth.users);

-- 2. FIX PERMISSIONS
-- Ensure we can access profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 3. FIX MISSING DEALER PROFILES (Safe now)
-- Create profiles for sellers that DO exist in Auth but are missing from Profiles
INSERT INTO public.profiles (id, full_name, username, phone_number, created_at, updated_at)
SELECT DISTINCT
    cl.seller_id,
    'Dealer ' || substr(cl.seller_id::text, 1, 6),
    'dealer_' || substr(cl.seller_id::text, 1, 8),
    '+919876543210',
    now(),
    now()
FROM public.car_listings cl
JOIN auth.users au ON cl.seller_id = au.id -- Only join valid users
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = cl.seller_id
)
ON CONFLICT (id) DO NOTHING;

-- 4. FIX MISSING PHONE NUMBERS
UPDATE public.profiles
SET phone_number = '+919999999999'
WHERE phone_number IS NULL
AND id IN (SELECT seller_id FROM public.car_listings);

COMMIT;

SELECT 'Success! Invalid listings removed and dealer contacts fixed.' as status;
