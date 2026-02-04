-- ============================================================
-- FIX GALLERY STORAGE & DATABASE PERMISSIONS
-- Run this ENTIRE script in Supabase SQL Editor to fix "Not authenticated" error
-- ============================================================

-- 1. Ensure 'gallery' storage bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('gallery', 'gallery', true, 52428800, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];

-- 2. Drop existing restrictive policies on storage.objects for gallery
DROP POLICY IF EXISTS "Give me access to gallery" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads to gallery" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload gallery" ON storage.objects;
DROP POLICY IF EXISTS "Public can view gallery" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete gallery" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update gallery" ON storage.objects;

-- 3. Create PERMISSIVE storage policies for 'gallery' bucket
-- Allow ANY authenticated user to upload (Staff, Admin, Dealer)
CREATE POLICY "Authenticated can upload gallery" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gallery');

-- Allow EVERYONE (including public) to view images
CREATE POLICY "Public can view gallery" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'gallery');

-- Allow authenticated users to update/delete their images
-- (Simplifying to allow any authenticated user to delete for easier management)
CREATE POLICY "Authenticated can delete gallery" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'gallery');

CREATE POLICY "Authenticated can update gallery" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'gallery');

-- ============================================================
-- 4. ENSURE DATABASE TABLE EXISTS & HAS CORRECT PERMISSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  original_name TEXT,
  url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  width INTEGER,
  height INTEGER,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  folder TEXT DEFAULT 'general'
);

-- Enable RLS
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Drop existing DB policies
DROP POLICY IF EXISTS "PowerDesk can manage gallery" ON public.gallery_images;
DROP POLICY IF EXISTS "Authenticated can view gallery" ON public.gallery_images;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.gallery_images;

-- Create PERMISSIVE DB Policy
-- Allow any authenticated user (PowerDesk, Staff, etc.) to do EVERYTHING on gallery_images
CREATE POLICY "Enable all access for authenticated users" ON public.gallery_images
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow public to VIEW (SELECT) images if needed for frontend display without auth
CREATE POLICY "Public can view gallery records" ON public.gallery_images
  FOR SELECT TO anon
  USING (true);

-- Grant permissions explicitly
GRANT ALL ON public.gallery_images TO authenticated;
GRANT SELECT ON public.gallery_images TO anon;
GRANT ALL ON public.gallery_images TO service_role;

-- ============================================================
-- CHECK STATUS
-- ============================================================
SELECT 'SUCCESS: Gallery storage bucket and permissions fixed!' as status;
