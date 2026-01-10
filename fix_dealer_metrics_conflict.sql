-- Fix: Create the partial unique index that the trigger expects
-- This allows only one active period (period_end IS NULL) per dealer

CREATE UNIQUE INDEX IF NOT EXISTS dealer_behavior_metrics_dealer_period_active 
ON dealer_behavior_metrics(dealer_id) 
WHERE period_end IS NULL;

-- Verify the index was created
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'dealer_behavior_metrics'
AND indexname = 'dealer_behavior_metrics_dealer_period_active';
