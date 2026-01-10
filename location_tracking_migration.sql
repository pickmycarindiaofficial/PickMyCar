-- Add location tracking columns to user_profile table
ALTER TABLE user_profile 
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8),
ADD COLUMN IF NOT EXISTS city_name TEXT,
ADD COLUMN IF NOT EXISTS state_name TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India',
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient location queries
CREATE INDEX IF NOT EXISTS idx_user_profile_location 
ON user_profile (city_name, state_name);

-- Drop and recreate the user_intelligence_view with location data
DROP VIEW IF EXISTS user_intelligence_view CASCADE;

CREATE VIEW user_intelligence_view AS
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

  -- Behavioral metrics
  COUNT(DISTINCT CASE WHEN ue.event = 'view' THEN ue.car_id END) AS cars_viewed,
  COUNT(DISTINCT CASE WHEN ue.event = 'wishlist_add' THEN ue.car_id END) AS cars_shortlisted,
  COUNT(DISTINCT CASE WHEN ue.event = 'compare' THEN ue.car_id END) AS cars_compared,
  COUNT(CASE WHEN ue.event = 'contact_click' THEN 1 END) AS dealer_contacts,
  COUNT(CASE WHEN ue.event = 'test_drive_request' THEN 1 END) AS test_drives_requested,
  COUNT(CASE WHEN ue.event = 'loan_attempt' THEN 1 END) AS loan_checks,
  COUNT(CASE WHEN ue.event = 'search' THEN 1 END) AS searches_performed,

  -- Session metrics
  COUNT(DISTINCT ue.session_id) AS total_sessions,
  MIN(ue.created_at) AS first_activity,
  MAX(ue.created_at) AS last_activity,

  -- Unmet demand
  (SELECT note FROM unmet_expectations WHERE user_id = p.id ORDER BY created_at DESC LIMIT 1) AS unmet_demand_note,
  (SELECT must_haves FROM unmet_expectations WHERE user_id = p.id ORDER BY created_at DESC LIMIT 1) AS unmet_demand_specs,
  (SELECT urgency FROM unmet_expectations WHERE user_id = p.id ORDER BY created_at DESC LIMIT 1) AS unmet_demand_urgency,
  (SELECT created_at FROM unmet_expectations WHERE user_id = p.id ORDER BY created_at DESC LIMIT 1) AS unmet_demand_submitted_at,

  -- Engagement score
  (
    CASE 
      WHEN up.intent = 'hot' THEN 3
      WHEN up.intent = 'warm' THEN 2
      ELSE 1
    END * (
      COALESCE(up.intent_score, 0)
      + COUNT(DISTINCT CASE WHEN ue.event = 'test_drive_request' THEN 1 END) * 20
      + COUNT(DISTINCT CASE WHEN ue.event = 'loan_attempt' THEN 1 END) * 15
      + COUNT(DISTINCT CASE WHEN ue.event = 'contact_click' THEN 1 END) * 10
      + COUNT(DISTINCT CASE WHEN ue.event = 'wishlist_add' THEN 1 END) * 5
    )
  ) AS engagement_score,

  -- Quiz completion
  (up.intent IS NOT NULL) AS quiz_completed

FROM profiles p
INNER JOIN user_roles ur ON ur.user_id = p.id
LEFT JOIN user_profile up ON up.user_id = p.id
LEFT JOIN user_events ue ON ue.user_id = p.id
WHERE ur.role = 'user'
GROUP BY 
  p.id, p.full_name, p.phone_number, p.username, p.created_at, p.is_active,
  up.intent, up.budget_band, up.buying_mode, up.preferred_brands, 
  up.body_type_affinity, up.brand_affinity, up.intent_score, up.last_seen,
  up.latitude, up.longitude, up.city_name, up.state_name, up.country, up.location_updated_at;

-- Recreate RPC function
DROP FUNCTION IF EXISTS get_user_intelligence();

CREATE OR REPLACE FUNCTION get_user_intelligence()
RETURNS SETOF user_intelligence_view
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM user_intelligence_view
  WHERE EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'powerdesk'
  );
$$;

GRANT EXECUTE ON FUNCTION get_user_intelligence() TO authenticated;

-- Verification queries
SELECT COUNT(*) AS total_users_with_location FROM user_profile WHERE city_name IS NOT NULL;
SELECT city_name, state_name, COUNT(*) AS user_count FROM user_profile WHERE city_name IS NOT NULL GROUP BY city_name, state_name ORDER BY user_count DESC LIMIT 10;
