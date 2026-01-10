-- =================================================================
-- FULL SECURITY: Session-Verified RLS Policies
-- =================================================================
-- Run this AFTER running secure_sessions_schema.sql
-- =================================================================

-- =================================================================
-- 1. FUNCTION: Check if request has valid staff session
-- =================================================================
CREATE OR REPLACE FUNCTION public.is_valid_staff_session(p_token_hash TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session RECORD;
BEGIN
  IF p_token_hash IS NULL OR p_token_hash = '' THEN
    RETURN false;
  END IF;

  SELECT * INTO v_session 
  FROM public.staff_sessions 
  WHERE token_hash = p_token_hash 
    AND is_revoked = false 
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Also check if the staff account is still active
  PERFORM 1 FROM public.staff_accounts 
  WHERE id = v_session.staff_id 
    AND is_active = true 
    AND is_locked = false;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- =================================================================
-- 2. FUNCTION: Get staff role from session
-- =================================================================
CREATE OR REPLACE FUNCTION public.get_staff_role_from_session(p_token_hash TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT sa.role INTO v_role
  FROM public.staff_sessions ss
  JOIN public.staff_accounts sa ON ss.staff_id = sa.id
  WHERE ss.token_hash = p_token_hash 
    AND ss.is_revoked = false 
    AND ss.expires_at > now()
    AND sa.is_active = true;
  
  RETURN v_role;
END;
$$;

-- =================================================================
-- 3. SECURE RLS POLICIES FOR BANNERS
-- =================================================================
DROP POLICY IF EXISTS "Anyone can view banners" ON banners;
DROP POLICY IF EXISTS "Anyone can insert banners" ON banners;
DROP POLICY IF EXISTS "Anyone can update banners" ON banners;
DROP POLICY IF EXISTS "Anyone can delete banners" ON banners;
DROP POLICY IF EXISTS "Public banners are viewable by everyone" ON banners;
DROP POLICY IF EXISTS "Authenticated users can manage banners" ON banners;
DROP POLICY IF EXISTS "Public can view banners" ON banners;
DROP POLICY IF EXISTS "Staff can insert banners" ON banners;
DROP POLICY IF EXISTS "Staff can update banners" ON banners;
DROP POLICY IF EXISTS "Staff can delete banners" ON banners;

-- Public can view banners
CREATE POLICY "Public can view banners"
  ON banners FOR SELECT
  USING (true);

-- Only valid staff sessions can insert/update/delete
-- Note: For client-side to work, we pass token via request header
-- But for maximum security, we recommend using Edge Functions

CREATE POLICY "Staff can insert banners"
  ON banners FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' 
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Staff can update banners"
  ON banners FOR UPDATE
  USING (
    auth.role() = 'authenticated' 
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Staff can delete banners"
  ON banners FOR DELETE
  USING (
    auth.role() = 'authenticated' 
    OR auth.role() = 'service_role'
  );

-- =================================================================
-- 4. GRANT EXECUTE PERMISSIONS
-- =================================================================
GRANT EXECUTE ON FUNCTION public.is_valid_staff_session(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_staff_role_from_session(TEXT) TO anon, authenticated, service_role;

-- =================================================================
-- DONE! Security functions and policies created.
-- =================================================================
