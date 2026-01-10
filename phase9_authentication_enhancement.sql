-- Phase 9: Multi-Tier Authentication System Enhancement
-- Creates tables for WhatsApp OTP, staff credentials, and admin login tracking

-- =====================================================
-- TABLE 1: OTP Verifications
-- =====================================================
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  otp_hash TEXT NOT NULL, -- Bcrypt hashed OTP
  purpose TEXT NOT NULL DEFAULT 'login', -- 'login', 'registration', 'password_reset'
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_phone_number CHECK (phone_number ~ '^\+?[1-9]\d{1,14}$'),
  CONSTRAINT valid_attempts CHECK (attempts >= 0 AND attempts <= max_attempts)
);

-- Index for fast lookups by phone number and expiration
CREATE INDEX idx_otp_phone_number ON public.otp_verifications(phone_number);
CREATE INDEX idx_otp_expires_at ON public.otp_verifications(expires_at);
CREATE INDEX idx_otp_phone_verified ON public.otp_verifications(phone_number, is_verified) 
  WHERE is_verified = false;

-- Enable RLS
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: System can insert OTP records
CREATE POLICY "System can insert OTP records"
  ON public.otp_verifications
  FOR INSERT
  WITH CHECK (true);

-- RLS Policy: System can update OTP records (for verification)
CREATE POLICY "System can update OTP records"
  ON public.otp_verifications
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- RLS Policy: PowerDesk can view all OTP records for security auditing
CREATE POLICY "PowerDesk can view all OTP records"
  ON public.otp_verifications
  FOR SELECT
  USING (has_role(auth.uid(), 'powerdesk'::app_role));

-- Auto-cleanup function for expired OTPs (run daily)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.otp_verifications
  WHERE expires_at < now() - INTERVAL '24 hours';
END;
$$;

-- =====================================================
-- TABLE 2: Staff Credentials
-- =====================================================
CREATE TABLE IF NOT EXISTS public.staff_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  locked_until TIMESTAMP WITH TIME ZONE,
  password_changed_at TIMESTAMP WITH TIME ZONE,
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  
  -- Constraints
  CONSTRAINT valid_username CHECK (
    username ~ '^[a-zA-Z0-9_]{3,30}$' AND
    username NOT IN ('admin', 'root', 'superuser', 'system')
  ),
  CONSTRAINT unique_user_id UNIQUE (user_id)
);

-- Indexes for performance
CREATE INDEX idx_staff_username ON public.staff_credentials(username);
CREATE INDEX idx_staff_user_id ON public.staff_credentials(user_id);
CREATE INDEX idx_staff_locked ON public.staff_credentials(is_locked, locked_until);

-- Enable RLS
ALTER TABLE public.staff_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policy: PowerDesk can manage all staff credentials
CREATE POLICY "PowerDesk can manage all staff credentials"
  ON public.staff_credentials
  FOR ALL
  USING (has_role(auth.uid(), 'powerdesk'::app_role))
  WITH CHECK (has_role(auth.uid(), 'powerdesk'::app_role));

-- RLS Policy: Staff can view their own credentials
CREATE POLICY "Staff can view own credentials"
  ON public.staff_credentials
  FOR SELECT
  USING (user_id = auth.uid());

-- RLS Policy: Staff can update their own last login
CREATE POLICY "Staff can update own last login"
  ON public.staff_credentials
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to update staff credentials timestamp
CREATE OR REPLACE FUNCTION update_staff_credentials_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger for automatic timestamp update
CREATE TRIGGER update_staff_credentials_timestamp_trigger
  BEFORE UPDATE ON public.staff_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_staff_credentials_timestamp();

-- =====================================================
-- TABLE 3: Admin Login Attempts
-- =====================================================
CREATE TABLE IF NOT EXISTS public.admin_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  step TEXT NOT NULL, -- 'username', 'password', 'otp'
  success BOOLEAN NOT NULL DEFAULT false,
  failure_reason TEXT,
  ip_address TEXT,
  user_agent TEXT,
  location_data JSONB, -- Optional: store geolocation data
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_step CHECK (step IN ('username', 'password', 'otp'))
);

-- Indexes for security auditing
CREATE INDEX idx_admin_attempts_user_id ON public.admin_login_attempts(user_id);
CREATE INDEX idx_admin_attempts_username ON public.admin_login_attempts(username);
CREATE INDEX idx_admin_attempts_created_at ON public.admin_login_attempts(created_at DESC);
CREATE INDEX idx_admin_attempts_success ON public.admin_login_attempts(success, created_at);

-- Enable RLS
ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only PowerDesk can view admin login attempts
CREATE POLICY "PowerDesk can view all admin login attempts"
  ON public.admin_login_attempts
  FOR SELECT
  USING (has_role(auth.uid(), 'powerdesk'::app_role));

-- RLS Policy: System can insert admin login attempts
CREATE POLICY "System can insert admin login attempts"
  ON public.admin_login_attempts
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- SECURITY HELPER FUNCTIONS
-- =====================================================

-- Function to check if username exists in staff_credentials
CREATE OR REPLACE FUNCTION public.staff_username_exists(p_username TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_credentials
    WHERE username = p_username
  );
$$;

-- Function to get staff user_id by username
CREATE OR REPLACE FUNCTION public.get_staff_user_id_by_username(p_username TEXT)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.staff_credentials
  WHERE username = p_username
  LIMIT 1;
$$;

-- Function to check if staff account is locked
CREATE OR REPLACE FUNCTION public.is_staff_account_locked(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_locked AND (locked_until IS NULL OR locked_until > now())
     FROM public.staff_credentials
     WHERE user_id = p_user_id),
    false
  );
$$;

-- Function to increment failed login attempts and lock account if needed
CREATE OR REPLACE FUNCTION public.record_failed_staff_login(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempts INTEGER;
BEGIN
  UPDATE public.staff_credentials
  SET 
    failed_login_attempts = failed_login_attempts + 1,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING failed_login_attempts INTO v_attempts;
  
  -- Lock account after 5 failed attempts for 30 minutes
  IF v_attempts >= 5 THEN
    UPDATE public.staff_credentials
    SET 
      is_locked = true,
      locked_until = now() + INTERVAL '30 minutes',
      updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
END;
$$;

-- Function to reset failed login attempts on successful login
CREATE OR REPLACE FUNCTION public.record_successful_staff_login(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.staff_credentials
  SET 
    failed_login_attempts = 0,
    is_locked = false,
    locked_until = NULL,
    last_login_at = now(),
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- Function to log admin login attempt
CREATE OR REPLACE FUNCTION public.log_admin_login_attempt(
  p_user_id UUID,
  p_username TEXT,
  p_step TEXT,
  p_success BOOLEAN,
  p_failure_reason TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.admin_login_attempts (
    user_id,
    username,
    step,
    success,
    failure_reason,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_username,
    p_step,
    p_success,
    p_failure_reason,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.staff_username_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_staff_user_id_by_username(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff_account_locked(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_failed_staff_login(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_successful_staff_login(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_admin_login_attempt(UUID, TEXT, TEXT, BOOLEAN, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_otps() TO authenticated;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.otp_verifications IS 'Stores WhatsApp OTP verification data with rate limiting and expiration';
COMMENT ON TABLE public.staff_credentials IS 'Stores staff login credentials and security metadata';
COMMENT ON TABLE public.admin_login_attempts IS 'Audit log for PowerDesk admin login attempts across all 3 steps';

COMMENT ON FUNCTION public.staff_username_exists(TEXT) IS 'Checks if a staff username already exists';
COMMENT ON FUNCTION public.get_staff_user_id_by_username(TEXT) IS 'Retrieves user_id for a given staff username';
COMMENT ON FUNCTION public.is_staff_account_locked(UUID) IS 'Checks if a staff account is currently locked';
COMMENT ON FUNCTION public.record_failed_staff_login(UUID) IS 'Increments failed attempts and locks account after 5 failures';
COMMENT ON FUNCTION public.record_successful_staff_login(UUID) IS 'Resets failed attempts and updates last login timestamp';
COMMENT ON FUNCTION public.log_admin_login_attempt IS 'Logs admin login attempts for security auditing';
