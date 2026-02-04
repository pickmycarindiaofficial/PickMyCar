-- =============================================
-- FIX DELETE PERMISSIONS FOR CAR LISTINGS
-- Run this in Supabase SQL Editor
-- =============================================

-- First, check existing RLS policies for car_listings
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'car_listings';

-- Drop existing delete policy if it exists (it might be too restrictive)
DROP POLICY IF EXISTS "Users can delete own listings" ON car_listings;
DROP POLICY IF EXISTS "Dealers can delete own listings" ON car_listings;
DROP POLICY IF EXISTS "PowerDesk can delete any listing" ON car_listings;
DROP POLICY IF EXISTS "Allow delete for owners and powerdesk" ON car_listings;

-- Create comprehensive delete policies

-- 1. Allow PowerDesk staff to delete any listing
CREATE POLICY "PowerDesk can delete any listing"
ON car_listings
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'powerdesk'
  )
);

-- 2. Allow dealers to delete their own listings
CREATE POLICY "Dealers can delete own listings"
ON car_listings
FOR DELETE
USING (
  seller_id = auth.uid()
  OR 
  seller_id IN (
    SELECT id FROM dealer_accounts 
    WHERE user_id = auth.uid()
  )
);

-- 3. Allow service role (for admin operations)
-- Note: Service role bypasses RLS, but this is for documentation

-- Verify the policies were created
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'car_listings' AND cmd = 'DELETE';

-- Also ensure the car_listings table has RLS enabled
ALTER TABLE car_listings ENABLE ROW LEVEL SECURITY;

-- Grant delete permission to authenticated users (RLS will filter)
GRANT DELETE ON car_listings TO authenticated;

-- Test: Try to check if a specific listing can be deleted
-- Replace 'YOUR_LISTING_ID' with an actual ID to test
-- SELECT id, seller_id, seller_type FROM car_listings WHERE id = 'YOUR_LISTING_ID';
