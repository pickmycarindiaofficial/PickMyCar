-- ============================================================
-- QUICK FIX: Complete the dealer system schema setup
-- Run this after the initial script if it showed policy errors
-- ============================================================

-- Drop existing policies (safely)
DROP POLICY IF EXISTS "Service role full access" ON public.dealer_accounts;
DROP POLICY IF EXISTS "Service role full access" ON public.dealer_otp_sessions;
DROP POLICY IF EXISTS "Service role full access" ON public.dealer_sessions;

-- Recreate policies
CREATE POLICY "Service role full access" ON public.dealer_accounts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.dealer_otp_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON public.dealer_sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Make sure authenticated users can also use the functions
GRANT EXECUTE ON FUNCTION public.create_dealer_account TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dealer_by_username TO authenticated;
GRANT EXECUTE ON FUNCTION public.store_dealer_otp TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_dealer_otp TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_dealer_session TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_dealer_session TO authenticated;

-- Verify tables exist
SELECT 'dealer_accounts' as table_name, count(*) as row_count FROM public.dealer_accounts
UNION ALL
SELECT 'dealer_otp_sessions', count(*) FROM public.dealer_otp_sessions  
UNION ALL
SELECT 'dealer_sessions', count(*) FROM public.dealer_sessions;

SELECT 'SUCCESS: Dealer system schema is ready!' as status;
