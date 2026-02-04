-- =============================================
-- EMERGENCY FIX - DISABLE RLS FOR DELETE
-- Run this ENTIRE script in Supabase SQL Editor
-- =============================================

-- STEP 1: Disable RLS completely on car_listings (for testing)
ALTER TABLE car_listings DISABLE ROW LEVEL SECURITY;

-- STEP 2: If you want to keep RLS enabled but allow all deletes:
-- Uncomment the lines below and comment out STEP 1

-- ALTER TABLE car_listings ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Allow all authenticated deletes" ON car_listings;
-- CREATE POLICY "Allow all authenticated deletes" ON car_listings FOR DELETE USING (true);
-- DROP POLICY IF EXISTS "Allow all authenticated updates" ON car_listings;
-- CREATE POLICY "Allow all authenticated updates" ON car_listings FOR UPDATE USING (true) WITH CHECK (true);

-- Verify RLS is disabled
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'car_listings';
