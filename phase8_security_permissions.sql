-- Phase 8: Security & Permissions Infrastructure
-- Run this script in Supabase SQL Editor
-- This sets up comprehensive role-based access control and RLS policies

-- ====================================================================
-- STEP 1: Create App Role Enum (if not exists)
-- ====================================================================
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('user', 'dealer', 'admin', 'powerdesk');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ====================================================================
-- STEP 2: Create User Roles Table
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- STEP 3: Create Security Definer Functions
-- ====================================================================

-- Function to check if a user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if current user has a specific role
CREATE OR REPLACE FUNCTION public.current_user_has_role(_role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), _role)
$$;

-- Function to get all roles for a user
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
$$;

-- Function to check if user is admin or powerdesk
CREATE OR REPLACE FUNCTION public.is_admin_or_powerdesk(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'powerdesk')
  )
$$;

-- ====================================================================
-- STEP 4: RLS Policies for user_roles Table
-- ====================================================================

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins and powerdesk can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.current_user_has_role('admin') OR public.current_user_has_role('powerdesk'));

-- Only admins and powerdesk can insert roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.current_user_has_role('admin') OR public.current_user_has_role('powerdesk'));

-- Only admins and powerdesk can delete roles
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.current_user_has_role('admin') OR public.current_user_has_role('powerdesk'));

-- ====================================================================
-- STEP 5: RLS Policies for Lead Enrichment
-- ====================================================================

-- Dealers can view enrichment for their own leads
CREATE POLICY "Dealers can view own lead enrichment"
ON public.lead_enrichment
FOR SELECT
TO authenticated
USING (
  dealer_id = auth.uid() OR 
  public.is_admin_or_powerdesk(auth.uid())
);

-- Admins and powerdesk can view all lead enrichment
CREATE POLICY "Admins can view all lead enrichment"
ON public.lead_enrichment
FOR SELECT
TO authenticated
USING (public.is_admin_or_powerdesk(auth.uid()));

-- System can insert lead enrichment
CREATE POLICY "System can insert lead enrichment"
ON public.lead_enrichment
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only admins can update lead enrichment
CREATE POLICY "Admins can update lead enrichment"
ON public.lead_enrichment
FOR UPDATE
TO authenticated
USING (public.is_admin_or_powerdesk(auth.uid()));

-- ====================================================================
-- STEP 6: RLS Policies for Market Signals
-- ====================================================================

-- Dealers can view market signals
CREATE POLICY "Dealers can view market signals"
ON public.market_signals
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'dealer') OR 
  public.is_admin_or_powerdesk(auth.uid())
);

-- Only system can insert market signals
CREATE POLICY "System can insert market signals"
ON public.market_signals
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_powerdesk(auth.uid()));

-- ====================================================================
-- STEP 7: RLS Policies for AI Suggestions
-- ====================================================================

-- Users can view their own AI suggestions
CREATE POLICY "Users can view own AI suggestions"
ON public.ai_suggestions
FOR SELECT
TO authenticated
USING (
  target_user_id = auth.uid() OR 
  public.is_admin_or_powerdesk(auth.uid())
);

-- System can insert AI suggestions
CREATE POLICY "System can insert AI suggestions"
ON public.ai_suggestions
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_powerdesk(auth.uid()));

-- Users can update their own AI suggestions (status, dismiss_reason)
CREATE POLICY "Users can update own AI suggestions"
ON public.ai_suggestions
FOR UPDATE
TO authenticated
USING (target_user_id = auth.uid())
WITH CHECK (target_user_id = auth.uid());

-- ====================================================================
-- STEP 8: RLS Policies for Demand Gap Notifications
-- ====================================================================

-- Dealers can view their own demand gap notifications
CREATE POLICY "Dealers can view own demand gaps"
ON public.demand_gap_notifications
FOR SELECT
TO authenticated
USING (
  dealer_id = auth.uid() OR 
  public.is_admin_or_powerdesk(auth.uid())
);

-- System can insert demand gap notifications
CREATE POLICY "System can insert demand gaps"
ON public.demand_gap_notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Dealers can update their own demand gap notifications
CREATE POLICY "Dealers can update own demand gaps"
ON public.demand_gap_notifications
FOR UPDATE
TO authenticated
USING (dealer_id = auth.uid())
WITH CHECK (dealer_id = auth.uid());

-- ====================================================================
-- STEP 9: RLS Policies for Car Enquiries
-- ====================================================================

-- Enable RLS on car_enquiries if not already enabled
ALTER TABLE public.car_enquiries ENABLE ROW LEVEL SECURITY;

-- Users can view their own enquiries
CREATE POLICY "Users can view own enquiries"
ON public.car_enquiries
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Dealers can view enquiries for their listings
CREATE POLICY "Dealers can view enquiries for their listings"
ON public.car_enquiries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.car_listings
    WHERE car_listings.id = car_enquiries.listing_id
      AND car_listings.dealer_id = auth.uid()
  )
);

-- Admins can view all enquiries
CREATE POLICY "Admins can view all enquiries"
ON public.car_enquiries
FOR SELECT
TO authenticated
USING (public.is_admin_or_powerdesk(auth.uid()));

-- Authenticated users can create enquiries
CREATE POLICY "Users can create enquiries"
ON public.car_enquiries
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ====================================================================
-- STEP 10: RLS Policies for Notifications
-- ====================================================================

-- Enable RLS on notifications if not already enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- System can insert notifications
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ====================================================================
-- STEP 11: Create Helper View for User Permissions
-- ====================================================================

CREATE OR REPLACE VIEW public.user_permissions AS
SELECT 
  ur.user_id,
  array_agg(DISTINCT ur.role) AS roles,
  bool_or(ur.role IN ('admin', 'powerdesk')) AS is_admin,
  bool_or(ur.role = 'dealer') AS is_dealer,
  bool_or(ur.role = 'user') AS is_user
FROM public.user_roles ur
GROUP BY ur.user_id;

-- Grant access to the view
GRANT SELECT ON public.user_permissions TO authenticated;

-- ====================================================================
-- STEP 12: Create Audit Log Table
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.security_audit_log
FOR SELECT
TO authenticated
USING (public.is_admin_or_powerdesk(auth.uid()));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.security_audit_log
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.security_audit_log(action);

-- ====================================================================
-- STEP 13: Create Function to Log Security Events
-- ====================================================================

CREATE OR REPLACE FUNCTION public.log_security_event(
  _action TEXT,
  _resource_type TEXT DEFAULT NULL,
  _resource_id UUID DEFAULT NULL,
  _details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _log_id UUID;
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    resource_type,
    resource_id,
    details
  )
  VALUES (
    auth.uid(),
    _action,
    _resource_type,
    _resource_id,
    _details
  )
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

-- ====================================================================
-- STEP 14: Verify Setup
-- ====================================================================

SELECT 'Phase 8: Security & Permissions Infrastructure completed successfully!' AS status;

-- Show all security functions
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%role%'
  OR routine_name LIKE '%security%'
ORDER BY routine_name;

-- Show all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
