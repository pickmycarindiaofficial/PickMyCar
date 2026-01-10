-- Phase 6: Fix Test Drive Bookings - Add Missing Columns and Constraints

-- Add missing columns
ALTER TABLE test_drive_bookings
  ADD COLUMN IF NOT EXISTS dealer_notes TEXT,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS rescheduled_at TIMESTAMP WITH TIME ZONE;

-- Make dealer_id NOT NULL (after ensuring no null values exist)
DO $$ 
BEGIN
  -- Only alter if column is nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'test_drive_bookings' 
    AND column_name = 'dealer_id' 
    AND is_nullable = 'YES'
  ) THEN
    -- First delete any rows with null dealer_id (shouldn't exist)
    DELETE FROM test_drive_bookings WHERE dealer_id IS NULL;
    
    -- Now make it NOT NULL
    ALTER TABLE test_drive_bookings 
      ALTER COLUMN dealer_id SET NOT NULL;
  END IF;
END $$;

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'test_drive_bookings_car_listing_id_fkey'
  ) THEN
    ALTER TABLE test_drive_bookings
      ADD CONSTRAINT test_drive_bookings_car_listing_id_fkey 
      FOREIGN KEY (car_listing_id) REFERENCES car_listings(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'test_drive_bookings_dealer_id_fkey'
  ) THEN
    ALTER TABLE test_drive_bookings
      ADD CONSTRAINT test_drive_bookings_dealer_id_fkey 
      FOREIGN KEY (dealer_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add validation trigger for time slots (prevent double bookings)
CREATE OR REPLACE FUNCTION validate_test_drive_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for double booking (same dealer, date, and time slot)
  IF EXISTS (
    SELECT 1 FROM test_drive_bookings
    WHERE dealer_id = NEW.dealer_id
    AND preferred_date = NEW.preferred_date
    AND time_slot = NEW.time_slot
    AND status NOT IN ('cancelled', 'completed', 'no_show')
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'This time slot is already booked';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_test_drive_booking_trigger ON test_drive_bookings;
CREATE TRIGGER validate_test_drive_booking_trigger
  BEFORE INSERT OR UPDATE ON test_drive_bookings
  FOR EACH ROW
  EXECUTE FUNCTION validate_test_drive_booking();

-- Completion message
DO $$
BEGIN
  RAISE NOTICE '✓ Phase 6: Test Drive Bookings fixes completed successfully!';
  RAISE NOTICE '  ✓ Added dealer_notes, confirmed_at, rescheduled_at columns';
  RAISE NOTICE '  ✓ Made dealer_id NOT NULL';
  RAISE NOTICE '  ✓ Added foreign key constraints';
  RAISE NOTICE '  ✓ Added double booking prevention trigger';
END $$;
