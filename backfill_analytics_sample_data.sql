-- ============================================
-- Backfill Sample Data for Analytics Tables
-- Phase 3 & 4 Implementation
-- ============================================

-- This script creates sample data for testing the analytics features
-- Run this in Supabase SQL Editor after Phase 3 & 4 deployment

-- ============================================
-- 1. LEAD ENRICHMENT - Sample AI-scored leads
-- ============================================

-- Insert sample lead enrichment data for existing enquiries
INSERT INTO lead_enrichment (
  lead_id,
  user_id,
  dealer_id,
  car_listing_id,
  intent_level,
  buying_timeline,
  engagement_score,
  budget_confidence,
  ai_score,
  conversion_probability,
  time_on_listing_seconds,
  similar_searches_count,
  previous_interactions_count,
  predicted_deal_value,
  predicted_close_date,
  optimal_contact_time,
  suggested_messaging,
  behavioral_signals,
  opportunities,
  risk_factors,
  recommended_actions
)
SELECT 
  ce.id as lead_id,
  ce.user_id,
  ce.dealer_id,
  ce.car_listing_id,
  -- Random intent levels
  CASE (random() * 3)::int
    WHEN 0 THEN 'hot'::intent_level
    WHEN 1 THEN 'warm'::intent_level
    ELSE 'cold'::intent_level
  END,
  -- Random buying timelines
  CASE (random() * 4)::int
    WHEN 0 THEN 'immediate'::buying_timeline
    WHEN 1 THEN 'within_week'::buying_timeline
    WHEN 2 THEN 'within_month'::buying_timeline
    ELSE 'exploring'::buying_timeline
  END,
  -- Engagement score (0-100)
  (random() * 100)::numeric(5,2),
  -- Budget confidence
  CASE (random() * 3)::int
    WHEN 0 THEN 'high'::confidence_level
    WHEN 1 THEN 'medium'::confidence_level
    ELSE 'low'::confidence_level
  END,
  -- AI score (40-95)
  (40 + random() * 55)::numeric(5,2),
  -- Conversion probability (0-100)
  (random() * 100)::numeric(5,2),
  -- Time on listing (30s to 10min)
  (30 + random() * 570)::int,
  -- Similar searches (0-15)
  (random() * 15)::int,
  -- Previous interactions (0-10)
  (random() * 10)::int,
  -- Predicted deal value
  cl.expected_price * (0.85 + random() * 0.15),
  -- Predicted close date (7-60 days from now)
  CURRENT_DATE + (7 + random() * 53)::int,
  -- Optimal contact time
  CASE (random() * 3)::int
    WHEN 0 THEN 'morning (9-11 AM)'
    WHEN 1 THEN 'afternoon (2-5 PM)'
    ELSE 'evening (6-8 PM)'
  END,
  -- Suggested messaging
  'Customer shows strong interest in this vehicle segment. Emphasize value proposition and schedule test drive.',
  -- Behavioral signals
  jsonb_build_object(
    'viewed_multiple_times', random() > 0.5,
    'compared_similar_cars', random() > 0.4,
    'checked_financing_options', random() > 0.3,
    'return_visitor', random() > 0.6
  ),
  -- Opportunities
  jsonb_build_array(
    jsonb_build_object('type', 'financing', 'description', 'Customer may benefit from financing options'),
    jsonb_build_object('type', 'trade_in', 'description', 'Potential trade-in opportunity')
  ),
  -- Risk factors
  CASE 
    WHEN random() > 0.7 THEN jsonb_build_array(jsonb_build_object('type', 'budget', 'description', 'Price may be above budget'))
    ELSE '[]'::jsonb
  END,
  -- Recommended actions
  jsonb_build_array(
    jsonb_build_object('priority', 'high', 'action', 'Schedule test drive within 48 hours'),
    jsonb_build_object('priority', 'medium', 'action', 'Send detailed vehicle specs and photos')
  )
FROM car_enquiries ce
JOIN car_listings cl ON cl.id = ce.car_listing_id
WHERE ce.created_at >= CURRENT_DATE - interval '30 days'
  AND NOT EXISTS (
    SELECT 1 FROM lead_enrichment le WHERE le.lead_id = ce.id
  )
LIMIT 30;

-- ============================================
-- 2. DEALER BEHAVIOR METRICS - Sample performance data
-- ============================================

-- Update existing dealer metrics or insert new ones
INSERT INTO dealer_behavior_metrics (
  dealer_id,
  total_leads_received,
  leads_responded,
  leads_ignored,
  leads_converted,
  response_rate,
  conversion_rate,
  avg_response_time_minutes,
  fastest_response_minutes,
  slowest_response_minutes,
  quality_score,
  reliability_score,
  customer_satisfaction_score,
  streak_days,
  best_response_day,
  best_response_hour,
  last_response_at
)
SELECT 
  dp.id as dealer_id,
  (10 + random() * 40)::int as total_leads,
  (5 + random() * 30)::int as responded,
  (random() * 5)::int as ignored,
  (random() * 10)::int as converted,
  (50 + random() * 50)::numeric(5,2) as response_rate,
  (5 + random() * 25)::numeric(5,2) as conversion_rate,
  (15 + random() * 300)::numeric(10,2) as avg_response_minutes,
  (5 + random() * 30)::numeric(10,2) as fastest_response,
  (60 + random() * 600)::numeric(10,2) as slowest_response,
  (40 + random() * 60)::numeric(5,2) as quality_score,
  (50 + random() * 50)::numeric(5,2) as reliability_score,
  (3 + random() * 2)::numeric(3,2) as csat,
  (random() * 30)::int as streak_days,
  CASE (random() * 7)::int
    WHEN 0 THEN 'Monday'
    WHEN 1 THEN 'Tuesday'
    WHEN 2 THEN 'Wednesday'
    WHEN 3 THEN 'Thursday'
    WHEN 4 THEN 'Friday'
    WHEN 5 THEN 'Saturday'
    ELSE 'Sunday'
  END,
  (9 + random() * 9)::int as best_hour,
  NOW() - (random() * interval '7 days')
FROM dealer_profiles dp
WHERE NOT EXISTS (
  SELECT 1 FROM dealer_behavior_metrics dbm 
  WHERE dbm.dealer_id = dp.id AND dbm.period_end IS NULL
)
LIMIT 20;

-- ============================================
-- 3. MARKET SIGNALS - Sample trends
-- ============================================

-- Insert trending brand signals
INSERT INTO market_signals (
  signal_type,
  entity_type,
  entity_name,
  metric_value,
  previous_value,
  change_percentage,
  trend_direction,
  confidence_score,
  priority,
  metadata
)
VALUES
  ('trending_brand', 'brand', 'Maruti Suzuki', 45, 32, 40.6, 'up', 85, 80, '{"period": "last_7_days", "event_count": 45}'),
  ('trending_brand', 'brand', 'Hyundai', 38, 28, 35.7, 'up', 82, 75, '{"period": "last_7_days", "event_count": 38}'),
  ('trending_brand', 'brand', 'Tata', 29, 22, 31.8, 'up', 78, 70, '{"period": "last_7_days", "event_count": 29}'),
  ('hot_location', 'location', 'Mumbai', 52, 40, 30.0, 'up', 88, 85, '{"period": "last_7_days", "interest_count": 52}'),
  ('hot_location', 'location', 'Bangalore', 47, 38, 23.7, 'up', 85, 80, '{"period": "last_7_days", "interest_count": 47}'),
  ('hot_location', 'location', 'Delhi', 41, 35, 17.1, 'up', 80, 75, '{"period": "last_7_days", "interest_count": 41}'),
  ('inventory_gap', 'brand', 'Honda City', 8, 0, 100, 'up', 75, 90, '{"unmet_requests": 8, "period": "last_7_days"}'),
  ('inventory_gap', 'brand', 'Toyota Fortuner', 6, 0, 100, 'up', 72, 85, '{"unmet_requests": 6, "period": "last_7_days"}'),
  ('inventory_gap', 'brand', 'Mahindra Thar', 5, 0, 100, 'up', 70, 80, '{"unmet_requests": 5, "period": "last_7_days"}');

-- ============================================
-- 4. AI SUGGESTIONS - Sample recommendations
-- ============================================

-- Insert sample AI suggestions for dealers
INSERT INTO ai_suggestions (
  target_id,
  target_type,
  suggestion_type,
  title,
  description,
  reasoning,
  expected_impact,
  priority,
  action_label,
  status
)
SELECT 
  dp.id as target_id,
  'dealer' as target_type,
  CASE (random() * 5)::int
    WHEN 0 THEN 'pricing'::suggestion_type
    WHEN 1 THEN 'inventory'::suggestion_type
    WHEN 2 THEN 'marketing'::suggestion_type
    WHEN 3 THEN 'lead_followup'::suggestion_type
    ELSE 'performance'::suggestion_type
  END,
  CASE (random() * 3)::int
    WHEN 0 THEN 'Improve Response Time'
    WHEN 1 THEN 'Optimize Pricing Strategy'
    ELSE 'Increase Lead Follow-up Rate'
  END,
  CASE (random() * 3)::int
    WHEN 0 THEN 'Your average response time is 4.5 hours. Industry leaders respond within 30 minutes. Faster responses can increase conversion by 35%.'
    WHEN 1 THEN 'Your vehicles are priced 8% above market average. Consider adjusting pricing to match competitor rates and increase inquiries by 25%.'
    ELSE 'You are following up on only 65% of leads. Implement a systematic follow-up process to capture more opportunities.'
  END,
  'Based on analysis of your performance metrics and comparison with top-performing dealers in your region.',
  'Potential 20-35% increase in conversion rate',
  CASE (random() * 3)::int
    WHEN 0 THEN 'high'::suggestion_priority
    WHEN 1 THEN 'medium'::suggestion_priority
    ELSE 'low'::suggestion_priority
  END,
  'Take Action',
  'pending'::suggestion_status
FROM dealer_profiles dp
LIMIT 15;

-- ============================================
-- 5. CONVERSION FUNNEL - Sample user journey
-- ============================================

-- Insert sample conversion funnel data
INSERT INTO conversion_funnel (
  session_id,
  user_id,
  dealer_id,
  car_listing_id,
  stage,
  previous_stage,
  next_stage,
  entered_at,
  exited_at,
  duration_seconds,
  dropped_off,
  drop_off_reason,
  conversion_probability,
  estimated_time_to_convert,
  next_best_action,
  metadata
)
SELECT 
  gen_random_uuid()::text,
  ue.user_id,
  cl.seller_id,
  ue.car_id,
  CASE (random() * 5)::int
    WHEN 0 THEN 'awareness'::funnel_stage
    WHEN 1 THEN 'interest'::funnel_stage
    WHEN 2 THEN 'consideration'::funnel_stage
    WHEN 3 THEN 'intent'::funnel_stage
    ELSE 'evaluation'::funnel_stage
  END,
  NULL::funnel_stage,
  NULL::funnel_stage,
  ue.created_at,
  ue.created_at + (random() * interval '30 minutes'),
  (30 + random() * 600)::int,
  random() > 0.7,
  CASE WHEN random() > 0.7 THEN 
    CASE (random() * 3)::int
      WHEN 0 THEN 'price_too_high'
      WHEN 1 THEN 'found_alternative'
      ELSE 'needs_time'
    END
  ELSE NULL END,
  (random() * 100)::numeric(5,2),
  (1 + random() * 30)::int,
  'Follow up with personalized message within 24 hours',
  jsonb_build_object(
    'referrer', 'organic_search',
    'device', CASE WHEN random() > 0.5 THEN 'mobile' ELSE 'desktop' END
  )
FROM user_events ue
JOIN car_listings cl ON cl.id = ue.car_id
WHERE ue.created_at >= CURRENT_DATE - interval '14 days'
  AND ue.event = 'car_view'
  AND NOT EXISTS (
    SELECT 1 FROM conversion_funnel cf 
    WHERE cf.user_id = ue.user_id AND cf.car_listing_id = ue.car_id
  )
LIMIT 50;

-- ============================================
-- Verify Data Insertion
-- ============================================

SELECT 'Lead Enrichment' as table_name, COUNT(*) as record_count FROM lead_enrichment
UNION ALL
SELECT 'Dealer Behavior Metrics', COUNT(*) FROM dealer_behavior_metrics
UNION ALL
SELECT 'Market Signals', COUNT(*) FROM market_signals
UNION ALL
SELECT 'AI Suggestions', COUNT(*) FROM ai_suggestions
UNION ALL
SELECT 'Conversion Funnel', COUNT(*) FROM conversion_funnel;
