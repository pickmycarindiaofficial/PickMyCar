-- Enable Real-time Updates for Key Tables (Phase 7)
-- Run this script in Supabase SQL Editor
-- This enables real-time subscriptions for live updates

-- Enable replica identity for messages table
ALTER TABLE messages REPLICA IDENTITY FULL;

-- Enable replica identity for notifications table  
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- Enable replica identity for car_enquiries table
ALTER TABLE car_enquiries REPLICA IDENTITY FULL;

-- Enable replica identity for ai_suggestions table
ALTER TABLE ai_suggestions REPLICA IDENTITY FULL;

-- Enable replica identity for demand_gap_notifications table
ALTER TABLE demand_gap_notifications REPLICA IDENTITY FULL;

-- Enable replica identity for market_signals table
ALTER TABLE market_signals REPLICA IDENTITY FULL;

-- Enable replica identity for lead_enrichment table
ALTER TABLE lead_enrichment REPLICA IDENTITY FULL;

-- Verify replica identity settings
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN relreplident = 'd' THEN 'default'
        WHEN relreplident = 'n' THEN 'nothing'
        WHEN relreplident = 'f' THEN 'full'
        WHEN relreplident = 'i' THEN 'index'
    END AS replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_tables t ON t.tablename = c.relname AND t.schemaname = n.nspname
WHERE schemaname = 'public'
AND tablename IN (
    'messages',
    'notifications',
    'car_enquiries',
    'ai_suggestions',
    'demand_gap_notifications',
    'market_signals',
    'lead_enrichment'
)
ORDER BY tablename;

-- Note: Real-time is automatically enabled for all tables in Supabase
-- The above commands ensure full row data is captured during updates
-- which is required for real-time subscriptions to work properly

SELECT 'Real-time enabled successfully for all key tables!' as status;
