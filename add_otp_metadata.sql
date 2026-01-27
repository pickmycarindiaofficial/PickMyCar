-- ============================================================
-- Add metadata column to otp_verifications table
-- This enables storing dealer_id for dealer OTP verification
-- Run this in Supabase SQL Editor
-- ============================================================

-- Add metadata column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'otp_verifications' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.otp_verifications 
        ADD COLUMN metadata JSONB DEFAULT NULL;
        RAISE NOTICE 'Added metadata column to otp_verifications';
    ELSE
        RAISE NOTICE 'metadata column already exists';
    END IF;
END $$;

-- Fix RLS for dealer_accounts (drop first, then create)
DROP POLICY IF EXISTS "authenticated_read_dealers" ON public.dealer_accounts;
CREATE POLICY "authenticated_read_dealers" ON public.dealer_accounts
  FOR SELECT TO authenticated USING (true);

GRANT SELECT ON public.dealer_accounts TO authenticated;

SELECT 'SUCCESS: OTP system ready for universal use!' as status;
