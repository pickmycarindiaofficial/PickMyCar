-- EMERGENCY FIX: Disable the AI enrichment trigger
-- The "Failed to track enquiry" error is likely caused by the 'enrich_lead_on_insert' trigger
-- failing to call the external edge function (missing pg_net extension or network error).
-- Disabling this trigger will allow enquiries to be saved successfully.

DROP TRIGGER IF EXISTS enrich_lead_on_insert ON public.car_enquiries;

-- Also try to enable the extension just in case we want to re-enable it later
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";
