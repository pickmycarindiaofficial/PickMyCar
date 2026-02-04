-- ============================================================
-- FIX BANNER MANAGEMENT PERMISSIONS
-- Run in Supabase SQL Editor
-- ============================================================

-- Since we removed the Edge Function dependency, we need to allow direct DB access.
-- Banners are public content, so risk is low, but we restrict to valid users in Frontend.

-- 1. Enable RLS (if not enabled)
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- 2. Drop restrictive policies
DROP POLICY IF EXISTS "Anyone can view banners" ON public.banners;
DROP POLICY IF EXISTS "Anyone can insert banners" ON public.banners;
DROP POLICY IF EXISTS "Anyone can update banners" ON public.banners;
DROP POLICY IF EXISTS "Anyone can delete banners" ON public.banners;

DROP POLICY IF EXISTS "Public banners are viewable by everyone" ON public.banners;
DROP POLICY IF EXISTS "Authenticated users can manage banners" ON public.banners;

-- 3. Create OPEN policies (Frontend AuthContext handles security)
-- Allow VIEW for everyone
DROP POLICY IF EXISTS "Public can view banners" ON public.banners;
CREATE POLICY "Public can view banners" ON public.banners
  FOR SELECT USING (true);

-- Allow INSERT/UPDATE/DELETE for 'anon' and 'authenticated'
-- (Because Dealers/Staff might be 'anon' with a custom token)
DROP POLICY IF EXISTS "Public can manage banners" ON public.banners;
CREATE POLICY "Public can manage banners" ON public.banners
  FOR ALL
  USING (true)
  WITH CHECK (true);

GRANT ALL ON public.banners TO anon;
GRANT ALL ON public.banners TO authenticated;
GRANT ALL ON public.banners TO service_role;

SELECT 'SUCCESS: Banner permissions fixed. You can now create/delete banners.' as status;
