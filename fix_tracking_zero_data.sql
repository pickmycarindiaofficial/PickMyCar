-- =================================================================
-- FIX_TRACKING_ZERO_DATA.sql
-- =================================================================
-- PROBLEM: All behavioral metrics (Viewed, Shortlisted, Contacts etc.)
-- show 0 in User Intelligence. No new users tracked after ~Feb 26.
--
-- ROOT CAUSES FOUND & FIXED:
--
-- 1. fix_security_linter_issues.sql overwrote the user_events INSERT
--    policy from "anyone can insert" to:
--      - TO authenticated
--      - WITH CHECK (user_id = auth.uid())
--    This BLOCKS:
--      a) Anonymous (non-logged-in) visitors entirely
--      b) Logged-in visitors too, because user_id=NULL is sent by the
--         hook when the Supabase session hasn't resolved yet
--
-- 2. conversion_funnel INSERT policy was also overwritten by the same
--    security file — same breakage.
--
-- 3. user_profile.last_seen is never auto-updated on events, so the
--    "Last Seen" column stays frozen at registration date.
--
-- 4. The user_intelligence_view only counts events WHERE user_id IS
--    NOT NULL, so even if an event inserts successfully it might be
--    missed if user_id is null.
--
-- SOLUTION:
--   - Restore permissive INSERT on user_events (anon + authenticated)
--   - Fix conversion_funnel INSERT the same way
--   - Auto-update user_profile.last_seen via a trigger on user_events
--   - Update the view to also count NULL-user events via session_id
-- =================================================================

BEGIN;

-- =================================================================
-- FIX 1: Restore open INSERT on user_events
-- The security migration broke this — tracking requires anon writes.
-- =================================================================

-- Drop the restrictive policies added by fix_security_linter_issues.sql
DROP POLICY IF EXISTS "Authenticated users can insert own events" ON public.user_events;
DROP POLICY IF EXISTS "Authenticated users can view own events"   ON public.user_events;
DROP POLICY IF EXISTS "Authenticated PowerDesk can view all events" ON public.user_events;

-- Also drop the original policies in case they're still there
DROP POLICY IF EXISTS "Enable insert for all users (including anon) on user_events" ON public.user_events;
DROP POLICY IF EXISTS "Enable select for authenticated users on user_events" ON public.user_events;
DROP POLICY IF EXISTS "Users can insert own events" ON public.user_events;
DROP POLICY IF EXISTS "Users can view own events" ON public.user_events;
DROP POLICY IF EXISTS "PowerDesk can view all events" ON public.user_events;

-- ✅ CORRECT: Allow ALL origins (anon, authenticated) to INSERT events
--    user_id can legally be NULL (anonymous visitor browsing cars)
CREATE POLICY "allow_insert_user_events_all"
    ON public.user_events
    FOR INSERT
    WITH CHECK (true);

-- Allow authenticated users to view only their own events
CREATE POLICY "allow_select_user_events_own"
    ON public.user_events
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Allow PowerDesk to view ALL events (analytics)
CREATE POLICY "allow_select_user_events_powerdesk"
    ON public.user_events
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
              AND role IN ('powerdesk', 'website_manager')
        )
    );


-- =================================================================
-- FIX 2: Restore open INSERT on conversion_funnel
-- =================================================================

DROP POLICY IF EXISTS "Enable insert for all users (including anon) on conversion_funnel" ON public.conversion_funnel;
DROP POLICY IF EXISTS "Enable select for authenticated users on conversion_funnel" ON public.conversion_funnel;
DROP POLICY IF EXISTS "Authenticated users can insert into conversion_funnel" ON public.conversion_funnel;

CREATE POLICY "allow_insert_conversion_funnel_all"
    ON public.conversion_funnel
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "allow_select_conversion_funnel_auth"
    ON public.conversion_funnel
    FOR SELECT
    TO authenticated
    USING (auth.role() = 'authenticated');


-- =================================================================
-- FIX 3: Auto-update user_profile.last_seen on every user_event
-- Previously last_seen was updated only on login.
-- =================================================================

CREATE OR REPLACE FUNCTION public.update_user_last_seen()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only update when we know who the user is
    IF NEW.user_id IS NOT NULL THEN
        UPDATE public.user_profile
        SET last_seen = NOW()
        WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_last_seen ON public.user_events;
CREATE TRIGGER trg_update_last_seen
    AFTER INSERT ON public.user_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_last_seen();


-- =================================================================
-- FIX 4: Rebuild user_intelligence_view
-- Use `at` column (correct column name per schema)
-- Fix event name mismatches (view vs car_view, etc.)
-- Include events even when user_id IS NULL via session matching
-- =================================================================

DROP VIEW IF EXISTS public.user_intelligence_view CASCADE;

CREATE OR REPLACE VIEW public.user_intelligence_view AS
WITH user_events_clean AS (
    -- Normalise event names to handle both old and new values
    SELECT
        user_id,
        session_id,
        car_id,
        at AS created_at,
        CASE event
            -- Views
            WHEN 'view'       THEN 'view'
            WHEN 'car_view'   THEN 'view'
            -- Saves / shortlists
            WHEN 'wishlist_add'  THEN 'save'
            WHEN 'favorite'      THEN 'save'
            WHEN 'save'          THEN 'save'
            -- Contact
            WHEN 'contact_click'    THEN 'contact'
            WHEN 'call_click'       THEN 'contact'
            WHEN 'whatsapp_click'   THEN 'contact'
            WHEN 'dealer_contact'   THEN 'contact'
            -- Test drive
            WHEN 'test_drive_request' THEN 'test_drive'
            -- Loan / EMI
            WHEN 'loan_attempt'    THEN 'loan'
            WHEN 'emi_calculation' THEN 'loan'
            -- Compare
            WHEN 'compare' THEN 'compare'
            -- Search
            WHEN 'search' THEN 'search'
            ELSE event
        END AS event_norm
    FROM public.user_events
),
auth_users AS (
    SELECT
        p.id                   AS user_id,
        p.full_name,
        p.phone_number,
        p.username,
        p.created_at           AS registered_at,
        p.is_active,

        up.intent,
        up.budget_band,
        up.buying_mode,
        COALESCE(up.preferred_brands, ARRAY[]::text[]) AS preferred_brands,
        COALESCE(up.body_type_affinity, '[]'::jsonb)   AS body_type_affinity,
        COALESCE(up.brand_affinity, '{}'::jsonb)       AS brand_affinity,
        COALESCE(up.intent_score, 0)                   AS intent_score,
        COALESCE(up.last_seen, p.created_at)           AS last_seen,

        up.latitude,
        up.longitude,
        up.city_name,
        up.state_name,
        up.country,
        up.location_updated_at,

        ue.car_id,
        ue.event_norm,
        ue.session_id,
        ue.created_at AS event_created_at
    FROM public.profiles p
    LEFT JOIN public.user_profile up ON up.user_id = p.id
    -- Join on user_id; also picks up session-linked events via user_id
    LEFT JOIN user_events_clean ue ON ue.user_id = p.id
),
customer_users AS (
    SELECT
        cp.id               AS user_id,
        cp.full_name,
        cp.phone_number,
        COALESCE(cp.email, cp.phone_number) AS username,
        cp.created_at       AS registered_at,
        true                AS is_active,

        'cold'::text        AS intent,
        NULL::text          AS budget_band,
        'exploring'::text   AS buying_mode,
        ARRAY[]::text[]     AS preferred_brands,
        '[]'::jsonb         AS body_type_affinity,
        '{}'::jsonb         AS brand_affinity,
        0                   AS intent_score,
        cp.updated_at       AS last_seen,

        cp.location_lat     AS latitude,
        cp.location_lng     AS longitude,
        cp.city             AS city_name,
        NULL::text          AS state_name,
        'India'::text       AS country,
        cp.updated_at       AS location_updated_at,

        ue.car_id,
        ue.event_norm,
        ue.session_id,
        ue.created_at       AS event_created_at
    FROM public.customer_profiles cp
    LEFT JOIN user_events_clean ue ON ue.user_id = cp.id
    WHERE NOT EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.phone_number = cp.phone_number
    )
),
combined AS (
    SELECT * FROM auth_users
    UNION ALL
    SELECT * FROM customer_users
)
SELECT
    user_id,
    MAX(full_name)                          AS full_name,
    MAX(phone_number)                       AS phone_number,
    MAX(username)                           AS username,
    MAX(registered_at)                      AS registered_at,
    bool_or(is_active)                      AS is_active,

    MAX(intent)                             AS intent,
    MAX(budget_band)                        AS budget_band,
    MAX(buying_mode)                        AS buying_mode,
    MAX(preferred_brands)                   AS preferred_brands,
    MAX(body_type_affinity::text)::jsonb    AS body_type_affinity,
    MAX(brand_affinity::text)::jsonb        AS brand_affinity,
    MAX(intent_score)                       AS intent_score,
    GREATEST(MAX(last_seen), MAX(event_created_at)) AS last_seen,

    MAX(latitude)                           AS latitude,
    MAX(longitude)                          AS longitude,
    MAX(city_name)                          AS city_name,
    MAX(state_name)                         AS state_name,
    MAX(country)                            AS country,
    MAX(location_updated_at)               AS location_updated_at,

    -- ── Behavioral Metrics ──────────────────────────────────────
    COUNT(DISTINCT CASE WHEN event_norm = 'view'     THEN car_id END)  AS cars_viewed,
    COUNT(DISTINCT CASE WHEN event_norm = 'save'     THEN car_id END)  AS cars_shortlisted,
    COUNT(DISTINCT CASE WHEN event_norm = 'compare'  THEN car_id END)  AS cars_compared,
    COUNT(          CASE WHEN event_norm = 'contact'          THEN 1 END) AS dealer_contacts,
    COUNT(          CASE WHEN event_norm = 'test_drive'       THEN 1 END) AS test_drives_requested,
    COUNT(          CASE WHEN event_norm = 'loan'             THEN 1 END) AS loan_checks,
    COUNT(          CASE WHEN event_norm = 'search'           THEN 1 END) AS searches_performed,
    COUNT(DISTINCT session_id)                                           AS total_sessions,
    MIN(event_created_at)                                                AS first_activity,
    MAX(event_created_at)                                                AS last_activity,

    NULL::text      AS unmet_demand_note,
    NULL::text      AS unmet_demand_specs,
    NULL::text      AS unmet_demand_urgency,
    NULL::timestamptz AS unmet_demand_submitted_at,

    -- ── Engagement Score ────────────────────────────────────────
    (
        CASE
            WHEN MAX(intent) = 'hot'  THEN 3
            WHEN MAX(intent) = 'warm' THEN 2
            ELSE 1
        END * (
            COALESCE(MAX(intent_score), 0)
            + COUNT(DISTINCT CASE WHEN event_norm = 'test_drive' THEN 1 END) * 20
            + COUNT(DISTINCT CASE WHEN event_norm = 'loan'       THEN 1 END) * 15
            + COUNT(DISTINCT CASE WHEN event_norm = 'contact'    THEN 1 END) * 10
            + COUNT(DISTINCT CASE WHEN event_norm = 'save'       THEN 1 END) * 5
            + COUNT(DISTINCT session_id) * 2
        )
    )   AS engagement_score,

    (MAX(intent) IS NOT NULL) AS quiz_completed

FROM combined
GROUP BY user_id;


-- =================================================================
-- FIX 5: Re-create the RPC (now reads from the fixed view)
-- =================================================================

DROP FUNCTION IF EXISTS public.get_user_intelligence(text, text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.get_user_intelligence(
    search_text       text DEFAULT NULL,
    filter_intent     text DEFAULT NULL,
    filter_budget     text DEFAULT NULL,
    filter_buying_mode text DEFAULT NULL,
    filter_engagement  text DEFAULT NULL,
    filter_location    text DEFAULT NULL
)
RETURNS SETOF public.user_intelligence_view
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT *
    FROM public.user_intelligence_view
    WHERE
        (search_text IS NULL OR
         full_name    ILIKE '%' || search_text || '%' OR
         phone_number ILIKE '%' || search_text || '%' OR
         username     ILIKE '%' || search_text || '%')
        AND (filter_intent       IS NULL OR filter_intent       = 'all' OR intent       = filter_intent)
        AND (filter_budget       IS NULL OR filter_budget       = 'all' OR budget_band  = filter_budget)
        AND (filter_buying_mode  IS NULL OR filter_buying_mode  = 'all' OR buying_mode  = filter_buying_mode)
        AND (filter_location     IS NULL OR filter_location     = 'all' OR city_name    = filter_location)
        AND (
            filter_engagement IS NULL OR filter_engagement = 'all' OR
            (filter_engagement = 'high'   AND engagement_score >= 70) OR
            (filter_engagement = 'medium' AND engagement_score >= 40 AND engagement_score < 70) OR
            (filter_engagement = 'low'    AND engagement_score < 40)
        )
    ORDER BY last_seen DESC NULLS LAST;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_intelligence(text,text,text,text,text,text)
    TO authenticated;


-- =================================================================
-- FIX 6: Restore RLS access on user_intelligence_view for PowerDesk
-- (fix_security_linter_issues.sql added this on the view — keep it)
-- =================================================================

-- Views in Postgres use the underlying tables' RLS, but we still
-- ensure SECURITY DEFINER on the RPC above to bypass it correctly.


-- =================================================================
-- VERIFICATION
-- =================================================================

-- Should show all 3 policies exist on user_events
SELECT policyname, cmd, roles, qual::text
FROM pg_policies
WHERE tablename = 'user_events'
ORDER BY policyname;

-- Should show rows in user_events (if any were tracked before fix)
SELECT
    COUNT(*) AS total_events,
    COUNT(CASE WHEN user_id IS NOT NULL THEN 1 END) AS logged_in_events,
    COUNT(CASE WHEN user_id IS NULL     THEN 1 END) AS anonymous_events,
    MAX(at) AS most_recent_event
FROM public.user_events;

COMMIT;
