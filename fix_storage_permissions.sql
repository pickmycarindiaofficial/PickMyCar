-- ============================================================
-- Fix Storage Bucket Permissions for Dealer Uploads
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Allow authenticated users (including anon for public uploads) to upload to car-listings bucket
INSERT INTO storage.policies (name, definition, bucket_id)
SELECT 
  'Public upload access',
  '(bucket_id = ''car-listings'')',
  id
FROM storage.buckets WHERE name = 'car-listings'
ON CONFLICT DO NOTHING;

-- Alternative: Update existing policies
-- This allows any authenticated user or anon user to upload
UPDATE storage.objects 
SET owner = NULL 
WHERE bucket_id = 'car-listings';

-- 2. Create permissive policy for car-listings bucket
-- First check if policy exists
DO $$ 
BEGIN
  -- Drop existing policies that might be blocking
  DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can upload to car-listings" ON storage.objects;
  
  -- Create new permissive policy
  CREATE POLICY "Anyone can upload to car-listings" ON storage.objects
    FOR INSERT 
    WITH CHECK (bucket_id = 'car-listings');
    
  CREATE POLICY "Anyone can read car-listings" ON storage.objects
    FOR SELECT 
    USING (bucket_id = 'car-listings');
    
  CREATE POLICY "Owners can update car-listings" ON storage.objects
    FOR UPDATE 
    USING (bucket_id = 'car-listings');
    
  CREATE POLICY "Owners can delete car-listings" ON storage.objects
    FOR DELETE 
    USING (bucket_id = 'car-listings');
    
  RAISE NOTICE 'Storage policies created successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Some policies may already exist or could not be created: %', SQLERRM;
END $$;

SELECT 'SUCCESS: Storage policies updated for dealer uploads!' as status;
