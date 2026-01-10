-- ====================================================================
-- FIX SECURITY DEFINER VIEW ERRORS AND REVIEW ANONYMOUS ACCESS
-- ====================================================================

-- ====================================================================
-- PART 1: Fix Security Definer View Errors
-- Add RLS policies to views to prevent bypassing security
-- ====================================================================

-- Enable RLS on user_permissions view (if not already enabled)
-- Users can only see their own permissions
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own permissions"
ON public.user_permissions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "PowerDesk can view all permissions"
ON public.user_permissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'powerdesk'
  )
);

-- Enable RLS on user_intelligence_view
-- Only PowerDesk should access this view
ALTER TABLE public.user_intelligence_view ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only PowerDesk can view user intelligence"
ON public.user_intelligence_view
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'powerdesk'
  )
);

-- ====================================================================
-- PART 2: Review and Restrict Anonymous Access Policies
-- Remove anonymous access from sensitive tables
-- ====================================================================

-- Remove anonymous access from activity_logs (audit trail should be authenticated)
DROP POLICY IF EXISTS "PowerDesk can view all activity logs" ON public.activity_logs;

CREATE POLICY "PowerDesk can view all activity logs"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'powerdesk'));

-- Restrict ai_suggestions to authenticated users only
DROP POLICY IF EXISTS "Users can view own suggestions" ON public.ai_suggestions;
DROP POLICY IF EXISTS "Users can update own suggestions" ON public.ai_suggestions;
DROP POLICY IF EXISTS "PowerDesk can view all suggestions" ON public.ai_suggestions;

CREATE POLICY "Authenticated users can view own suggestions"
ON public.ai_suggestions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can update own suggestions"
ON public.ai_suggestions
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated PowerDesk can view all suggestions"
ON public.ai_suggestions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'powerdesk'));

-- Restrict car_enquiries to authenticated users only
DROP POLICY IF EXISTS "Users can view own enquiries" ON public.car_enquiries;
DROP POLICY IF EXISTS "Dealers can view own car enquiries" ON public.car_enquiries;
DROP POLICY IF EXISTS "Dealers can update own car enquiries" ON public.car_enquiries;
DROP POLICY IF EXISTS "PowerDesk can view all enquiries" ON public.car_enquiries;
DROP POLICY IF EXISTS "PowerDesk can update all enquiries" ON public.car_enquiries;
DROP POLICY IF EXISTS "Sales can view all enquiries" ON public.car_enquiries;

CREATE POLICY "Authenticated users can view own enquiries"
ON public.car_enquiries
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Authenticated dealers can view own car enquiries"
ON public.car_enquiries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.car_listings
    WHERE car_listings.id = car_enquiries.car_id
    AND car_listings.seller_id = auth.uid()
  )
);

CREATE POLICY "Authenticated dealers can update own car enquiries"
ON public.car_enquiries
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.car_listings
    WHERE car_listings.id = car_enquiries.car_id
    AND car_listings.seller_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.car_listings
    WHERE car_listings.id = car_enquiries.car_id
    AND car_listings.seller_id = auth.uid()
  )
);

CREATE POLICY "Authenticated PowerDesk can view all enquiries"
ON public.car_enquiries
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'powerdesk'));

CREATE POLICY "Authenticated PowerDesk can update all enquiries"
ON public.car_enquiries
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'powerdesk'))
WITH CHECK (public.has_role(auth.uid(), 'powerdesk'));

CREATE POLICY "Authenticated Sales can view all enquiries"
ON public.car_enquiries
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Restrict demand_gap_notifications to authenticated users
DROP POLICY IF EXISTS "Dealers can mark notifications as read" ON public.demand_gap_notifications;
DROP POLICY IF EXISTS "Dealers can view their notifications" ON public.demand_gap_notifications;

CREATE POLICY "Authenticated dealers can mark notifications as read"
ON public.demand_gap_notifications
FOR UPDATE
TO authenticated
USING (dealer_id = auth.uid())
WITH CHECK (dealer_id = auth.uid());

CREATE POLICY "Authenticated dealers can view their notifications"
ON public.demand_gap_notifications
FOR SELECT
TO authenticated
USING (dealer_id = auth.uid());

-- Restrict lead_enrichment to authenticated admin/powerdesk only
DROP POLICY IF EXISTS "PowerDesk can view all lead enrichment" ON public.lead_enrichment;
DROP POLICY IF EXISTS "PowerDesk can insert lead enrichment" ON public.lead_enrichment;
DROP POLICY IF EXISTS "PowerDesk can update lead enrichment" ON public.lead_enrichment;

CREATE POLICY "Authenticated PowerDesk can view all lead enrichment"
ON public.lead_enrichment
FOR SELECT
TO authenticated
USING (public.is_admin_or_powerdesk(auth.uid()));

CREATE POLICY "Authenticated PowerDesk can insert lead enrichment"
ON public.lead_enrichment
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_powerdesk(auth.uid()));

CREATE POLICY "Authenticated PowerDesk can update lead enrichment"
ON public.lead_enrichment
FOR UPDATE
TO authenticated
USING (public.is_admin_or_powerdesk(auth.uid()))
WITH CHECK (public.is_admin_or_powerdesk(auth.uid()));

-- Restrict market_signals to authenticated admin/powerdesk
DROP POLICY IF EXISTS "PowerDesk can delete market signals" ON public.market_signals;
DROP POLICY IF EXISTS "PowerDesk can insert market signals" ON public.market_signals;
DROP POLICY IF EXISTS "PowerDesk can update market signals" ON public.market_signals;
DROP POLICY IF EXISTS "PowerDesk can view all market signals" ON public.market_signals;

CREATE POLICY "Authenticated PowerDesk can delete market signals"
ON public.market_signals
FOR DELETE
TO authenticated
USING (public.is_admin_or_powerdesk(auth.uid()));

CREATE POLICY "Authenticated PowerDesk can insert market signals"
ON public.market_signals
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_powerdesk(auth.uid()));

CREATE POLICY "Authenticated PowerDesk can update market signals"
ON public.market_signals
FOR UPDATE
TO authenticated
USING (public.is_admin_or_powerdesk(auth.uid()))
WITH CHECK (public.is_admin_or_powerdesk(auth.uid()));

CREATE POLICY "Authenticated PowerDesk can view all market signals"
ON public.market_signals
FOR SELECT
TO authenticated
USING (public.is_admin_or_powerdesk(auth.uid()));

-- Restrict notifications to authenticated users only
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

CREATE POLICY "Authenticated users can view own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can update own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Restrict profiles to authenticated users
DROP POLICY IF EXISTS "PowerDesk and admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Authenticated PowerDesk and admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  public.is_admin_or_powerdesk(auth.uid())
);

CREATE POLICY "Authenticated users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Restrict saved_cars to authenticated users
DROP POLICY IF EXISTS "Users can delete own saved cars" ON public.saved_cars;
DROP POLICY IF EXISTS "Users can insert own saved cars" ON public.saved_cars;
DROP POLICY IF EXISTS "Users can view own saved cars" ON public.saved_cars;

CREATE POLICY "Authenticated users can delete own saved cars"
ON public.saved_cars
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert own saved cars"
ON public.saved_cars
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can view own saved cars"
ON public.saved_cars
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Restrict user_events to authenticated users
DROP POLICY IF EXISTS "PowerDesk can view all events" ON public.user_events;
DROP POLICY IF EXISTS "Users can insert own events" ON public.user_events;
DROP POLICY IF EXISTS "Users can view own events" ON public.user_events;

CREATE POLICY "Authenticated PowerDesk can view all events"
ON public.user_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'powerdesk'));

CREATE POLICY "Authenticated users can insert own events"
ON public.user_events
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can view own events"
ON public.user_events
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Restrict user_profile to authenticated users
DROP POLICY IF EXISTS "PowerDesk can view all user profiles" ON public.user_profile;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profile;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profile;

CREATE POLICY "Authenticated PowerDesk can view all user profiles"
ON public.user_profile
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'powerdesk'));

CREATE POLICY "Authenticated users can update own profile"
ON public.user_profile
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authenticated users can view own profile"
ON public.user_profile
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Restrict user_roles to authenticated users with proper checks
DROP POLICY IF EXISTS "PowerDesk can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

CREATE POLICY "Authenticated PowerDesk can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'powerdesk'));

CREATE POLICY "Authenticated users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Restrict messages to authenticated conversation participants only
DROP POLICY IF EXISTS "PowerDesk can view all messages" ON realtime.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON realtime.messages;
DROP POLICY IF EXISTS "Users can edit their own messages" ON realtime.messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON realtime.messages;

CREATE POLICY "Authenticated PowerDesk can view all messages"
ON realtime.messages
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'powerdesk'));

CREATE POLICY "Authenticated users can delete their own messages"
ON realtime.messages
FOR DELETE
TO authenticated
USING (sender_id = auth.uid());

CREATE POLICY "Authenticated users can edit their own messages"
ON realtime.messages
FOR UPDATE
TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Authenticated users can view messages in their conversations"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = messages.conversation_id
    AND conversation_participants.user_id = auth.uid()
  )
);

-- ====================================================================
-- PART 3: Summary of Public Tables (Keep Anonymous Access)
-- ====================================================================

-- The following tables intentionally allow anonymous access for public marketplace:
-- - availability_status (read-only for filters)
-- - body_types (read-only for filters)
-- - brands (read-only for filters)
-- - car_categories (read-only for filters)
-- - car_features (read-only for filters)
-- - car_listing_features (read-only for car details)
-- - car_listings (read-only for browsing)
-- - cities (read-only for location filters)
-- - colors (read-only for filters)
-- - dealer_customer_photos (public gallery)
-- - dealer_profiles (public dealer pages)
-- - fuel_types (read-only for filters)
-- - models (read-only for filters)
-- - owner_types (read-only for filters)
-- - seat_options (read-only for filters)
-- - transmission_types (read-only for filters)
-- - unmet_expectations (public demand gap submission)
-- - vehicle_types (read-only for filters)

-- These are intentionally public to support the marketplace functionality

-- ====================================================================
-- VERIFICATION QUERIES
-- ====================================================================

-- Count anonymous policies remaining (should be ~25 for intentional public tables)
SELECT COUNT(*) AS remaining_anonymous_policies
FROM pg_policies
WHERE roles @> ARRAY['anon'];

-- List all anonymous policies for review
SELECT schemaname, tablename, policyname, roles
FROM pg_policies
WHERE roles @> ARRAY['anon']
ORDER BY schemaname, tablename;
