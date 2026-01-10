-- Setup Automated Jobs for Market Intelligence (Phase 4)
-- Run this script in Supabase SQL Editor
-- This enables automated market signal detection and AI suggestions generation

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ====================================================================
-- JOB 1: Detect Market Signals (Every 6 hours)
-- ====================================================================
-- This job analyzes market trends, trending brands, hot locations, and inventory gaps
SELECT cron.schedule(
  'detect-market-signals-every-6-hours',
  '0 */6 * * *', -- At minute 0 past every 6th hour
  $$
  SELECT
    net.http_post(
        url:='https://tfmaotjdfpqtnsghdwnl.supabase.co/functions/v1/detect-market-signals',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbWFvdGpkZnBxdG5zZ2hkd25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDA4NjcsImV4cCI6MjA3NjcxNjg2N30.yArp2rMTnq5uviIv5hrY9GGwv4yljDgiOAm8xEGN8hM"}'::jsonb,
        body:=concat('{"scheduled_at": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- ====================================================================
-- JOB 2: Generate AI Suggestions (Every 4 hours)
-- ====================================================================
-- This job generates actionable AI suggestions for dealers and admins
SELECT cron.schedule(
  'generate-ai-suggestions-every-4-hours',
  '0 */4 * * *', -- At minute 0 past every 4th hour
  $$
  SELECT
    net.http_post(
        url:='https://tfmaotjdfpqtnsghdwnl.supabase.co/functions/v1/generate-ai-suggestions',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbWFvdGpkZnBxdG5zZ2hkd25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDA4NjcsImV4cCI6MjA3NjcxNjg2N30.yArp2rMTnq5uviIv5hrY9GGwv4yljDgiOAm8xEGN8hM"}'::jsonb,
        body:=concat('{"scheduled_at": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- ====================================================================
-- JOB 3: Market Intelligence Report (Daily at 8 AM)
-- ====================================================================
-- This job generates comprehensive market intelligence reports
SELECT cron.schedule(
  'market-intelligence-daily-report',
  '0 8 * * *', -- Every day at 8:00 AM
  $$
  SELECT
    net.http_post(
        url:='https://tfmaotjdfpqtnsghdwnl.supabase.co/functions/v1/market-intelligence',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbWFvdGpkZnBxdG5zZ2hkd25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDA4NjcsImV4cCI6MjA3NjcxNjg2N30.yArp2rMTnq5uviIv5hrY9GGwv4yljDgiOAm8xEGN8hM"}'::jsonb,
        body:=concat('{"scheduled_at": "', now(), '", "report_type": "daily"}')::jsonb
    ) as request_id;
  $$
);

-- ====================================================================
-- Verify Scheduled Jobs
-- ====================================================================
-- View all scheduled jobs
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job
ORDER BY jobid;

-- ====================================================================
-- Management Commands (for reference)
-- ====================================================================

-- To unschedule a job:
-- SELECT cron.unschedule('detect-market-signals-every-6-hours');
-- SELECT cron.unschedule('generate-ai-suggestions-every-4-hours');
-- SELECT cron.unschedule('market-intelligence-daily-report');

-- To view job run history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- To manually trigger a job for testing:
-- SELECT cron.schedule('test-market-signals', '* * * * *', $$
--   SELECT net.http_post(
--     url:='https://tfmaotjdfpqtnsghdwnl.supabase.co/functions/v1/detect-market-signals',
--     headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbWFvdGpkZnBxdG5zZ2hkd25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDA4NjcsImV4cCI6MjA3NjcxNjg2N30.yArp2rMTnq5uviIv5hrY9GGwv4yljDgiOAm8xEGN8hM"}'::jsonb,
--     body:='{"test": true}'::jsonb
--   ) as request_id;
-- $$);
-- Wait a minute, then unschedule:
-- SELECT cron.unschedule('test-market-signals');
