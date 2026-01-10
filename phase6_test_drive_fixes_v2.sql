-- Phase 6: Test Drive Bookings Table Setup with Primary Key
-- Run this in Supabase SQL Editor

-- Create test_drive_bookings table with proper primary key
CREATE TABLE IF NOT EXISTS test_drive_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  car_listing_id UUID NOT NULL REFERENCES car_listings(id) ON DELETE CASCADE,
  dealer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  preferred_date DATE NOT NULL,
  preferred_time TIME NOT NULL,
  time_slot TEXT NOT NULL,
  notes TEXT,
  showroom_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no-show')),
  dealer_notes TEXT,
  confirmed_at TIMESTAMPTZ,
  reminder_scheduled_for TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  whatsapp_confirmation_sent BOOLEAN DEFAULT false,
  rescheduled_at TIMESTAMPTZ,
  user_confirmed BOOLEAN DEFAULT false,
  dealer_confirmed BOOLEAN DEFAULT false,
  cancellation_reason TEXT,
  rescheduled_from UUID REFERENCES test_drive_bookings(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "Users can view own bookings" ON test_drive_bookings;
DROP POLICY IF EXISTS "Users can create own bookings" ON test_drive_bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON test_drive_bookings;
DROP POLICY IF EXISTS "Dealers can view their bookings" ON test_drive_bookings;
DROP POLICY IF EXISTS "Dealers can update their bookings" ON test_drive_bookings;
DROP POLICY IF EXISTS "PowerDesk can view all bookings" ON test_drive_bookings;
DROP POLICY IF EXISTS "PowerDesk can update all bookings" ON test_drive_bookings;

-- Enable RLS
ALTER TABLE test_drive_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own bookings"
  ON test_drive_bookings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own bookings"
  ON test_drive_bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own bookings"
  ON test_drive_bookings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Dealers can view their bookings"
  ON test_drive_bookings
  FOR SELECT
  TO authenticated
  USING (
    dealer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('dealer', 'powerdesk')
    )
  );

CREATE POLICY "Dealers can update their bookings"
  ON test_drive_bookings
  FOR UPDATE
  TO authenticated
  USING (
    dealer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('dealer', 'powerdesk')
    )
  );

CREATE POLICY "PowerDesk can view all bookings"
  ON test_drive_bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'powerdesk'
    )
  );

CREATE POLICY "PowerDesk can update all bookings"
  ON test_drive_bookings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'powerdesk'
    )
  );

-- Helper functions for slot availability
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

CREATE OR REPLACE FUNCTION get_available_slots(
  p_dealer_id UUID,
  p_date DATE
)
RETURNS TABLE (
  time_slot TEXT,
  is_available BOOLEAN
)
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

-- Trigger to update timestamp
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_test_drive_bookings_user_id ON test_drive_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_test_drive_bookings_dealer_id ON test_drive_bookings(dealer_id);
CREATE INDEX IF NOT EXISTS idx_test_drive_bookings_car_listing_id ON test_drive_bookings(car_listing_id);
CREATE INDEX IF NOT EXISTS idx_test_drive_bookings_preferred_date ON test_drive_bookings(preferred_date);
CREATE INDEX IF NOT EXISTS idx_test_drive_bookings_status ON test_drive_bookings(status);
CREATE INDEX IF NOT EXISTS idx_test_drive_bookings_reminder ON test_drive_bookings(reminder_scheduled_for) WHERE reminder_sent_at IS NULL;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON test_drive_bookings TO authenticated;
GRANT EXECUTE ON FUNCTION is_slot_available TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_slots TO authenticated;
