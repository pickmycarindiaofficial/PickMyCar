-- ==================================================================
-- CRITICAL: Run this SQL in your Supabase SQL Editor FIRST
-- ==================================================================
-- This migration adds customer_photos support to dealer profiles
-- Location: Supabase Dashboard > SQL Editor > New Query
-- ==================================================================

-- Step 1: Add missing columns to dealer_profiles table
ALTER TABLE dealer_profiles 
ADD COLUMN IF NOT EXISTS customer_photos jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS show_customer_photos boolean DEFAULT true;

-- Step 2: Create storage bucket for customer photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dealer-customer-photos', 'dealer-customer-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Step 3: RLS Policy - Dealers can upload customer photos
CREATE POLICY IF NOT EXISTS "Dealers can upload customer photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'dealer-customer-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Step 4: RLS Policy - Anyone can view customer photos
CREATE POLICY IF NOT EXISTS "Anyone can view customer photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'dealer-customer-photos');

-- Step 5: RLS Policy - Dealers can delete own customer photos
CREATE POLICY IF NOT EXISTS "Dealers can delete own customer photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'dealer-customer-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ==================================================================
-- VERIFICATION QUERIES (Run these to confirm setup)
-- ==================================================================

-- Check if columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'dealer_profiles' 
AND column_name IN ('customer_photos', 'show_customer_photos');

-- Check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'dealer-customer-photos';

-- Check RLS policies
SELECT policyname, permissive, cmd 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%customer photos%';
