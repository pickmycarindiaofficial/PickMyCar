-- ============================================================
-- FIX: Allow OTP Dealers to Create Car Listings
-- Run this in Supabase SQL Editor
-- ============================================================

-- Drop existing insert policies on car_listings
DROP POLICY IF EXISTS "Users can create their own listings" ON car_listings;
DROP POLICY IF EXISTS "Dealers can create listings" ON car_listings;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON car_listings;
DROP POLICY IF EXISTS "Allow OTP dealers to insert listings" ON car_listings;
DROP POLICY IF EXISTS "Allow listing creation" ON car_listings;

-- Create policy that allows:
-- 1. Authenticated users (Supabase Auth)
-- 2. OTP dealers (seller_id exists in dealer_accounts)
CREATE POLICY "Allow listing creation" ON car_listings
FOR INSERT
WITH CHECK (
  -- Allow authenticated Supabase users to insert their own listings
  (auth.uid() IS NOT NULL AND seller_id = auth.uid())
  OR
  -- Allow OTP dealers (seller_id must exist in dealer_accounts and be active)
  EXISTS (
    SELECT 1 FROM dealer_accounts 
    WHERE id = seller_id 
    AND is_active = true
  )
);

-- Also ensure select/update/delete policies work for OTP dealers
DROP POLICY IF EXISTS "Public can view live listings" ON car_listings;
DROP POLICY IF EXISTS "Users can view their own listings" ON car_listings;
DROP POLICY IF EXISTS "Dealers can view their listings" ON car_listings;
DROP POLICY IF EXISTS "Users can update their own listings" ON car_listings;
DROP POLICY IF EXISTS "Dealers can update their listings" ON car_listings;
DROP POLICY IF EXISTS "Allow OTP dealers to view listings" ON car_listings;
DROP POLICY IF EXISTS "Allow OTP dealers to update listings" ON car_listings;
DROP POLICY IF EXISTS "View live listings" ON car_listings;
DROP POLICY IF EXISTS "Update own listings" ON car_listings;
DROP POLICY IF EXISTS "Delete own listings" ON car_listings;

-- SELECT: Anyone can view live listings, dealers can view their own
CREATE POLICY "View live listings" ON car_listings
FOR SELECT
USING (
  status = 'live'
  OR seller_id = auth.uid()
  OR EXISTS (SELECT 1 FROM dealer_accounts WHERE id = seller_id)
  OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'powerdesk'))
);

-- UPDATE: Users/dealers can update their own listings
CREATE POLICY "Update own listings" ON car_listings
FOR UPDATE
USING (
  seller_id = auth.uid()
  OR EXISTS (SELECT 1 FROM dealer_accounts WHERE id = seller_id AND is_active = true)
  OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'powerdesk'))
)
WITH CHECK (
  seller_id = auth.uid()
  OR EXISTS (SELECT 1 FROM dealer_accounts WHERE id = seller_id AND is_active = true)
  OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'powerdesk'))
);

-- DELETE: Users/dealers can delete their own listings, admins can delete any
CREATE POLICY "Delete own listings" ON car_listings
FOR DELETE
USING (
  seller_id = auth.uid()
  OR EXISTS (SELECT 1 FROM dealer_accounts WHERE id = seller_id AND is_active = true)
  OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'powerdesk'))
);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'car_listings'
ORDER BY policyname;
