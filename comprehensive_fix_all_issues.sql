-- =============================================
-- COMPREHENSIVE FIX FOR ALL TEST DRIVE BOOKING ISSUES
-- Run this SQL in Supabase SQL Editor to fix all issues
-- =============================================

-- =============================================
-- PART 1: FIX CAR_ENQUIRIES TABLE
-- =============================================

-- Ensure car_enquiries has proper primary key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'car_enquiries_pkey' 
    AND conrelid = 'car_enquiries'::regclass
  ) THEN
    ALTER TABLE car_enquiries ADD CONSTRAINT car_enquiries_pkey PRIMARY KEY (id);
    RAISE NOTICE '✅ Added primary key constraint to car_enquiries';
  ELSE
    RAISE NOTICE '✓ car_enquiries already has primary key';
  END IF;
END $$;

-- Set proper defaults for car_enquiries
ALTER TABLE car_enquiries 
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN status SET DEFAULT 'new',
  ALTER COLUMN enquiry_source SET DEFAULT 'website',
  ALTER COLUMN priority SET DEFAULT 'medium',
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

DO $$
BEGIN
  RAISE NOTICE '✅ Car enquiries defaults set';
END $$;

-- =============================================
-- PART 2: FIX TEST_DRIVE_BOOKINGS TABLE
-- =============================================

-- Ensure test_drive_bookings table exists with proper structure
CREATE TABLE IF NOT EXISTS test_drive_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  car_listing_id UUID NOT NULL,
  dealer_id UUID NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TIME,
  time_slot TEXT NOT NULL,
  notes TEXT,
  showroom_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  dealer_notes TEXT,
  confirmed_at TIMESTAMPTZ,
  rescheduled_at TIMESTAMPTZ,
  reminder_scheduled_for TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT test_drive_bookings_status_check 
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no-show'))
);

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'test_drive_bookings_user_id_fkey'
  ) THEN
    ALTER TABLE test_drive_bookings 
      ADD CONSTRAINT test_drive_bookings_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Added user_id foreign key';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'test_drive_bookings_car_listing_id_fkey'
  ) THEN
    ALTER TABLE test_drive_bookings 
      ADD CONSTRAINT test_drive_bookings_car_listing_id_fkey 
      FOREIGN KEY (car_listing_id) REFERENCES car_listings(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Added car_listing_id foreign key';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'test_drive_bookings_dealer_id_fkey'
  ) THEN
    ALTER TABLE test_drive_bookings 
      ADD CONSTRAINT test_drive_bookings_dealer_id_fkey 
      FOREIGN KEY (dealer_id) REFERENCES profiles(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Added dealer_id foreign key';
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_test_drive_bookings_user_id ON test_drive_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_test_drive_bookings_dealer_id ON test_drive_bookings(dealer_id);
CREATE INDEX IF NOT EXISTS idx_test_drive_bookings_car_listing_id ON test_drive_bookings(car_listing_id);
CREATE INDEX IF NOT EXISTS idx_test_drive_bookings_preferred_date ON test_drive_bookings(preferred_date);
CREATE INDEX IF NOT EXISTS idx_test_drive_bookings_status ON test_drive_bookings(status);

DO $$
BEGIN
  RAISE NOTICE '✅ Indexes created';
END $$;

-- =============================================
-- PART 3: CLEAN UP DUPLICATE RLS POLICIES
-- =============================================

-- Drop ALL existing test_drive_bookings policies
DROP POLICY IF EXISTS "Users can create bookings" ON test_drive_bookings;
DROP POLICY IF EXISTS "Users can create own bookings" ON test_drive_bookings;
DROP POLICY IF EXISTS "Users create own test drives" ON test_drive_bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON test_drive_bookings;
DROP POLICY IF EXISTS "Users view own test drives" ON test_drive_bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON test_drive_bookings;
DROP POLICY IF EXISTS "Users update own test drives" ON test_drive_bookings;
DROP POLICY IF EXISTS "Dealers can view bookings for their cars" ON test_drive_bookings;
DROP POLICY IF EXISTS "Dealers can view own bookings" ON test_drive_bookings;
DROP POLICY IF EXISTS "Dealers can view their bookings" ON test_drive_bookings;
DROP POLICY IF EXISTS "Dealers view their test drives" ON test_drive_bookings;
DROP POLICY IF EXISTS "Dealers can update bookings for their cars" ON test_drive_bookings;
DROP POLICY IF EXISTS "Dealers can update own bookings" ON test_drive_bookings;
DROP POLICY IF EXISTS "Dealers can update their bookings" ON test_drive_bookings;
DROP POLICY IF EXISTS "Dealers update their test drives" ON test_drive_bookings;
DROP POLICY IF EXISTS "PowerDesk can manage all bookings" ON test_drive_bookings;
DROP POLICY IF EXISTS "PowerDesk manage test drives" ON test_drive_bookings;
DROP POLICY IF EXISTS "PowerDesk can view all bookings" ON test_drive_bookings;
DROP POLICY IF EXISTS "PowerDesk view all test drives" ON test_drive_bookings;
DROP POLICY IF EXISTS "PowerDesk can update all bookings" ON test_drive_bookings;

DO $$
BEGIN
  RAISE NOTICE '✅ Dropped old RLS policies';
END $$;

-- Enable RLS
ALTER TABLE test_drive_bookings ENABLE ROW LEVEL SECURITY;

-- Create clean, comprehensive RLS policies
CREATE POLICY "Users: INSERT own bookings"
  ON test_drive_bookings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users: SELECT own bookings"
  ON test_drive_bookings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users: UPDATE own bookings"
  ON test_drive_bookings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Dealers: SELECT their bookings"
  ON test_drive_bookings FOR SELECT
  TO authenticated
  USING (dealer_id = auth.uid());

CREATE POLICY "Dealers: UPDATE their bookings"
  ON test_drive_bookings FOR UPDATE
  TO authenticated
  USING (dealer_id = auth.uid())
  WITH CHECK (dealer_id = auth.uid());

CREATE POLICY "PowerDesk: FULL ACCESS"
  ON test_drive_bookings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'powerdesk'))
  WITH CHECK (has_role(auth.uid(), 'powerdesk'));

DO $$
BEGIN
  RAISE NOTICE '✅ New RLS policies created';
END $$;

-- =============================================
-- PART 4: CREATE HELPER FUNCTIONS
-- =============================================

-- Function to check if a slot is available
CREATE OR REPLACE FUNCTION is_slot_available(
  p_dealer_id UUID,
  p_date DATE,
  p_time_slot TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1
    FROM test_drive_bookings
    WHERE dealer_id = p_dealer_id
      AND preferred_date = p_date
      AND time_slot = p_time_slot
      AND status NOT IN ('cancelled', 'completed', 'no-show')
  );
END;
$$;

-- Function to get all available slots for a dealer on a date
CREATE OR REPLACE FUNCTION get_available_slots(
  p_dealer_id UUID,
  p_date DATE
)
RETURNS TABLE(time_slot TEXT, is_available BOOLEAN)
LANGUAGE plpgsql
AS $$
DECLARE
  v_slot TEXT;
  v_slots TEXT[] := ARRAY[
    '10:00-10:30', '10:30-11:00', '11:00-11:30', '11:30-12:00',
    '12:00-12:30', '12:30-13:00', '13:00-13:30', '13:30-14:00',
    '14:00-14:30', '14:30-15:00', '15:00-15:30', '15:30-16:00',
    '16:00-16:30', '16:30-17:00', '17:00-17:30'
  ];
BEGIN
  FOREACH v_slot IN ARRAY v_slots
  LOOP
    time_slot := v_slot;
    is_available := is_slot_available(p_dealer_id, p_date, v_slot);
    RETURN NEXT;
  END LOOP;
END;
$$;

DO $$
BEGIN
  RAISE NOTICE '✅ Helper functions created';
END $$;

-- =============================================
-- PART 5: CREATE TRIGGERS
-- =============================================

-- Trigger to prevent double bookings
CREATE OR REPLACE FUNCTION validate_test_drive_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM test_drive_bookings
    WHERE dealer_id = NEW.dealer_id
      AND preferred_date = NEW.preferred_date
      AND time_slot = NEW.time_slot
      AND status NOT IN ('cancelled', 'completed', 'no-show')
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
  ) THEN
    RAISE EXCEPTION 'This time slot is already booked';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_test_drive_booking_trigger ON test_drive_bookings;
CREATE TRIGGER validate_test_drive_booking_trigger
  BEFORE INSERT OR UPDATE ON test_drive_bookings
  FOR EACH ROW
  EXECUTE FUNCTION validate_test_drive_booking();

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_test_drive_bookings_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_test_drive_bookings_timestamp_trigger ON test_drive_bookings;
CREATE TRIGGER update_test_drive_bookings_timestamp_trigger
  BEFORE UPDATE ON test_drive_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_test_drive_bookings_timestamp();

DO $$
BEGIN
  RAISE NOTICE '✅ Triggers created';
END $$;

-- =============================================
-- PART 6: GRANT PERMISSIONS
-- =============================================

GRANT SELECT, INSERT, UPDATE ON test_drive_bookings TO authenticated;
GRANT EXECUTE ON FUNCTION is_slot_available(UUID, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_slots(UUID, DATE) TO authenticated;

DO $$
BEGIN
  RAISE NOTICE '✅ Permissions granted';
END $$;

-- =============================================
-- VERIFICATION
-- =============================================

-- Verify test_drive_bookings structure
SELECT 
  'test_drive_bookings' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'test_drive_bookings'
ORDER BY ordinal_position;

-- Verify RLS policies
SELECT 
  'RLS Policies' as section,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'test_drive_bookings'
ORDER BY policyname;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════╗';
  RAISE NOTICE '║  ✅ ALL FIXES APPLIED SUCCESSFULLY!        ║';
  RAISE NOTICE '╠════════════════════════════════════════════╣';
  RAISE NOTICE '║  • Car enquiries table fixed               ║';
  RAISE NOTICE '║  • Test drive bookings table configured    ║';
  RAISE NOTICE '║  • RLS policies cleaned and recreated      ║';
  RAISE NOTICE '║  • Helper functions created                ║';
  RAISE NOTICE '║  • Triggers created                        ║';
  RAISE NOTICE '║  • Permissions granted                     ║';
  RAISE NOTICE '║                                            ║';
  RAISE NOTICE '║  🚗 Test drive bookings are now ready!     ║';
  RAISE NOTICE '╚════════════════════════════════════════════╝';
  RAISE NOTICE '';
END $$;
