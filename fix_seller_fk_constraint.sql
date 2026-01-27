-- ============================================================
-- FIX: Remove Foreign Key Constraint on car_listings.seller_id
-- This allows OTP dealers (from dealer_accounts) to create listings
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE car_listings DROP CONSTRAINT IF EXISTS car_listings_seller_id_fkey;

-- Step 2: Create a new check that allows seller_id from EITHER profiles OR dealer_accounts
-- Using a trigger instead of FK constraint for flexibility

-- Create a function to validate seller_id
CREATE OR REPLACE FUNCTION validate_seller_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if seller_id exists in profiles (Supabase auth users)
  IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.seller_id) THEN
    RETURN NEW;
  END IF;
  
  -- Check if seller_id exists in dealer_accounts (OTP dealers)
  IF EXISTS (SELECT 1 FROM dealer_accounts WHERE id = NEW.seller_id AND is_active = true) THEN
    RETURN NEW;
  END IF;
  
  -- If neither, raise an error
  RAISE EXCEPTION 'Invalid seller_id: must exist in profiles or dealer_accounts';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS validate_seller_id_trigger ON car_listings;

-- Create trigger to validate seller_id on insert
CREATE TRIGGER validate_seller_id_trigger
BEFORE INSERT OR UPDATE ON car_listings
FOR EACH ROW
EXECUTE FUNCTION validate_seller_id();

-- Verify the constraint was dropped
SELECT conname, contype, conrelid::regclass, confrelid::regclass
FROM pg_constraint 
WHERE conrelid = 'car_listings'::regclass AND conname LIKE '%seller%';

SELECT 'Foreign key constraint removed and validation trigger created!' as status;
