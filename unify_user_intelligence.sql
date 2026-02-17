-- Create user_interactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL, -- Logical reference to profiles.id or customer_profiles.id
    interaction_type TEXT NOT NULL,
    car_listing_id UUID REFERENCES car_listings(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_created_at ON user_interactions(created_at);

-- Create lead_scores table if it doesn't exist
CREATE TABLE IF NOT EXISTS lead_scores (
    user_id UUID PRIMARY KEY, -- Logical reference
    score INTEGER DEFAULT 0,
    lead_quality TEXT DEFAULT 'cold',
    factors JSONB DEFAULT '{}'::jsonb,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on these tables (optional, but good practice)
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scores ENABLE ROW LEVEL SECURITY;

-- Allow public access for now (or restrict as needed)
-- Allow public access for now (or restrict as needed)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'user_interactions' AND policyname = 'Allow read access to authenticated users'
    ) THEN
        CREATE POLICY "Allow read access to authenticated users" ON user_interactions FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'user_interactions' AND policyname = 'Allow insert access to authenticated users'
    ) THEN
        CREATE POLICY "Allow insert access to authenticated users" ON user_interactions FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
END
$$;

-- Drop existing view and function to rebuild
DROP FUNCTION IF EXISTS get_user_intelligence();
DROP VIEW IF EXISTS user_intelligence_view CASCADE;

-- Recreate view to include both Auth Users (existing) and Customer Profiles (OTP users)
CREATE OR REPLACE VIEW user_intelligence_view AS
-- Create a unified activity CTE to combine different event sources
WITH unified_activity AS (
    -- From user_events (Main tracking source)
    SELECT 
        user_id,
        event,
        car_id,
        session_id,
        at as created_at
    FROM user_events
    WHERE user_id IS NOT NULL
    
    UNION ALL
    
    -- From user_interactions (Fallback source)
    SELECT 
        user_id,
        interaction_type as event,
        car_listing_id as car_id,
        metadata->>'sessionId' as session_id,
        created_at
    FROM user_interactions
),
auth_users AS (
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
        
        COALESCE(up.preferred_brands, ARRAY[]::text[]) as preferred_brands,
        COALESCE(up.body_type_affinity, '[]'::jsonb) as body_type_affinity,
        COALESCE(up.brand_affinity, '{}'::jsonb) as brand_affinity,
        
        up.intent_score,
        up.last_seen,
        
        -- Location data
        up.latitude,
        up.longitude,
        up.city_name,
        up.state_name,
        up.country,
        up.location_updated_at,

        -- Behavioral metrics (from unified source)
        ue.car_id,
        ue.event,
        ue.session_id,
        ue.created_at as event_created_at
    FROM profiles p
    LEFT JOIN user_profile up ON up.user_id = p.id
    LEFT JOIN unified_activity ue ON ue.user_id = p.id
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
        'cold' as intent,
        NULL as budget_band,
        'exploring' as buying_mode,
        
        ARRAY[]::text[] as preferred_brands,
        '[]'::jsonb as body_type_affinity,
        '{}'::jsonb as brand_affinity,
        
        0 as intent_score,
        cp.updated_at as last_seen,
        
        -- Location data
        cp.location_lat as latitude,
        cp.location_lng as longitude,
        cp.city as city_name,
        NULL as state_name,
        'India' as country,
        cp.updated_at as location_updated_at,

        -- Behavioral metrics (from unified source)
        ue.car_id,
        ue.event,
        ue.session_id,
        ue.created_at as event_created_at
    FROM customer_profiles cp
    LEFT JOIN unified_activity ue ON ue.user_id = cp.id
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
    MAX(body_type_affinity::text)::jsonb as body_type_affinity,
    MAX(brand_affinity::text)::jsonb as brand_affinity,
    
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
    COUNT(DISTINCT CASE WHEN event IN ('view', 'car_view') THEN car_id END) AS cars_viewed,
    COUNT(DISTINCT CASE WHEN event IN ('save', 'wishlist_add') THEN car_id END) AS cars_shortlisted,
    COUNT(DISTINCT CASE WHEN event = 'compare' THEN car_id END) AS cars_compared,
    COUNT(CASE WHEN event IN ('contact_click', 'call_click', 'whatsapp_click', 'dealer_contact') THEN 1 END) AS dealer_contacts,
    COUNT(CASE WHEN event = 'test_drive_request' THEN 1 END) AS test_drives_requested,
    COUNT(CASE WHEN event IN ('emi_calculation', 'loan_attempt') THEN 1 END) AS loan_checks,
    COUNT(CASE WHEN event = 'search' THEN 1 END) AS searches_performed,
    COUNT(DISTINCT session_id) AS total_sessions,
    MIN(event_created_at) AS first_activity,
    MAX(event_created_at) AS last_activity,

    -- Unmet demand
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
        + COUNT(DISTINCT CASE WHEN event IN ('emi_calculation', 'loan_attempt') THEN 1 END) * 15
        + COUNT(DISTINCT CASE WHEN event IN ('contact_click', 'call_click', 'whatsapp_click', 'dealer_contact') THEN 1 END) * 10
        + COUNT(DISTINCT CASE WHEN event IN ('save', 'wishlist_add') THEN 1 END) * 5
        + COUNT(DISTINCT session_id) * 2
        )
    ) AS engagement_score,

    (MAX(intent) IS NOT NULL) AS quiz_completed

FROM combined_users
GROUP BY user_id;

-- Recreate RPC function with filters
CREATE OR REPLACE FUNCTION get_user_intelligence(
    search_text text DEFAULT NULL,
    filter_intent text DEFAULT NULL,
    filter_budget text DEFAULT NULL,
    filter_buying_mode text DEFAULT NULL,
    filter_engagement text DEFAULT NULL,
    filter_location text DEFAULT NULL
)
RETURNS SETOF user_intelligence_view
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM user_intelligence_view
  WHERE 
    (search_text IS NULL OR 
     full_name ILIKE '%' || search_text || '%' OR 
     phone_number ILIKE '%' || search_text || '%' OR
     username ILIKE '%' || search_text || '%')
    AND (filter_intent IS NULL OR filter_intent = 'all' OR intent = filter_intent)
    AND (filter_budget IS NULL OR filter_budget = 'all' OR budget_band = filter_budget)
    AND (filter_buying_mode IS NULL OR filter_buying_mode = 'all' OR buying_mode = filter_buying_mode)
    AND (filter_location IS NULL OR filter_location = 'all' OR city_name = filter_location)
    AND (
        filter_engagement IS NULL OR filter_engagement = 'all' OR
        (filter_engagement = 'high' AND engagement_score >= 70) OR
        (filter_engagement = 'medium' AND engagement_score >= 40 AND engagement_score < 70) OR
        (filter_engagement = 'low' AND engagement_score < 40)
    );
$$;

GRANT EXECUTE ON FUNCTION get_user_intelligence(text, text, text, text, text, text) TO authenticated;

-- DEBUG: Check if the view actually has data
SELECT 'Total Rows in View' as check_name, COUNT(*) as count FROM user_intelligence_view;
SELECT 'Total Profiles' as check_name, COUNT(*) as count FROM profiles;
SELECT 'Total Customer Profiles' as check_name, COUNT(*) as count FROM customer_profiles;

-- DEBUG: Find specific user (7305004047)
SELECT * FROM profiles WHERE phone_number LIKE '%7305004047%';
-- Check customer_profiles (Constraint check below will tell us if phone isn't unique)
SELECT * FROM customer_profiles WHERE phone_number LIKE '%7305004047%';
SELECT * FROM auth.users WHERE phone LIKE '%7305004047%';

-- DEBUG: Check Table Constraints
SELECT conname, pg_get_constraintdef(c.oid)
FROM pg_constraint c 
JOIN pg_namespace n ON n.oid = c.connamespace 
WHERE conrelid = 'customer_profiles'::regclass;

-- DEBUG: Check Filter Values (Corrected table: user_profile)
SELECT DISTINCT budget_band FROM user_profile;
SELECT DISTINCT buying_mode FROM user_profile;
