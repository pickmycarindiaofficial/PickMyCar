-- Migration: Add insurance_status field to car_listings table
-- This migration adds insurance status tracking (valid, expired, not_applicable)
-- to support the new Insurance Status feature in the Car Listing Form

-- Add insurance_status column to car_listings table
ALTER TABLE car_listings
ADD COLUMN IF NOT EXISTS insurance_status TEXT 
CHECK (insurance_status IN ('valid', 'expired', 'not_applicable'))
DEFAULT 'not_applicable';

-- Backfill existing data based on insurance_validity field
-- If insurance_validity exists, set status to 'valid', otherwise 'not_applicable'
UPDATE car_listings
SET insurance_status = CASE
  WHEN insurance_validity IS NOT NULL AND insurance_validity != '' THEN 'valid'
  ELSE 'not_applicable'
END
WHERE insurance_status IS NULL OR insurance_status = 'not_applicable';

-- Add comments for documentation
COMMENT ON COLUMN car_listings.insurance_status IS 'Status of insurance: valid (with expiry date), expired (without valid date), or not_applicable';
COMMENT ON COLUMN car_listings.insurance_validity IS 'Insurance expiry date (only applicable when insurance_status is valid)';
COMMENT ON COLUMN car_listings.registration_number IS 'Vehicle registration number (e.g., KA01AB1234)';

-- Optional: Create index for faster filtering by insurance status
CREATE INDEX IF NOT EXISTS idx_car_listings_insurance_status 
ON car_listings(insurance_status) 
WHERE insurance_status IS NOT NULL;

-- Note: No index on insurance_validity as it's already a DATE field and rarely used for filtering
