-- ============================================================
-- FRESH DEALER SYSTEM - DATABASE SCHEMA
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. DEALER ACCOUNTS TABLE
-- Stores all dealer information (separated from Supabase Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.dealer_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Login credentials
  username TEXT UNIQUE NOT NULL,
  phone_number TEXT NOT NULL,
  
  -- Required business info
  dealership_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  email TEXT,
  
  -- Optional business info
  business_type TEXT,
  gst_number TEXT,
  pan_number TEXT,
  address TEXT,
  city_id UUID REFERENCES public.cities(id),
  state TEXT,
  pincode TEXT,
  
  -- Subscription
  plan_id UUID REFERENCES public.subscription_plans(id),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'expired', 'cancelled')),
  subscription_starts_at TIMESTAMPTZ DEFAULT now(),
  subscription_ends_at TIMESTAMPTZ DEFAULT (now() + interval '1 month'),
  
  -- Account status
  is_active BOOLEAN DEFAULT true,
  is_locked BOOLEAN DEFAULT false,
  failed_otp_attempts INTEGER DEFAULT 0,
  lock_expires_at TIMESTAMPTZ,
  
  -- Metadata
  last_login_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.staff_accounts(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_dealer_accounts_username ON public.dealer_accounts(username);
CREATE INDEX IF NOT EXISTS idx_dealer_accounts_phone ON public.dealer_accounts(phone_number);
CREATE INDEX IF NOT EXISTS idx_dealer_accounts_city ON public.dealer_accounts(city_id);

-- ============================================================
-- 2. DEALER OTP SESSIONS TABLE
-- Stores OTP hashes for WhatsApp verification
-- ============================================================
CREATE TABLE IF NOT EXISTS public.dealer_otp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID REFERENCES public.dealer_accounts(id) ON DELETE CASCADE,
  otp_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes'),
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_dealer_otp_expires ON public.dealer_otp_sessions(expires_at);

-- ============================================================
-- 3. DEALER SESSIONS TABLE
-- Stores active login sessions (JWT tokens)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.dealer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealer_id UUID REFERENCES public.dealer_accounts(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  is_revoked BOOLEAN DEFAULT false,
  device_info TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for token lookup
CREATE INDEX IF NOT EXISTS idx_dealer_sessions_token ON public.dealer_sessions(token_hash);

-- ============================================================
-- 4. SECURITY DEFINER FUNCTIONS (Bypass RLS)
-- ============================================================

-- Function: Create dealer account (called by Edge Function)
CREATE OR REPLACE FUNCTION public.create_dealer_account(
  p_username TEXT,
  p_phone_number TEXT,
  p_dealership_name TEXT,
  p_owner_name TEXT,
  p_email TEXT DEFAULT NULL,
  p_business_type TEXT DEFAULT NULL,
  p_gst_number TEXT DEFAULT NULL,
  p_pan_number TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_city_id UUID DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_pincode TEXT DEFAULT NULL,
  p_plan_id UUID DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dealer_id UUID;
BEGIN
  INSERT INTO public.dealer_accounts (
    username, phone_number, dealership_name, owner_name, email,
    business_type, gst_number, pan_number, address, city_id, state, pincode,
    plan_id, created_by
  ) VALUES (
    p_username, p_phone_number, p_dealership_name, p_owner_name, p_email,
    p_business_type, p_gst_number, p_pan_number, p_address, p_city_id, p_state, p_pincode,
    p_plan_id, p_created_by
  ) RETURNING id INTO v_dealer_id;
  
  RETURN v_dealer_id;
END;
$$;

-- Function: Get dealer by username (for login)
CREATE OR REPLACE FUNCTION public.get_dealer_by_username(p_username TEXT)
RETURNS TABLE (
  id UUID,
  phone_number TEXT,
  dealership_name TEXT,
  owner_name TEXT,
  is_active BOOLEAN,
  is_locked BOOLEAN,
  failed_otp_attempts INTEGER,
  lock_expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    da.id, da.phone_number, da.dealership_name, da.owner_name,
    da.is_active, da.is_locked, da.failed_otp_attempts, da.lock_expires_at
  FROM public.dealer_accounts da
  WHERE da.username = p_username;
END;
$$;

-- Function: Store OTP hash
CREATE OR REPLACE FUNCTION public.store_dealer_otp(
  p_dealer_id UUID,
  p_otp_hash TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_otp_id UUID;
BEGIN
  -- Invalidate previous OTPs
  UPDATE public.dealer_otp_sessions 
  SET is_used = true 
  WHERE dealer_id = p_dealer_id AND is_used = false;
  
  -- Insert new OTP
  INSERT INTO public.dealer_otp_sessions (dealer_id, otp_hash)
  VALUES (p_dealer_id, p_otp_hash)
  RETURNING id INTO v_otp_id;
  
  RETURN v_otp_id;
END;
$$;

-- Function: Verify OTP
CREATE OR REPLACE FUNCTION public.verify_dealer_otp(
  p_dealer_id UUID,
  p_otp_hash TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valid BOOLEAN := false;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.dealer_otp_sessions
    WHERE dealer_id = p_dealer_id
      AND otp_hash = p_otp_hash
      AND is_used = false
      AND expires_at > now()
  ) INTO v_valid;
  
  IF v_valid THEN
    -- Mark OTP as used
    UPDATE public.dealer_otp_sessions
    SET is_used = true
    WHERE dealer_id = p_dealer_id AND otp_hash = p_otp_hash;
    
    -- Reset failed attempts
    UPDATE public.dealer_accounts
    SET failed_otp_attempts = 0, last_login_at = now()
    WHERE id = p_dealer_id;
  ELSE
    -- Increment failed attempts
    UPDATE public.dealer_accounts
    SET failed_otp_attempts = failed_otp_attempts + 1,
        is_locked = CASE WHEN failed_otp_attempts >= 2 THEN true ELSE false END,
        lock_expires_at = CASE WHEN failed_otp_attempts >= 2 THEN now() + interval '5 minutes' ELSE NULL END
    WHERE id = p_dealer_id;
  END IF;
  
  RETURN v_valid;
END;
$$;

-- Function: Create dealer session
CREATE OR REPLACE FUNCTION public.create_dealer_session(
  p_dealer_id UUID,
  p_token_hash TEXT,
  p_device_info TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id UUID;
BEGIN
  INSERT INTO public.dealer_sessions (dealer_id, token_hash, device_info, ip_address)
  VALUES (p_dealer_id, p_token_hash, p_device_info, p_ip_address)
  RETURNING id INTO v_session_id;
  
  RETURN v_session_id;
END;
$$;

-- Function: Validate dealer session
CREATE OR REPLACE FUNCTION public.validate_dealer_session(p_token_hash TEXT)
RETURNS TABLE (
  dealer_id UUID,
  dealership_name TEXT,
  owner_name TEXT,
  is_valid BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    da.id as dealer_id,
    da.dealership_name,
    da.owner_name,
    (ds.id IS NOT NULL AND ds.expires_at > now() AND NOT ds.is_revoked AND da.is_active) as is_valid
  FROM public.dealer_sessions ds
  JOIN public.dealer_accounts da ON ds.dealer_id = da.id
  WHERE ds.token_hash = p_token_hash;
END;
$$;

-- ============================================================
-- 5. RLS POLICIES (Restrictive - functions bypass with SECURITY DEFINER)
-- ============================================================
ALTER TABLE public.dealer_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_otp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_sessions ENABLE ROW LEVEL SECURITY;

-- Only service_role and postgres can directly access
CREATE POLICY "Service role full access" ON public.dealer_accounts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.dealer_otp_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.dealer_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- 6. GRANT PERMISSIONS
-- ============================================================
GRANT EXECUTE ON FUNCTION public.create_dealer_account TO service_role;
GRANT EXECUTE ON FUNCTION public.get_dealer_by_username TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.store_dealer_otp TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_dealer_otp TO anon, service_role;
GRANT EXECUTE ON FUNCTION public.create_dealer_session TO service_role;
GRANT EXECUTE ON FUNCTION public.validate_dealer_session TO anon, authenticated, service_role;

-- ============================================================
-- DONE! Database schema created successfully.
-- ============================================================
SELECT 'SUCCESS: Fresh dealer system schema created!' as status;
