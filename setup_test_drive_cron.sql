-- Phase 5: Setup Automated Test Drive Reminders Cron Job
-- This file contains the SQL to enable cron jobs and schedule daily reminders

-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant permissions to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule the test drive reminder function to run daily at 9:00 AM IST (3:30 AM UTC)
-- This will send WhatsApp reminders to customers 24 hours before their test drive
SELECT cron.schedule(
  'daily-test-drive-reminders',
  '30 3 * * *', -- 9:00 AM IST = 3:30 AM UTC (every day)
  $$
  SELECT
    net.http_post(
        url:='https://tfmaotjdfpqtnsghdwnl.supabase.co/functions/v1/test-drive-reminder-cron',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbWFvdGpkZnBxdG5zZ2hkd25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDA4NjcsImV4cCI6MjA3NjcxNjg2N30.yArp2rMTnq5uviIv5hrY9GGwv4yljDgiOAm8xEGN8hM"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- View all scheduled cron jobs
SELECT * FROM cron.job;

-- To unschedule the job (if needed), run:
-- SELECT cron.unschedule('daily-test-drive-reminders');

-- To check cron job execution history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
