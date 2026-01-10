-- Fix missing foreign keys in lead_enrichment table
-- Run this script in Supabase SQL Editor

-- Add foreign key for user_id
ALTER TABLE lead_enrichment 
ADD CONSTRAINT fk_lead_enrichment_user_id 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add foreign key for car_listing_id
ALTER TABLE lead_enrichment 
ADD CONSTRAINT fk_lead_enrichment_car_listing_id 
FOREIGN KEY (car_listing_id) REFERENCES car_listings(id) ON DELETE CASCADE;

-- Add foreign key for dealer_id
ALTER TABLE lead_enrichment 
ADD CONSTRAINT fk_lead_enrichment_dealer_id 
FOREIGN KEY (dealer_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add foreign key for lead_id (references car_enquiries)
ALTER TABLE lead_enrichment 
ADD CONSTRAINT fk_lead_enrichment_lead_id 
FOREIGN KEY (lead_id) REFERENCES car_enquiries(id) ON DELETE CASCADE;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- Verify foreign keys were created successfully
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='lead_enrichment'
ORDER BY tc.constraint_name;
