-- Phase 5: AI-Powered Lead Enrichment Automation
-- Run this script in Supabase SQL Editor
-- This automatically enriches leads when new car enquiries are created

-- ====================================================================
-- Function: Trigger Lead Enrichment via Edge Function
-- ====================================================================
CREATE OR REPLACE FUNCTION trigger_lead_enrichment()
RETURNS TRIGGER AS $$
DECLARE
  http_request_id BIGINT;
BEGIN
  -- Call the enrich-lead edge function asynchronously
  -- This runs in the background and doesn't block the enquiry creation
  SELECT net.http_post(
    url := 'https://tfmaotjdfpqtnsghdwnl.supabase.co/functions/v1/enrich-lead',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbWFvdGpkZnBxdG5zZ2hkd25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDA4NjcsImV4cCI6MjA3NjcxNjg2N30.yArp2rMTnq5uviIv5hrY9GGwv4yljDgiOAm8xEGN8hM"}'::jsonb,
    body := jsonb_build_object(
      'leadId', NEW.id,
      'userId', NEW.user_id,
      'dealerId', NEW.dealer_id,
      'carListingId', NEW.car_listing_id,
      'enquiryType', NEW.enquiry_type,
      'createdAt', NEW.created_at
    )
  ) INTO http_request_id;

  -- Log the enrichment trigger
  INSERT INTO activity_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    NEW.user_id,
    'lead_enrichment_triggered',
    'car_enquiry',
    NEW.id,
    jsonb_build_object(
      'http_request_id', http_request_id,
      'dealer_id', NEW.dealer_id,
      'car_listing_id', NEW.car_listing_id,
      'enquiry_type', NEW.enquiry_type
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- Trigger: Auto-enrich leads on new enquiries
-- ====================================================================
DROP TRIGGER IF EXISTS enrich_lead_on_insert ON car_enquiries;

CREATE TRIGGER enrich_lead_on_insert
AFTER INSERT ON car_enquiries
FOR EACH ROW
EXECUTE FUNCTION trigger_lead_enrichment();

-- ====================================================================
-- Function: Re-enrich existing lead (manual trigger)
-- ====================================================================
CREATE OR REPLACE FUNCTION re_enrich_lead(p_enquiry_id UUID)
RETURNS jsonb AS $$
DECLARE
  v_enquiry RECORD;
  http_request_id BIGINT;
  result jsonb;
BEGIN
  -- Get the enquiry details
  SELECT * INTO v_enquiry
  FROM car_enquiries
  WHERE id = p_enquiry_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Enquiry not found'
    );
  END IF;

  -- Call the enrich-lead edge function
  SELECT net.http_post(
    url := 'https://tfmaotjdfpqtnsghdwnl.supabase.co/functions/v1/enrich-lead',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbWFvdGpkZnBxdG5zZ2hkd25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDA4NjcsImV4cCI6MjA3NjcxNjg2N30.yArp2rMTnq5uviIv5hrY9GGwv4yljDgiOAm8xEGN8hM"}'::jsonb,
    body := jsonb_build_object(
      'leadId', v_enquiry.id,
      'userId', v_enquiry.user_id,
      'dealerId', v_enquiry.dealer_id,
      'carListingId', v_enquiry.car_listing_id,
      'enquiryType', v_enquiry.enquiry_type,
      'createdAt', v_enquiry.created_at,
      'manual', true
    )
  ) INTO http_request_id;

  RETURN jsonb_build_object(
    'success', true,
    'http_request_id', http_request_id,
    'message', 'Lead re-enrichment triggered successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- Function: Batch re-enrich leads (for backfilling)
-- ====================================================================
CREATE OR REPLACE FUNCTION batch_enrich_leads(
  p_limit INTEGER DEFAULT 100,
  p_status TEXT DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_enquiry RECORD;
  v_count INTEGER := 0;
  v_errors INTEGER := 0;
BEGIN
  FOR v_enquiry IN
    SELECT id
    FROM car_enquiries
    WHERE (p_status IS NULL OR status = p_status)
    AND NOT EXISTS (
      SELECT 1 FROM lead_enrichment
      WHERE lead_id = car_enquiries.id
    )
    ORDER BY created_at DESC
    LIMIT p_limit
  LOOP
    BEGIN
      PERFORM re_enrich_lead(v_enquiry.id);
      v_count := v_count + 1;
      
      -- Add small delay to avoid overwhelming the edge function
      PERFORM pg_sleep(0.1);
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := v_errors + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'enriched_count', v_count,
    'error_count', v_errors,
    'message', format('Triggered enrichment for %s leads (%s errors)', v_count, v_errors)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- Grant Permissions
-- ====================================================================
GRANT EXECUTE ON FUNCTION re_enrich_lead(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION batch_enrich_leads(INTEGER, TEXT) TO authenticated;

-- ====================================================================
-- Verification & Testing
-- ====================================================================

-- Verify trigger was created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'enrich_lead_on_insert';

-- Test manual re-enrichment (optional - uncomment to test with a real enquiry ID)
-- SELECT re_enrich_lead('your-enquiry-id-here'::uuid);

-- Backfill enrichment for existing enquiries (optional - uncomment to run)
-- This will enrich up to 50 existing enquiries that don't have enrichment data yet
-- SELECT batch_enrich_leads(50);

-- View recent enrichment activity
SELECT 
  al.created_at,
  al.action,
  al.details->>'http_request_id' as request_id,
  al.details->>'enquiry_type' as enquiry_type,
  p.full_name as user_name
FROM activity_logs al
LEFT JOIN profiles p ON p.id = al.user_id
WHERE al.action = 'lead_enrichment_triggered'
ORDER BY al.created_at DESC
LIMIT 10;

-- ====================================================================
-- Management Commands (for reference)
-- ====================================================================

-- To disable automatic enrichment:
-- DROP TRIGGER IF EXISTS enrich_lead_on_insert ON car_enquiries;

-- To re-enable automatic enrichment:
-- CREATE TRIGGER enrich_lead_on_insert
-- AFTER INSERT ON car_enquiries
-- FOR EACH ROW
-- EXECUTE FUNCTION trigger_lead_enrichment();

-- To manually enrich a specific lead:
-- SELECT re_enrich_lead('enquiry-id'::uuid);

-- To batch enrich the first 100 unenriched leads:
-- SELECT batch_enrich_leads(100);

-- To batch enrich only 'new' status enquiries:
-- SELECT batch_enrich_leads(100, 'new');
