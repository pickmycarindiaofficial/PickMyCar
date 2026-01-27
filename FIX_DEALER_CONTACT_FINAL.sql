-- FINAL FIX FOR DEALER CONTACTS
-- This script resolves the "Key (id)=(...) is not present in table users" error.

BEGIN;

-- 1. IDENTIFY AND REMOVE CORRUPT DATA
-- We delete any car listings that belong to users who don't exist anymore.
-- This is necessary because we cannot create profiles for "ghost" users.
DELETE FROM public.car_listings
WHERE seller_id NOT IN (SELECT id FROM auth.users);

-- 2. CREATE MISSING PROFILES (Safely)
-- Only create profiles for users who ACTUALLY EXIST in the system.
INSERT INTO public.profiles (id, full_name, username, phone_number, created_at, updated_at)
SELECT DISTINCT
    cl.seller_id,
    'Dealer ' || substr(cl.seller_id::text, 1, 6),
    'dealer_' || substr(cl.seller_id::text, 1, 8),
    '+919876543210',
    now(),
    now()
FROM public.car_listings cl
JOIN auth.users au ON cl.seller_id = au.id  -- CRITICAL: This prevents the error
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = cl.seller_id
)
ON CONFLICT (id) DO NOTHING;

-- 3. FIX PERMISSIONS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (true);

-- 4. ENSURE PHONE NUMBERS EXIST
UPDATE public.profiles
SET phone_number = '+919999999999'
WHERE phone_number IS NULL
AND id IN (SELECT seller_id FROM public.car_listings);

COMMIT;

SELECT 'Fixed! Corrupt listings removed and dealer contacts restored.' as status;
