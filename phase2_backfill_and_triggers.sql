-- ========================================
-- PHASE 2: DATA COLLECTION ENHANCEMENT
-- Part 1 & 2: Backfill + Auto-Update Triggers
-- ========================================

-- 1. BACKFILL EXISTING LEAD DATA
-- Populate lead_enrichment from existing car_enquiries
INSERT INTO lead_enrichment (
  lead_id,
  user_id,
  dealer_id,
  car_listing_id,
  intent_level,
  buying_timeline,
  ai_score,
  engagement_score,
  previous_interactions_count,
  optimal_contact_time
)
SELECT 
  e.id as lead_id,
  e.user_id,
  e.dealer_id,
  e.car_listing_id,
  CASE 
    WHEN e.enquiry_type = 'test_drive' THEN 'hot'::intent_level
    WHEN e.enquiry_type = 'call' THEN 'hot'::intent_level
    WHEN e.enquiry_type = 'loan' THEN 'hot'::intent_level
    WHEN e.enquiry_type = 'whatsapp' THEN 'warm'::intent_level
    ELSE 'cold'::intent_level
  END as intent_level,
  CASE 
    WHEN e.enquiry_type = 'test_drive' THEN 'immediate'::buying_timeline
    WHEN e.status = 'converted' THEN 'immediate'::buying_timeline
    WHEN e.enquiry_type = 'loan' THEN 'weeks'::buying_timeline
    ELSE 'months'::buying_timeline
  END as buying_timeline,
  CASE 
    WHEN e.enquiry_type = 'test_drive' THEN 85
    WHEN e.enquiry_type = 'call' THEN 80
    WHEN e.enquiry_type = 'loan' THEN 75
    WHEN e.status = 'converted' THEN 95
    ELSE 65
  END as ai_score,
  CASE 
    WHEN e.enquiry_type IN ('test_drive', 'loan') THEN 80
    WHEN e.enquiry_type = 'call' THEN 70
    ELSE 50
  END as engagement_score,
  1 as previous_interactions_count,
  CASE 
    WHEN EXTRACT(HOUR FROM e.created_at) BETWEEN 9 AND 12 THEN 'morning'
    WHEN EXTRACT(HOUR FROM e.created_at) BETWEEN 12 AND 17 THEN 'afternoon'
    WHEN EXTRACT(HOUR FROM e.created_at) BETWEEN 17 AND 21 THEN 'evening'
    ELSE 'night'
  END as optimal_contact_time
FROM car_enquiries e
WHERE NOT EXISTS (
  SELECT 1 FROM lead_enrichment le WHERE le.lead_id = e.id
);

-- 2. BACKFILL DEALER BEHAVIOR METRICS
-- Initialize metrics for all dealers with enquiries
INSERT INTO dealer_behavior_metrics (
  dealer_id,
  total_leads_received,
  leads_responded,
  leads_converted,
  avg_response_time_minutes,
  response_rate,
  conversion_rate,
  quality_score,
  reliability_score
)
SELECT 
  e.dealer_id,
  COUNT(*) as total_leads_received,
  COUNT(*) FILTER (WHERE e.status IN ('contacted', 'converted')) as leads_responded,
  COUNT(*) FILTER (WHERE e.status = 'converted') as leads_converted,
  COALESCE(
    AVG(EXTRACT(EPOCH FROM (e.contacted_at - e.created_at)) / 60) 
    FILTER (WHERE e.contacted_at IS NOT NULL),
    0
  ) as avg_response_time_minutes,
  CASE 
    WHEN COUNT(*) > 0 THEN 
      (COUNT(*) FILTER (WHERE e.status IN ('contacted', 'converted'))::NUMERIC / COUNT(*)::NUMERIC) * 100
    ELSE 0
  END as response_rate,
  CASE 
    WHEN COUNT(*) > 0 THEN 
      (COUNT(*) FILTER (WHERE e.status = 'converted')::NUMERIC / COUNT(*)::NUMERIC) * 100
    ELSE 0
  END as conversion_rate,
  CASE 
    WHEN COUNT(*) FILTER (WHERE e.status IN ('contacted', 'converted')) > COUNT(*) * 0.7 THEN 80
    WHEN COUNT(*) FILTER (WHERE e.status IN ('contacted', 'converted')) > COUNT(*) * 0.5 THEN 60
    ELSE 40
  END as quality_score,
  CASE 
    WHEN COUNT(*) FILTER (WHERE e.status = 'converted') > 0 THEN 75
    WHEN COUNT(*) FILTER (WHERE e.status = 'contacted') > 0 THEN 60
    ELSE 40
  END as reliability_score
FROM car_enquiries e
WHERE NOT EXISTS (
  SELECT 1 FROM dealer_behavior_metrics dbm 
  WHERE dbm.dealer_id = e.dealer_id AND dbm.period_end IS NULL
)
GROUP BY e.dealer_id;

-- 3. AUTO-UPDATE TRIGGER FOR DEALER BEHAVIOR
-- Function to update dealer behavior metrics when enquiry status changes
CREATE OR REPLACE FUNCTION update_dealer_behavior_on_enquiry_change()
RETURNS TRIGGER AS $$
DECLARE
  response_time_minutes NUMERIC;
  existing_metrics RECORD;
  total_leads INTEGER;
  responded_leads INTEGER;
  converted_leads INTEGER;
BEGIN
  -- Only track when status changes to 'contacted' or 'converted'
  IF NEW.status IN ('contacted', 'converted') AND (OLD.status IS NULL OR OLD.status != NEW.status) THEN
    
    -- Calculate response time if contacted_at is set
    IF NEW.contacted_at IS NOT NULL THEN
      response_time_minutes := EXTRACT(EPOCH FROM (NEW.contacted_at - NEW.created_at)) / 60;
    END IF;
    
    -- Get current dealer metrics
    SELECT * INTO existing_metrics
    FROM dealer_behavior_metrics 
    WHERE dealer_id = NEW.dealer_id 
    AND period_end IS NULL
    LIMIT 1;
    
    IF existing_metrics IS NULL THEN
      -- Create new metrics record for this dealer
      INSERT INTO dealer_behavior_metrics (
        dealer_id,
        total_leads_received,
        leads_responded,
        leads_converted,
        avg_response_time_minutes,
        fastest_response_minutes,
        slowest_response_minutes,
        response_rate,
        conversion_rate,
        quality_score,
        reliability_score,
        last_response_at,
        best_response_day,
        best_response_hour
      ) VALUES (
        NEW.dealer_id,
        1,
        CASE WHEN NEW.status IN ('contacted', 'converted') THEN 1 ELSE 0 END,
        CASE WHEN NEW.status = 'converted' THEN 1 ELSE 0 END,
        COALESCE(response_time_minutes, 0),
        response_time_minutes,
        response_time_minutes,
        CASE WHEN NEW.status IN ('contacted', 'converted') THEN 100 ELSE 0 END,
        CASE WHEN NEW.status = 'converted' THEN 100 ELSE 0 END,
        CASE WHEN NEW.status = 'converted' THEN 80 ELSE 60 END,
        CASE WHEN NEW.status = 'converted' THEN 75 ELSE 60 END,
        NOW(),
        TO_CHAR(NOW(), 'Day'),
        EXTRACT(HOUR FROM NOW())
      );
    ELSE
      -- Calculate new totals
      total_leads := existing_metrics.total_leads_received;
      responded_leads := existing_metrics.leads_responded + 1;
      converted_leads := existing_metrics.leads_converted + 
                        CASE WHEN NEW.status = 'converted' THEN 1 ELSE 0 END;
      
      -- Update existing metrics
      UPDATE dealer_behavior_metrics
      SET
        leads_responded = responded_leads,
        leads_converted = converted_leads,
        avg_response_time_minutes = CASE 
          WHEN response_time_minutes IS NOT NULL THEN
            (existing_metrics.avg_response_time_minutes * existing_metrics.leads_responded + response_time_minutes) / 
            responded_leads
          ELSE existing_metrics.avg_response_time_minutes
        END,
        fastest_response_minutes = CASE 
          WHEN response_time_minutes IS NOT NULL THEN
            LEAST(COALESCE(existing_metrics.fastest_response_minutes, response_time_minutes), response_time_minutes)
          ELSE existing_metrics.fastest_response_minutes
        END,
        slowest_response_minutes = CASE 
          WHEN response_time_minutes IS NOT NULL THEN
            GREATEST(COALESCE(existing_metrics.slowest_response_minutes, response_time_minutes), response_time_minutes)
          ELSE existing_metrics.slowest_response_minutes
        END,
        response_rate = (responded_leads::NUMERIC / total_leads::NUMERIC) * 100,
        conversion_rate = (converted_leads::NUMERIC / total_leads::NUMERIC) * 100,
        quality_score = CASE 
          WHEN (responded_leads::NUMERIC / total_leads::NUMERIC) > 0.8 THEN 90
          WHEN (responded_leads::NUMERIC / total_leads::NUMERIC) > 0.6 THEN 75
          WHEN (responded_leads::NUMERIC / total_leads::NUMERIC) > 0.4 THEN 60
          ELSE 40
        END,
        reliability_score = CASE 
          WHEN converted_leads > 0 THEN 
            LEAST(100, 50 + (converted_leads::NUMERIC / total_leads::NUMERIC) * 100)
          ELSE 50
        END,
        last_response_at = NOW(),
        streak_days = CASE 
          WHEN existing_metrics.last_response_at IS NOT NULL 
            AND DATE(existing_metrics.last_response_at) = DATE(NOW()) - INTERVAL '1 day'
          THEN existing_metrics.streak_days + 1
          WHEN existing_metrics.last_response_at IS NOT NULL 
            AND DATE(existing_metrics.last_response_at) = DATE(NOW())
          THEN existing_metrics.streak_days
          ELSE 1
        END,
        best_response_day = TO_CHAR(NOW(), 'Day'),
        best_response_hour = EXTRACT(HOUR FROM NOW())
      WHERE id = existing_metrics.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to car_enquiries table
DROP TRIGGER IF EXISTS trigger_update_dealer_behavior ON car_enquiries;
CREATE TRIGGER trigger_update_dealer_behavior
  AFTER UPDATE ON car_enquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_dealer_behavior_on_enquiry_change();

-- 4. TRIGGER TO INCREMENT TOTAL LEADS ON NEW ENQUIRY
CREATE OR REPLACE FUNCTION increment_dealer_lead_count()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO dealer_behavior_metrics (
    dealer_id,
    total_leads_received,
    leads_responded,
    leads_converted
  ) VALUES (
    NEW.dealer_id,
    1,
    0,
    0
  )
  ON CONFLICT (dealer_id) 
  WHERE period_end IS NULL
  DO UPDATE SET
    total_leads_received = dealer_behavior_metrics.total_leads_received + 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_increment_dealer_leads ON car_enquiries;
CREATE TRIGGER trigger_increment_dealer_leads
  AFTER INSERT ON car_enquiries
  FOR EACH ROW
  EXECUTE FUNCTION increment_dealer_lead_count();

-- Success message
SELECT 'Phase 2 Part 1 & 2 Complete! Backfilled ' || COUNT(*) || ' leads with enrichment data' as status
FROM lead_enrichment;
