-- =============================================
-- GALLERY MODULE - DATABASE SETUP
-- Run this in Supabase SQL Editor
-- =============================================

-- Create gallery_images table
CREATE TABLE IF NOT EXISTS gallery_images (
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_gallery_images_folder ON gallery_images(folder);
CREATE INDEX IF NOT EXISTS idx_gallery_images_created_at ON gallery_images(created_at DESC);

-- Enable RLS
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "PowerDesk can manage gallery" ON gallery_images;
DROP POLICY IF EXISTS "Authenticated can view gallery" ON gallery_images;

-- Create policies
CREATE POLICY "PowerDesk can manage gallery" ON gallery_images
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND role = 'powerdesk'
  )
);

CREATE POLICY "Authenticated can view gallery" ON gallery_images
FOR SELECT
TO authenticated
USING (true);

-- Grant permissions
GRANT ALL ON gallery_images TO authenticated;

-- Verify table creation
SELECT 'gallery_images table created successfully!' as status;
