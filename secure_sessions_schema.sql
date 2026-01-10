-- =================================================================
-- PRODUCTION GRADE SECURE SESSION MANAGEMENT
-- =================================================================
-- Run this ENTIRE script in Supabase SQL Editor
-- =================================================================

-- =================================================================
-- 1. STAFF SESSIONS TABLE (Server-side session storage)
-- =================================================================
CREATE TABLE IF NOT EXISTS public.staff_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff_accounts(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,  -- SHA256 hash of session token
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  is_revoked BOOLEAN DEFAULT false,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_staff_sessions_token ON public.staff_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_staff ON public.staff_sessions(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_expires ON public.staff_sessions(expires_at);

-- Enable RLS
ALTER TABLE public.staff_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (sessions managed via functions only)
DROP POLICY IF EXISTS "Sessions managed via functions" ON public.staff_sessions;
CREATE POLICY "Sessions managed via functions" ON public.staff_sessions
  FOR ALL USING (true);

-- =================================================================
-- 2. SESSION MANAGEMENT FUNCTIONS
-- =================================================================

-- Function: Create a new session
CREATE OR REPLACE FUNCTION public.create_staff_session(
  p_staff_id UUID,
  p_token_hash TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_expires_hours INTEGER DEFAULT 8
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- Create new session
  INSERT INTO public.staff_sessions (
    staff_id,
    token_hash,
    ip_address,
    user_agent,
    expires_at
  ) VALUES (
    p_staff_id,
    p_token_hash,
    p_ip_address,
    p_user_agent,
    now() + (p_expires_hours || ' hours')::interval
  ) RETURNING id INTO v_session_id;
  
  -- Log the session creation
  INSERT INTO public.staff_login_audit (staff_id, action, ip_address, user_agent)
  VALUES (p_staff_id, 'login_success', p_ip_address, p_user_agent);
  
  RETURN v_session_id;
END;
$$;

-- Function: Validate a session
CREATE OR REPLACE FUNCTION public.validate_staff_session(p_token_hash TEXT)
RETURNS TABLE (
  is_valid BOOLEAN,
  staff_id UUID,
  username TEXT,
  role TEXT,
  full_name TEXT,
  session_id UUID
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_session RECORD;
  v_staff RECORD;
BEGIN
  -- Find session by token hash
  SELECT * INTO v_session 
  FROM public.staff_sessions 
  WHERE token_hash = p_token_hash 
    AND is_revoked = false 
    AND expires_at > now()
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  -- Update last activity
  UPDATE public.staff_sessions 
  SET last_activity_at = now() 
  WHERE id = v_session.id;
  
  -- Get staff details
  SELECT * INTO v_staff 
  FROM public.staff_accounts 
  WHERE id = v_session.staff_id AND is_active = true;
  
  IF NOT FOUND OR v_staff.is_locked THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 
    true, 
    v_staff.id, 
    v_staff.username, 
    v_staff.role, 
    v_staff.full_name,
    v_session.id;
END;
$$;

-- Function: Revoke a session (logout)
CREATE OR REPLACE FUNCTION public.revoke_staff_session(p_token_hash TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_session RECORD;
BEGIN
  SELECT * INTO v_session FROM public.staff_sessions WHERE token_hash = p_token_hash;
  
  IF FOUND THEN
    UPDATE public.staff_sessions SET is_revoked = true WHERE id = v_session.id;
    INSERT INTO public.staff_login_audit (staff_id, action) VALUES (v_session.staff_id, 'logout');
  END IF;
END;
$$;

-- Function: Revoke all sessions for a staff member
CREATE OR REPLACE FUNCTION public.revoke_all_staff_sessions(p_staff_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.staff_sessions 
  SET is_revoked = true 
  WHERE staff_id = p_staff_id AND is_revoked = false;
END;
$$;

-- Function: Clean up expired sessions (run daily via cron)
CREATE OR REPLACE FUNCTION public.cleanup_expired_staff_sessions()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM public.staff_sessions 
  WHERE expires_at < now() - INTERVAL '7 days';
END;
$$;

-- Function: Get active sessions for a staff member
CREATE OR REPLACE FUNCTION public.get_staff_active_sessions(p_staff_id UUID)
RETURNS TABLE (
  session_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.ip_address,
    s.user_agent,
    s.created_at,
    s.last_activity_at,
    s.expires_at
  FROM public.staff_sessions s
  WHERE s.staff_id = p_staff_id 
    AND s.is_revoked = false 
    AND s.expires_at > now()
  ORDER BY s.created_at DESC;
END;
$$;

-- =================================================================
-- DONE! Session management is ready.
-- =================================================================
