-- Create comprehensive user intelligence view for PowerDesk analytics
-- Execute this in Supabase SQL Editor

-- Drop existing view if any
DROP VIEW IF EXISTS user_intelligence_view;

-- Create comprehensive user intelligence view with CORRECTED column names
CREATE OR REPLACE VIEW user_intelligence_view AS
SELECT 
  p.id as user_id,
  p.full_name,
  p.phone_number,
  p.username,
  p.created_at as registered_at,
  p.is_active,
  
  -- Profile data (from user_profile)
  up.intent,
  up.budget_band,
  up.buying_mode,
  up.preferred_brands,
  up.body_type_affinity,
  up.brand_affinity,
  up.intent_score,
  up.last_seen,
  
  -- Behavioral metrics (aggregated from user_events)
  -- NOTE: user_events uses 'at' not 'created_at'
  COUNT(DISTINCT CASE WHEN ue.event = 'view' THEN ue.car_id END) as cars_viewed,
  COUNT(DISTINCT CASE WHEN ue.event = 'wishlist_add' THEN ue.car_id END) as cars_shortlisted,
  COUNT(DISTINCT CASE WHEN ue.event = 'compare' THEN ue.car_id END) as cars_compared,
  COUNT(CASE WHEN ue.event = 'contact_click' THEN 1 END) as dealer_contacts,
  COUNT(CASE WHEN ue.event = 'test_drive_request' THEN 1 END) as test_drives_requested,
  COUNT(CASE WHEN ue.event = 'loan_attempt' THEN 1 END) as loan_checks,
  COUNT(CASE WHEN ue.event = 'search' THEN 1 END) as searches_performed,
  
  -- Session metrics (using 'at' instead of 'created_at')
  COUNT(DISTINCT ue.session_id) as total_sessions,
  MIN(ue.at) as first_activity,
  MAX(ue.at) as last_activity,
  
  -- Unmet demand (from unmet_expectations) - get most recent
  (SELECT note FROM unmet_expectations WHERE user_id = p.id ORDER BY created_at DESC LIMIT 1) as unmet_demand_note,
  (SELECT must_haves FROM unmet_expectations WHERE user_id = p.id ORDER BY created_at DESC LIMIT 1) as unmet_demand_specs,
  (SELECT urgency FROM unmet_expectations WHERE user_id = p.id ORDER BY created_at DESC LIMIT 1) as unmet_demand_urgency,
  (SELECT created_at FROM unmet_expectations WHERE user_id = p.id ORDER BY created_at DESC LIMIT 1) as unmet_demand_submitted_at,
  
  -- Engagement score (calculated)
  (
    CASE 
      WHEN up.intent = 'hot' THEN 3
      WHEN up.intent = 'warm' THEN 2
      ELSE 1
    END * (
      COALESCE(up.intent_score, 0) + 
      COUNT(DISTINCT CASE WHEN ue.event = 'test_drive_request' THEN 1 END) * 20 +
      COUNT(DISTINCT CASE WHEN ue.event = 'loan_attempt' THEN 1 END) * 15 +
      COUNT(DISTINCT CASE WHEN ue.event = 'contact_click' THEN 1 END) * 10 +
      COUNT(DISTINCT CASE WHEN ue.event = 'wishlist_add' THEN 1 END) * 5
    )
  ) as engagement_score,
  
  -- Quiz completion status
  CASE WHEN up.intent IS NOT NULL THEN true ELSE false END as quiz_completed
  
FROM profiles p
INNER JOIN user_roles ur ON ur.user_id = p.id
LEFT JOIN user_profile up ON up.user_id = p.id
LEFT JOIN user_events ue ON ue.user_id = p.id

WHERE ur.role = 'user'  -- Only customers, not dealers/admins

GROUP BY 
  p.id, p.full_name, p.phone_number, p.username, p.created_at, p.is_active,
  up.intent, up.budget_band, up.buying_mode, up.preferred_brands, 
  up.body_type_affinity, up.brand_affinity, up.intent_score, up.last_seen;

-- Add RLS policy - only PowerDesk can view
CREATE POLICY "PowerDesk can view user intelligence"
ON user_intelligence_view
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'powerdesk'
  )
);

-- Grant access
ALTER VIEW user_intelligence_view OWNER TO postgres;
GRANT SELECT ON user_intelligence_view TO authenticated;
