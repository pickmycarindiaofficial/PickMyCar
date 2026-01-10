-- =====================================================
-- MESSAGING SYSTEM - MISSING PIECES
-- Phase 1 & 2 Completion Script
-- =====================================================

-- 1. CREATE FUNCTION: Mark conversation as read
-- =====================================================
CREATE OR REPLACE FUNCTION public.mark_conversation_as_read(
  p_conversation_id uuid,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE conversation_participants
  SET last_read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.mark_conversation_as_read(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.mark_conversation_as_read IS 'Marks all messages in a conversation as read for a specific user';


-- 2. CREATE STORAGE BUCKET: chat_files
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat_files', 'chat_files', true)
ON CONFLICT (id) DO NOTHING;


-- 3. STORAGE POLICIES: File upload permissions
-- =====================================================

-- Policy: Authenticated internal staff can upload chat files
CREATE POLICY "Internal staff can upload chat files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat_files'
  AND (
    has_role(auth.uid(), 'powerdesk'::app_role) OR
    has_role(auth.uid(), 'website_manager'::app_role) OR
    has_role(auth.uid(), 'dealer'::app_role) OR
    has_role(auth.uid(), 'sales'::app_role) OR
    has_role(auth.uid(), 'finance'::app_role) OR
    has_role(auth.uid(), 'inspection'::app_role)
  )
);

-- Policy: Anyone can view chat files (public bucket)
CREATE POLICY "Anyone can view chat files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'chat_files');

-- Policy: Users can update their own uploaded files
CREATE POLICY "Users can update their own chat files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'chat_files' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'chat_files');

-- Policy: Users can delete their own uploaded files
CREATE POLICY "Users can delete their own chat files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat_files' AND auth.uid() = owner);


-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify function exists
SELECT 
  proname AS function_name,
  pg_get_functiondef(oid) AS definition
FROM pg_proc 
WHERE proname = 'mark_conversation_as_read';

-- Verify storage bucket exists
SELECT * FROM storage.buckets WHERE id = 'chat_files';

-- Verify storage policies exist
SELECT 
  policyname,
  tablename,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
  AND policyname LIKE '%chat files%';
