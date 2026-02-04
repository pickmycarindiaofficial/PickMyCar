-- =============================================
-- FIX DELETE PERMISSIONS FOR CAR LISTINGS (SIMPLIFIED)
-- Run this in Supabase SQL Editor
-- =============================================

-- Drop ALL existing delete policies
DROP POLICY IF EXISTS "Users can delete own listings" ON car_listings;
DROP POLICY IF EXISTS "Dealers can delete own listings" ON car_listings;
DROP POLICY IF EXISTS "PowerDesk can delete any listing" ON car_listings;
DROP POLICY IF EXISTS "Allow delete for owners and powerdesk" ON car_listings;
DROP POLICY IF EXISTS "Allow authenticated users to delete listings" ON car_listings;

-- Create SIMPLE delete policy - allow authenticated users to delete if:
-- 1. They own the listing (seller_id matches auth.uid())
-- 2. OR they have powerdesk role
CREATE POLICY "Allow listing delete"
ON car_listings
FOR DELETE
TO authenticated
USING (
  seller_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'powerdesk'
  )
);

-- Ensure RLS is enabled
ALTER TABLE car_listings ENABLE ROW LEVEL SECURITY;

-- Grant delete permission
GRANT DELETE ON car_listings TO authenticated;

-- Verify policy was created
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'car_listings' AND cmd = 'DELETE';
