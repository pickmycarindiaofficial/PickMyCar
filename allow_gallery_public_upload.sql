-- ============================================================
-- ENABLE PUBLIC UPLOADS FOR CUSTOM AUTH USERS
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Permissive Storage Policy for Gallery
-- Since dealers use custom auth, they might appear as 'anon' to storage
DROP POLICY IF EXISTS "Public can upload to gallery" ON storage.objects;
CREATE POLICY "Public can upload to gallery" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'gallery');

-- 2. Permissive Select Policy for Gallery
DROP POLICY IF EXISTS "Public can select from gallery" ON storage.objects;
CREATE POLICY "Public can select from gallery" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'gallery');

-- 3. Database Table Permissions
-- Allow anon to INSERT into gallery_images (Application layer protects this via AuthContext checks)
-- This is needed because the postgres connection might be anon for custom auth users
DROP POLICY IF EXISTS "Public can insert gallery images" ON public.gallery_images;
CREATE POLICY "Public can insert gallery images" ON public.gallery_images
  FOR INSERT TO anon
  WITH CHECK (true);

-- Ensure update/delete is also possible
DROP POLICY IF EXISTS "Public can update gallery images" ON public.gallery_images;
CREATE POLICY "Public can update gallery images" ON public.gallery_images
  FOR UPDATE TO anon
  USING (true);

DROP POLICY IF EXISTS "Public can delete gallery images" ON public.gallery_images;
CREATE POLICY "Public can delete gallery images" ON public.gallery_images
  FOR DELETE TO anon
  USING (true);

SELECT 'SUCCESS: Gallery is now open for custom auth uploads!' as status;
