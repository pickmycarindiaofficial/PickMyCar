-- ============================================================
-- FIX SUSPEND/UNSUSPEND FUNCTIONALITY
-- ============================================================

-- Function: Suspend Dealer
CREATE OR REPLACE FUNCTION public.suspend_dealer(
  p_dealer_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Check if dealer exists
  SELECT EXISTS(SELECT 1 FROM public.dealer_accounts WHERE id = p_dealer_id)
  INTO v_exists;

  IF NOT v_exists THEN
    RETURN jsonb_build_object('success', false, 'message', 'Dealer not found');
  END IF;

  -- Update status
  UPDATE public.dealer_accounts
  SET 
    is_active = false,
    updated_at = now()
    -- We could store the reason in a 'suspension_reason' column if it existed, or an audit log
    -- For now, we just deactivate.
  WHERE id = p_dealer_id;

  RETURN jsonb_build_object('success', true, 'message', 'Dealer suspended successfully');
END;
$$;

-- Function: Activate (Unsuspend) Dealer
CREATE OR REPLACE FUNCTION public.activate_dealer(
  p_dealer_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Check if dealer exists
  SELECT EXISTS(SELECT 1 FROM public.dealer_accounts WHERE id = p_dealer_id)
  INTO v_exists;

  IF NOT v_exists THEN
    RETURN jsonb_build_object('success', false, 'message', 'Dealer not found');
  END IF;

  -- Update status
  UPDATE public.dealer_accounts
  SET 
    is_active = true,
    updated_at = now(),
    failed_otp_attempts = 0, -- Reset security counters
    is_locked = false
  WHERE id = p_dealer_id;

  RETURN jsonb_build_object('success', true, 'message', 'Dealer activated successfully');
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.suspend_dealer(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.suspend_dealer(UUID, TEXT) TO service_role;

GRANT EXECUTE ON FUNCTION public.activate_dealer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.activate_dealer(UUID) TO service_role;

SELECT 'SUCCESS: Suspend/Activate functions created' as status;
