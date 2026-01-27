-- FIX DEALER PROFILES (Missing Data & Permissions)
-- The "Dealer Not Found" page happens because the `dealer_profiles` table is empty or missing the dealer's specific row.
-- This script backfills it and fixes permissions.

BEGIN;

-- 1. FIX PERMISSIONS
-- Allow everyone (including anonymous users) to READ dealer profiles
ALTER TABLE public.dealer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dealer profiles are viewable by everyone" ON public.dealer_profiles;
DROP POLICY IF EXISTS "Dealer profiles are viewable by authenticated users" ON public.dealer_profiles;

CREATE POLICY "Dealer profiles are viewable by everyone"
ON public.dealer_profiles
FOR SELECT
TO public
USING (true);

-- 2. BACKFILL MISSING DEALER PROFILES
-- Insert a row into `dealer_profiles` for every user in `profiles` that doesn't have one.
-- We use data from `profiles` or default placeholders.
INSERT INTO public.dealer_profiles (
    id,
    dealership_name,
    business_type,
    address,
    city_id,
    state,
    pincode,
    about_text,
    created_at,
    updated_at
)
SELECT
    p.id,
    COALESCE(p.full_name, 'Authorized Dealer'), -- dealership_name
    'Independent', -- business_type
    'Auto Market', -- address
    NULL, -- city_id (can be null)
    'State', -- state
    '000000', -- pincode
    'Trusted dealer of quality used cars.', -- about_text
    now(),
    now()
FROM public.profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM public.dealer_profiles dp WHERE dp.id = p.id
);

-- 3. ENSURE DEALER_ACCOUNTS ARE SYNCED (Optional but good)
-- If we have a dealer_account but no profile link, this is trickier as IDs differ.
-- But for now, fixing `dealer_profiles` matching `profiles` is the key for the public page.

COMMIT;

SELECT 'Dealer Profiles backfilled and permissions fixed.' as status;
