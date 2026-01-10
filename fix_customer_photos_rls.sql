-- ===================================================================
-- COMPREHENSIVE FIX FOR CUSTOMER PHOTO UPLOADS
-- Run this in Supabase SQL Editor
-- ===================================================================

-- Step 1: Create helper function to check if user can manage dealer photos
CREATE OR REPLACE FUNCTION public.can_manage_dealer_photos(
  _user_id uuid,
  _dealer_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- User can manage photos if they are:
  -- 1. PowerDesk admin, OR
  -- 2. The dealer themselves
  SELECT EXISTS (
    -- Check if user is PowerDesk admin
    SELECT 1 FROM user_roles 
    WHERE user_id = _user_id AND role = 'powerdesk'
  )
  OR _user_id = _dealer_id; -- Check if user is the dealer
$$;

-- Step 2: Drop old restrictive policies
DROP POLICY IF EXISTS "Dealers can upload customer photos" ON storage.objects;
DROP POLICY IF EXISTS "Dealers can delete own customer photos" ON storage.objects;

-- Step 3: Create NEW flexible policies

-- Policy 1: PowerDesk and Dealers can INSERT customer photos
CREATE POLICY "PowerDesk and dealers can upload customer photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'dealer-customer-photos'
  AND public.can_manage_dealer_photos(
    auth.uid(),
    ((storage.foldername(name))[1])::uuid  -- Extract dealer ID from path
  )
);

-- Policy 2: PowerDesk and Dealers can DELETE customer photos
CREATE POLICY "PowerDesk and dealers can delete customer photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'dealer-customer-photos'
  AND public.can_manage_dealer_photos(
    auth.uid(),
    ((storage.foldername(name))[1])::uuid
  )
);

-- Policy 3: Everyone can VIEW customer photos (unchanged)
DROP POLICY IF EXISTS "Anyone can view customer photos" ON storage.objects;
CREATE POLICY "Public can view customer photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'dealer-customer-photos');

-- Step 4: Ensure bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dealer-customer-photos',
  'dealer-customer-photos',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- ===================================================================
-- FIX DEALER_PROFILES TABLE PERMISSIONS
-- ===================================================================

-- Create policy for PowerDesk to update any dealer profile
DROP POLICY IF EXISTS "PowerDesk can update any dealer profile" ON dealer_profiles;
CREATE POLICY "PowerDesk can update any dealer profile"
ON dealer_profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'powerdesk'))
WITH CHECK (public.has_role(auth.uid(), 'powerdesk'));

-- Create policy for dealers to update their own profile
DROP POLICY IF EXISTS "Dealers can update own profile" ON dealer_profiles;
CREATE POLICY "Dealers can update own profile"
ON dealer_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ===================================================================
-- VERIFICATION QUERIES
-- ===================================================================

-- 1. Check if policies exist
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%customer photo%'
ORDER BY policyname;

-- 2. Verify bucket configuration
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'dealer-customer-photos';

-- 3. Check dealer_profiles policies
SELECT policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'dealer_profiles'
AND (policyname LIKE '%PowerDesk%' OR policyname LIKE '%Dealers%update%');
