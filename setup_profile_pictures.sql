-- =================================================================
-- PROFILE PICTURES STORAGE BUCKET
-- Run this in Supabase SQL Editor to enable profile picture uploads
-- =================================================================

-- Create the storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to profile pictures
CREATE POLICY "Public can view profile pictures"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-pictures');

-- Allow authenticated users to upload their own profile pictures
CREATE POLICY "Users can upload profile pictures"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-pictures');

-- Allow users to update their own profile pictures
CREATE POLICY "Users can update profile pictures"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profile-pictures');

-- Allow users to delete their own profile pictures
CREATE POLICY "Users can delete profile pictures"
ON storage.objects FOR DELETE
USING (bucket_id = 'profile-pictures');

-- =================================================================
-- ADD MISSING COLUMNS TO PROFILES TABLE (if not exists)
-- =================================================================

-- Add avatar_url to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add is_active column (default true for all users)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Set all existing profiles as active
UPDATE public.profiles SET is_active = true WHERE is_active IS NULL;

-- =================================================================
-- ADD MISSING COLUMNS TO CUSTOMER_PROFILES TABLE (if not exists)
-- =================================================================

-- Add avatar_url to customer_profiles table
ALTER TABLE public.customer_profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add is_active column (default true for all customers)
ALTER TABLE public.customer_profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Set all existing customer profiles as active
UPDATE public.customer_profiles SET is_active = true WHERE is_active IS NULL;

-- =================================================================
-- DONE! Profile picture uploads are now enabled.
-- =================================================================
