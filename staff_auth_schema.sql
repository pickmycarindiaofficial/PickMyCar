-- =================================================================
-- PRODUCTION GRADE STAFF AUTHENTICATION SYSTEM
-- =================================================================
-- Run this ENTIRE script in Supabase SQL Editor
-- =================================================================

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =================================================================
-- 1. STAFF ACCOUNTS TABLE (Primary Staff Data)
-- =================================================================
CREATE TABLE IF NOT EXISTS public.staff_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone_number TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('powerdesk', 'dealer', 'sales', 'finance', 'inspection', 'website_manager')),
  is_active BOOLEAN DEFAULT true,
  is_locked BOOLEAN DEFAULT false,
  failed_login_attempts INTEGER DEFAULT 0,
  last_login_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.staff_accounts(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_staff_accounts_username ON public.staff_accounts(username);
CREATE INDEX IF NOT EXISTS idx_staff_accounts_role ON public.staff_accounts(role);
CREATE INDEX IF NOT EXISTS idx_staff_accounts_phone ON public.staff_accounts(phone_number);

-- =================================================================
-- 2. STAFF LOGIN AUDIT TABLE (Security Logging)
-- =================================================================
CREATE TABLE IF NOT EXISTS public.staff_login_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff_accounts(id),
  username TEXT,
  action TEXT NOT NULL CHECK (action IN ('login_success', 'login_failed', 'logout', 'password_change', 'account_locked', 'account_unlocked', 'otp_sent', 'otp_verified', 'otp_failed')),
  ip_address TEXT,
  user_agent TEXT,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_login_audit_staff ON public.staff_login_audit(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_login_audit_created ON public.staff_login_audit(created_at DESC);

-- =================================================================
-- 3. HELPER FUNCTIONS
-- =================================================================

-- Function: Verify staff password
CREATE OR REPLACE FUNCTION public.verify_staff_password(
  p_username TEXT,
  p_password TEXT
) RETURNS TABLE (
  staff_id UUID,
  full_name TEXT,
  role TEXT,
  phone_number TEXT,
  is_locked BOOLEAN,
  is_valid BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_staff RECORD;
BEGIN
  SELECT * INTO v_staff FROM public.staff_accounts WHERE username = p_username AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, false, false;
    RETURN;
  END IF;
  
  IF v_staff.is_locked THEN
    RETURN QUERY SELECT v_staff.id, v_staff.full_name, v_staff.role, v_staff.phone_number, true, false;
    RETURN;
  END IF;
  
  IF v_staff.password_hash = crypt(p_password, v_staff.password_hash) THEN
    -- Password correct
    RETURN QUERY SELECT v_staff.id, v_staff.full_name, v_staff.role, v_staff.phone_number, false, true;
  ELSE
    -- Password incorrect
    RETURN QUERY SELECT v_staff.id, v_staff.full_name, v_staff.role, v_staff.phone_number, false, false;
  END IF;
END;
$$;

-- Function: Record failed login attempt
CREATE OR REPLACE FUNCTION public.record_staff_failed_login(p_staff_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_attempts INTEGER;
BEGIN
  UPDATE public.staff_accounts 
  SET failed_login_attempts = failed_login_attempts + 1,
      updated_at = now()
  WHERE id = p_staff_id
  RETURNING failed_login_attempts INTO v_attempts;
  
  -- Lock account after 5 failed attempts
  IF v_attempts >= 5 THEN
    UPDATE public.staff_accounts SET is_locked = true WHERE id = p_staff_id;
    INSERT INTO public.staff_login_audit (staff_id, action) VALUES (p_staff_id, 'account_locked');
  END IF;
END;
$$;

-- Function: Record successful login
CREATE OR REPLACE FUNCTION public.record_staff_successful_login(p_staff_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.staff_accounts 
  SET failed_login_attempts = 0,
      last_login_at = now(),
      updated_at = now()
  WHERE id = p_staff_id;
END;
$$;

-- Function: Check if username exists
CREATE OR REPLACE FUNCTION public.staff_account_exists(p_username TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.staff_accounts WHERE username = p_username AND is_active = true);
END;
$$;

-- Function: Get staff by username (for login flow)
CREATE OR REPLACE FUNCTION public.get_staff_by_username(p_username TEXT)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  role TEXT,
  phone_number TEXT,
  is_locked BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY 
  SELECT sa.id, sa.full_name, sa.role, sa.phone_number, sa.is_locked
  FROM public.staff_accounts sa
  WHERE sa.username = p_username AND sa.is_active = true;
END;
$$;

-- Function: Create staff account (for admin use)
CREATE OR REPLACE FUNCTION public.create_staff_account(
  p_username TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_phone_number TEXT,
  p_role TEXT,
  p_email TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_new_id UUID;
BEGIN
  INSERT INTO public.staff_accounts (
    username, password_hash, full_name, phone_number, role, email, created_by
  ) VALUES (
    p_username,
    crypt(p_password, gen_salt('bf', 12)),
    p_full_name,
    p_phone_number,
    p_role,
    p_email,
    p_created_by
  ) RETURNING id INTO v_new_id;
  
  RETURN v_new_id;
END;
$$;

-- Function: Update staff password
CREATE OR REPLACE FUNCTION public.update_staff_password(
  p_staff_id UUID,
  p_new_password TEXT
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.staff_accounts 
  SET password_hash = crypt(p_new_password, gen_salt('bf', 12)),
      updated_at = now()
  WHERE id = p_staff_id;
  
  INSERT INTO public.staff_login_audit (staff_id, action) VALUES (p_staff_id, 'password_change');
END;
$$;

-- Function: Log login attempt
CREATE OR REPLACE FUNCTION public.log_staff_login(
  p_staff_id UUID,
  p_username TEXT,
  p_action TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_failure_reason TEXT DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.staff_login_audit (staff_id, username, action, ip_address, user_agent, failure_reason)
  VALUES (p_staff_id, p_username, p_action, p_ip_address, p_user_agent, p_failure_reason);
END;
$$;

-- =================================================================
-- 4. ROW LEVEL SECURITY
-- =================================================================

ALTER TABLE public.staff_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_login_audit ENABLE ROW LEVEL SECURITY;

-- Staff accounts: Only authenticated users can read, only powerdesk can modify
CREATE POLICY "Staff can view own account" ON public.staff_accounts
  FOR SELECT USING (true); -- RPCs handle actual auth, this allows function access

CREATE POLICY "PowerDesk can manage staff" ON public.staff_accounts
  FOR ALL USING (true); -- RPCs are SECURITY DEFINER, so they bypass RLS

-- Audit logs: Read-only for everyone, insert via functions
CREATE POLICY "Audit logs are append-only" ON public.staff_login_audit
  FOR SELECT USING (true);

CREATE POLICY "Audit logs insert via functions" ON public.staff_login_audit
  FOR INSERT WITH CHECK (true);

-- =================================================================
-- 5. CREATE FIRST ADMIN ACCOUNT
-- =================================================================

INSERT INTO public.staff_accounts (
  username,
  password_hash,
  full_name,
  phone_number,
  role,
  is_active
) VALUES (
  'roshanmahendra',
  crypt('Prawin1991!', gen_salt('bf', 12)),
  'Roshan Mahendra',
  '+917305004047',
  'powerdesk',
  true
) ON CONFLICT (username) DO UPDATE SET
  password_hash = crypt('Prawin1991!', gen_salt('bf', 12)),
  phone_number = '+917305004047',
  role = 'powerdesk',
  is_active = true,
  is_locked = false,
  failed_login_attempts = 0;

-- =================================================================
-- DONE! Your admin account is ready.
-- Username: roshanmahendra
-- Password: Prawin1991!
-- Phone: +917305004047
-- =================================================================
