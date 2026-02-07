-- Drop existing view and function to rebuild
DROP FUNCTION IF EXISTS get_user_intelligence();
DROP VIEW IF EXISTS user_intelligence_view CASCADE;

-- Recreate view to include both Auth Users (existing) and Customer Profiles (OTP users)
CREATE OR REPLACE VIEW user_intelligence_view AS
WITH auth_users AS (
    SELECT 
        p.id AS user_id,
        p.full_name,
        p.phone_number,
        p.username,
        p.created_at AS registered_at,
        p.is_active,

        -- Profile data
        up.intent,
        up.budget_band,
        up.buying_mode,
        up.preferred_brands,
        up.body_type_affinity,
        up.brand_affinity,
        up.intent_score,
        up.last_seen,
        
        -- Location data
        up.latitude,
        up.longitude,
        up.city_name,
        up.state_name,
        up.country,
        up.location_updated_at,

        -- Behavioral metrics (from user_events)
        ue.car_id,
        ue.event,
        ue.session_id,
        ue.created_at as event_created_at
    FROM profiles p
    INNER JOIN user_roles ur ON ur.user_id = p.id
    LEFT JOIN user_profile up ON up.user_id = p.id
    LEFT JOIN user_events ue ON ue.user_id = p.id
    WHERE ur.role = 'user'
),
customer_users AS (
    SELECT 
        cp.id AS user_id,
        cp.full_name,
        cp.phone_number,
        COALESCE(cp.email, cp.phone_number) as username,
        cp.created_at AS registered_at,
        true as is_active,

        -- Default Profile data for customers
        'cold' as intent, -- Default to cold
        NULL as budget_band,
        'exploring' as buying_mode, -- Default to exploring
        NULL::text[] as preferred_brands,
        NULL::text[] as body_type_affinity,
        NULL::jsonb as brand_affinity,
        0 as intent_score,
        cp.updated_at as last_seen,
        
        -- Location data
        cp.location_lat as latitude,
        cp.location_lng as longitude,
        cp.city as city_name,
        NULL as state_name,
        'India' as country,
        cp.updated_at as location_updated_at,

        -- No event data for now (unless we link cookie sessions)
        NULL as car_id,
        NULL as event,
        NULL as session_id,
        NULL as event_created_at
    FROM customer_profiles cp
    -- Anti-join to avoid duplicates if they exist in both (by phone)
    WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.phone_number = cp.phone_number)
),
combined_users AS (
    SELECT * FROM auth_users
    UNION ALL
    SELECT * FROM customer_users
)
SELECT 
    user_id,
    MAX(full_name) as full_name,
    MAX(phone_number) as phone_number,
    MAX(username) as username,
    MAX(registered_at) as registered_at,
    bool_or(is_active) as is_active,

    -- Profile data
    MAX(intent) as intent,
    MAX(budget_band) as budget_band,
    MAX(buying_mode) as buying_mode,
    MAX(preferred_brands) as preferred_brands,
    MAX(body_type_affinity) as body_type_affinity,
    MAX(brand_affinity) as brand_affinity,
    MAX(intent_score) as intent_score,
    MAX(last_seen) as last_seen,
  
    -- Location data
    MAX(latitude) as latitude,
    MAX(longitude) as longitude,
    MAX(city_name) as city_name,
    MAX(state_name) as state_name,
    MAX(country) as country,
    MAX(location_updated_at) as location_updated_at,

    -- Aggregated Metrics
    COUNT(DISTINCT CASE WHEN event = 'view' THEN car_id END) AS cars_viewed,
    COUNT(DISTINCT CASE WHEN event = 'wishlist_add' THEN car_id END) AS cars_shortlisted,
    COUNT(DISTINCT CASE WHEN event = 'compare' THEN car_id END) AS cars_compared,
    COUNT(CASE WHEN event = 'contact_click' THEN 1 END) AS dealer_contacts,
    COUNT(CASE WHEN event = 'test_drive_request' THEN 1 END) AS test_drives_requested,
    COUNT(CASE WHEN event = 'loan_attempt' THEN 1 END) AS loan_checks,
    COUNT(CASE WHEN event = 'search' THEN 1 END) AS searches_performed,
    COUNT(DISTINCT session_id) AS total_sessions,
    MIN(event_created_at) AS first_activity,
    MAX(event_created_at) AS last_activity,

    -- Unmet demand (Placeholder for customers)
    NULL as unmet_demand_note,
    NULL as unmet_demand_specs,
    NULL as unmet_demand_urgency,
    NULL as unmet_demand_submitted_at,

    -- Engagement score calculation
    (
        CASE 
        WHEN MAX(intent) = 'hot' THEN 3
        WHEN MAX(intent) = 'warm' THEN 2
        ELSE 1
        END * (
        COALESCE(MAX(intent_score), 0)
        + COUNT(DISTINCT CASE WHEN event = 'test_drive_request' THEN 1 END) * 20
        + COUNT(DISTINCT CASE WHEN event = 'loan_attempt' THEN 1 END) * 15
        + COUNT(DISTINCT CASE WHEN event = 'contact_click' THEN 1 END) * 10
        + COUNT(DISTINCT CASE WHEN event = 'wishlist_add' THEN 1 END) * 5
        )
    ) AS engagement_score,

    (MAX(intent) IS NOT NULL) AS quiz_completed

FROM combined_users
GROUP BY user_id;

-- Recreate RPC function
CREATE OR REPLACE FUNCTION get_user_intelligence()
RETURNS SETOF user_intelligence_view
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM user_intelligence_view
  -- Removed the restrictive role check to allow Dealers/Staff to see data if needed
  -- Or keep it but ensure the user has access. 
  -- For now, let's keep it permissive for authenticated users who can access the dashboard.
  WHERE EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('powerdesk', 'dealer', 'admin', 'website_manager') 
  );
$$;

GRANT EXECUTE ON FUNCTION get_user_intelligence() TO authenticated;
