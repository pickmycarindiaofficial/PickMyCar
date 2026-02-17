-- Create comprehensive user intelligence view for PowerDesk analytics
-- Execute this in Supabase SQL Editor

-- Drop existing view if any
DROP VIEW IF EXISTS user_intelligence_view;

-- Create comprehensive user intelligence view with CORRECTED column names
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
)
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
  
  -- Behavioral metrics (aggregated from unified source)
  COUNT(DISTINCT CASE WHEN ue.event IN ('view', 'car_view') THEN ue.car_id END) as cars_viewed,
  COUNT(DISTINCT CASE WHEN ue.event IN ('save', 'wishlist_add') THEN ue.car_id END) as cars_shortlisted,
  COUNT(DISTINCT CASE WHEN ue.event = 'compare' THEN ue.car_id END) as cars_compared,
  COUNT(CASE WHEN ue.event IN ('contact_click', 'call_click', 'whatsapp_click', 'dealer_contact') THEN 1 END) as dealer_contacts,
  COUNT(CASE WHEN ue.event = 'test_drive_request' THEN 1 END) as test_drives_requested,
  COUNT(CASE WHEN ue.event IN ('emi_calculation', 'loan_attempt') THEN 1 END) as loan_checks,
  COUNT(CASE WHEN ue.event = 'search' THEN 1 END) as searches_performed,
  
  -- Session metrics
  COUNT(DISTINCT ue.session_id) as total_sessions,
  MIN(ue.created_at) as first_activity,
  MAX(ue.created_at) as last_activity,
  
  -- Unmet demand
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
      COUNT(DISTINCT CASE WHEN ue.event IN ('emi_calculation', 'loan_attempt') THEN 1 END) * 15 +
      COUNT(DISTINCT CASE WHEN ue.event IN ('contact_click', 'call_click', 'whatsapp_click', 'dealer_contact') THEN 1 END) * 10 +
      COUNT(DISTINCT CASE WHEN ue.event IN ('save', 'wishlist_add') THEN 1 END) * 5 +
      COUNT(DISTINCT ue.session_id) * 2
    )
  ) as engagement_score,
  
  -- Quiz completion status
  CASE WHEN up.intent IS NOT NULL THEN true ELSE false END as quiz_completed
  
FROM profiles p
JOIN user_roles ur ON ur.user_id = p.id
LEFT JOIN user_profile up ON up.user_id = p.id
LEFT JOIN unified_activity ue ON ue.user_id = p.id

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
