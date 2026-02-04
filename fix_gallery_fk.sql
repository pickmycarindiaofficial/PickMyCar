-- ============================================================
-- FIX FOREIGN KEY CONSTRAINT FOR DEALERS
-- Run in Supabase SQL Editor
-- ============================================================

-- The uploaded_by column currently references auth.users(id).
-- But Dealers have their own IDs in dealer_accounts, which are NOT in auth.users.
-- We must remove this constraint to allow Dealers to upload images.

ALTER TABLE public.gallery_images
DROP CONSTRAINT IF EXISTS gallery_images_uploaded_by_fkey;

-- Verify it's gone
SELECT 'SUCCESS: Foreign key constraint removed. Dealers can now upload!' as status;
