-- =================================================================
-- CUSTOMER SESSIONS TABLE (Simple phone-verified login)
-- =================================================================

CREATE TABLE IF NOT EXISTS public.customer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  is_revoked BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_customer_sessions_token ON public.customer_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_customer_sessions_phone ON public.customer_sessions(phone_number);

-- Enable RLS
ALTER TABLE public.customer_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customer sessions managed via functions" ON public.customer_sessions;
CREATE POLICY "Customer sessions managed via functions" ON public.customer_sessions
  FOR ALL USING (true);

-- =================================================================
-- CUSTOMER PROFILES TABLE (with onboarding fields)
-- =================================================================
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT UNIQUE NOT NULL,
  full_name TEXT,
  email TEXT,
  city TEXT,
  location_lat DECIMAL,
  location_lng DECIMAL,
  is_profile_complete BOOLEAN DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view customer profiles" ON public.customer_profiles;
CREATE POLICY "Anyone can view customer profiles" ON public.customer_profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service can manage profiles" ON public.customer_profiles;
CREATE POLICY "Service can manage profiles" ON public.customer_profiles
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Customers can update own profile" ON public.customer_profiles;
CREATE POLICY "Customers can update own profile" ON public.customer_profiles
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can insert profile" ON public.customer_profiles;
CREATE POLICY "Anyone can insert profile" ON public.customer_profiles
  FOR INSERT WITH CHECK (true);

-- =================================================================
-- FUNCTIONS
-- =================================================================

-- Create customer session
CREATE OR REPLACE FUNCTION public.create_customer_session(
  p_phone_number TEXT,
  p_token_hash TEXT,
  p_expires_hours INTEGER DEFAULT 168  -- 7 days
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_session_id UUID;
BEGIN
  INSERT INTO public.customer_sessions (phone_number, token_hash, expires_at)
  VALUES (p_phone_number, p_token_hash, now() + (p_expires_hours || ' hours')::interval)
  RETURNING id INTO v_session_id;
  
  RETURN v_session_id;
END;
$$;

-- Validate customer session
CREATE OR REPLACE FUNCTION public.validate_customer_session(p_token_hash TEXT)
RETURNS TABLE (is_valid BOOLEAN, phone_number TEXT, session_id UUID)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_session RECORD;
BEGIN
  SELECT * INTO v_session 
  FROM public.customer_sessions 
  WHERE token_hash = p_token_hash 
    AND is_revoked = false 
    AND expires_at > now()
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::UUID;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, v_session.phone_number, v_session.id;
END;
$$;

-- Revoke customer session
CREATE OR REPLACE FUNCTION public.revoke_customer_session(p_token_hash TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.customer_sessions SET is_revoked = true WHERE token_hash = p_token_hash;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_customer_session(TEXT, TEXT, INTEGER) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_customer_session(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.revoke_customer_session(TEXT) TO anon, authenticated, service_role;

-- =================================================================
-- DONE!
-- =================================================================
