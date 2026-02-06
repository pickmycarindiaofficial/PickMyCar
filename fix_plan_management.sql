-- ============================================================
-- FIX PLAN MANAGEMENT - SECURE RPC FUNCTIONS
-- Run this script in Supabase SQL Editor
-- ============================================================

-- Function: Create Subscription Plan
CREATE OR REPLACE FUNCTION public.create_subscription_plan(
  p_plan JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_id UUID;
  v_result JSONB;
BEGIN
  INSERT INTO public.subscription_plans (
    name, display_name, description, price, currency, billing_period,
    listing_limit, featured_ads_limit, features, is_active, is_popular, sort_order, created_by
  ) VALUES (
    p_plan->>'name',
    p_plan->>'display_name',
    p_plan->>'description',
    (p_plan->>'price')::NUMERIC,
    COALESCE(p_plan->>'currency', 'INR'),
    p_plan->>'billing_period',
    (p_plan->>'listing_limit')::INTEGER,
    (p_plan->>'featured_ads_limit')::INTEGER,
    -- features is JSONB, pass directly (default to empty array if null)
    COALESCE(p_plan->'features', '[]'::jsonb),
    COALESCE((p_plan->>'is_active')::BOOLEAN, true),
    COALESCE((p_plan->>'is_popular')::BOOLEAN, false),
    COALESCE((p_plan->>'sort_order')::INTEGER, 0),
    (p_plan->>'created_by')::UUID
  ) RETURNING to_jsonb(subscription_plans.*) INTO v_result;

  RETURN v_result;
END;
$$;

-- Function: Update Subscription Plan
CREATE OR REPLACE FUNCTION public.update_subscription_plan(
  p_id UUID,
  p_updates JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Construct dynamic update
  UPDATE public.subscription_plans
  SET
    name = COALESCE(p_updates->>'name', name),
    display_name = COALESCE(p_updates->>'display_name', display_name),
    description = COALESCE(p_updates->>'description', description),
    price = COALESCE((p_updates->>'price')::NUMERIC, price),
    currency = COALESCE(p_updates->>'currency', currency),
    billing_period = COALESCE(p_updates->>'billing_period', billing_period),
    listing_limit = COALESCE((p_updates->>'listing_limit')::INTEGER, listing_limit),
    featured_ads_limit = COALESCE((p_updates->>'featured_ads_limit')::INTEGER, featured_ads_limit),
    -- Handle features as JSONB
    features = CASE WHEN p_updates ? 'features' THEN (p_updates->'features') ELSE features END,
    is_active = COALESCE((p_updates->>'is_active')::BOOLEAN, is_active),
    is_popular = COALESCE((p_updates->>'is_popular')::BOOLEAN, is_popular),
    sort_order = COALESCE((p_updates->>'sort_order')::INTEGER, sort_order),
    updated_at = now()
  WHERE id = p_id
  RETURNING to_jsonb(subscription_plans.*) INTO v_result;

  IF v_result IS NULL THEN
     RETURN jsonb_build_object('error', 'Plan not found');
  END IF;

  RETURN v_result;
END;
$$;

-- Function: Toggle Plan Status
CREATE OR REPLACE FUNCTION public.toggle_plan_status(
  p_id UUID,
  p_is_active BOOLEAN
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE public.subscription_plans
  SET is_active = p_is_active, updated_at = now()
  WHERE id = p_id
  RETURNING to_jsonb(subscription_plans.*) INTO v_result;

  IF v_result IS NULL THEN
     RETURN jsonb_build_object('error', 'Plan not found');
  END IF;

  RETURN v_result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_subscription_plan TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_subscription_plan TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.toggle_plan_status TO authenticated, service_role;
