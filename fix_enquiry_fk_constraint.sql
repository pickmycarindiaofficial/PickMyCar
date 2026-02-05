-- Fix for "violates foreign key constraint car_enquiries_dealer_id_fkey"
-- The issue is that the text is strictly linking to dealer_profiles, but individual sellers and OTP users may not have profiles.
-- The most professional handling for this specific field is to REMOVE the constraint to support all seller types (Guest, OTP, Dealer, User).

-- 1. Drop the restrictive constraint
ALTER TABLE public.car_enquiries 
DROP CONSTRAINT IF EXISTS car_enquiries_dealer_id_fkey;

-- 2. Verify
SELECT 
    conname as constraint_name, 
    conrelid::regclass as table_name
FROM pg_constraint 
WHERE conname = 'car_enquiries_dealer_id_fkey';

SELECT 'Successfully REMOVED car_enquiries foreign key constraint to support all seller types' as status;
