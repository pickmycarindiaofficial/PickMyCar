-- FIX DEALER OTP AND LOGIN
-- 1. Updates login logic to allow Phone Number as Username.
-- 2. Ensures the specific user "7418649552" has a valid Dealer Account.

BEGIN;

-- =========================================================
-- 1. UPDATE LOGIN FUNCTION (Allow Phone Number Login)
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_dealer_by_username(p_username TEXT)
RETURNS TABLE (
  id UUID,
  phone_number TEXT,
  dealership_name TEXT,
  owner_name TEXT,
  is_active BOOLEAN,
  is_locked BOOLEAN,
  failed_otp_attempts INTEGER,
  lock_expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    da.id, da.phone_number, da.dealership_name, da.owner_name,
    da.is_active, da.is_locked, da.failed_otp_attempts, da.lock_expires_at
  FROM public.dealer_accounts da
  WHERE da.username = p_username
     OR da.phone_number = p_username
     OR da.phone_number = '+91' || p_username
     OR da.phone_number LIKE '%' || p_username; -- Flexible match
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dealer_by_username TO anon, authenticated, service_role;

-- =========================================================
-- 2. ENSURE DEALER ACCOUNT EXISTS (for 7418649552)
-- =========================================================
INSERT INTO public.dealer_accounts (
    username, 
    phone_number, 
    dealership_name, 
    owner_name, 
    is_active,
    subscription_status
)
VALUES (
    '7418649552',         -- Username = Phone
    '+917418649552',      -- Formatted Phone
    'Roshan Motors',      -- Default Name
    'Roshan',             -- Default Owner
    true,
    'active'
)
ON CONFLICT (username) DO UPDATE
SET 
    is_active = true,
    phone_number = EXCLUDED.phone_number; -- Ensure phone format is correct

-- Also make sure we don't have a conflict on phone_number if username is different
-- (Optional cleanup if needed, but the UNIQUE is on username usually)

COMMIT;

SELECT 'Success! Login logic updated and Dealer Account verified.' as status;
