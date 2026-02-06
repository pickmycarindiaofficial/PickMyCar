-- =================================================================
-- FIX: Create and Configure OTP Verifications Table
-- Run this script to ensure the OTP system works for Staff Login
-- =================================================================

-- 1. Create otp_verifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    purpose TEXT DEFAULT 'login',
    expires_at TIMESTAMPTZ NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    attempts INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_otp_phone ON public.otp_verifications(phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON public.otp_verifications(expires_at);

-- 3. Enable Rules (RLS)
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (Crucial for Edge Functions)
-- Drop existing policies first to avoid "already exists" error
DROP POLICY IF EXISTS "Service Role has full access" ON public.otp_verifications;

-- Allow Service Role (Edge Functions) full access
CREATE POLICY "Service Role has full access" ON public.otp_verifications
    AS PERMISSIVE FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- Allow Anon/Auth to insert (if needed for client-side triggers, though ideally via Edge Function)
-- But primarily, Edge Functions use service_role.
-- Let's ensure anon can't read others' OTPs, but generating one is handled by Edge Function.

-- 5. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.otp_verifications TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.otp_verifications TO anon; 
GRANT SELECT, INSERT, UPDATE ON public.otp_verifications TO authenticated;

-- 6. Cleanup old/invalid entries (Optional maintenance)
DELETE FROM public.otp_verifications WHERE expires_at < NOW() - INTERVAL '1 day';

SELECT 'Success: OTP table configured.' as status;
