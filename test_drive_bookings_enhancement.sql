-- =====================================================
-- Phase 1: Test Drive Bookings - Complete Database Schema
-- =====================================================

-- Create test_drive_bookings table if not exists
CREATE TABLE IF NOT EXISTS test_drive_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  car_listing_id UUID NOT NULL,
  dealer_id UUID NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TIME NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add new columns for enhanced functionality
ALTER TABLE test_drive_bookings
  ADD COLUMN IF NOT EXISTS time_slot TEXT,
  ADD COLUMN IF NOT EXISTS showroom_address TEXT,
  ADD COLUMN IF NOT EXISTS showroom_name TEXT,
  ADD COLUMN IF NOT EXISTS google_maps_link TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_confirmation_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS whatsapp_reminder_sent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS reminder_scheduled_for TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS user_confirmed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS dealer_confirmed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS rescheduled_from UUID REFERENCES test_drive_bookings(id);

-- Enable RLS
ALTER TABLE test_drive_bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users view own test drives" ON test_drive_bookings;
DROP POLICY IF EXISTS "Users create own test drives" ON test_drive_bookings;
DROP POLICY IF EXISTS "Users update own test drives" ON test_drive_bookings;
DROP POLICY IF EXISTS "Dealers view their test drives" ON test_drive_bookings;
DROP POLICY IF EXISTS "Dealers update their test drives" ON test_drive_bookings;
DROP POLICY IF EXISTS "PowerDesk view all test drives" ON test_drive_bookings;
DROP POLICY IF EXISTS "PowerDesk manage test drives" ON test_drive_bookings;

-- Create RLS Policies
CREATE POLICY "Users view own test drives"
  ON test_drive_bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own test drives"
  ON test_drive_bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own test drives"
  ON test_drive_bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Dealers view their test drives"
  ON test_drive_bookings FOR SELECT
  TO authenticated
  USING (dealer_id = auth.uid());

CREATE POLICY "Dealers update their test drives"
  ON test_drive_bookings FOR UPDATE
  TO authenticated
  USING (dealer_id = auth.uid())
  WITH CHECK (dealer_id = auth.uid());

CREATE POLICY "PowerDesk view all test drives"
  ON test_drive_bookings FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'powerdesk'::app_role));

CREATE POLICY "PowerDesk manage test drives"
  ON test_drive_bookings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'powerdesk'::app_role))
  WITH CHECK (has_role(auth.uid(), 'powerdesk'::app_role));

-- =====================================================
-- Helper Functions for Slot Management
-- =====================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS is_slot_available(UUID, DATE, TEXT);
DROP FUNCTION IF EXISTS get_available_slots(UUID, DATE);

-- Function to check if a specific slot is available
CREATE OR REPLACE FUNCTION is_slot_available(
  p_dealer_id UUID,
  p_date DATE,
  p_time_slot TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM test_drive_bookings
    WHERE dealer_id = p_dealer_id
    AND preferred_date = p_date
    AND time_slot = p_time_slot
    AND status NOT IN ('cancelled', 'completed', 'no_show')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get all available slots for a dealer on a specific date
CREATE OR REPLACE FUNCTION get_available_slots(
  p_dealer_id UUID,
  p_date DATE
) RETURNS TABLE(time_slot TEXT, is_available BOOLEAN) AS $$
DECLARE
  slot_start TIME;
  slot_end TIME;
  current_slot TEXT;
BEGIN
  -- Generate 30-min slots from 10:00 to 17:00 (last slot 17:00-17:30)
  FOR slot_start IN
    SELECT generate_series('10:00'::TIME, '17:00'::TIME, '30 minutes'::INTERVAL)
  LOOP
    slot_end := slot_start + '30 minutes'::INTERVAL;
    current_slot := slot_start::TEXT || '-' || slot_end::TEXT;
    
    RETURN QUERY
    SELECT 
      current_slot,
      is_slot_available(p_dealer_id, p_date, current_slot);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- Update Timestamp Trigger
-- =====================================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_test_drive_bookings_timestamp ON test_drive_bookings;
DROP FUNCTION IF EXISTS update_test_drive_bookings_timestamp();

-- Create trigger function
CREATE OR REPLACE FUNCTION update_test_drive_bookings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_test_drive_bookings_timestamp
  BEFORE UPDATE ON test_drive_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_test_drive_bookings_timestamp();

-- =====================================================
-- Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_test_drive_bookings_user_id ON test_drive_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_test_drive_bookings_dealer_id ON test_drive_bookings(dealer_id);
CREATE INDEX IF NOT EXISTS idx_test_drive_bookings_car_listing_id ON test_drive_bookings(car_listing_id);
CREATE INDEX IF NOT EXISTS idx_test_drive_bookings_date ON test_drive_bookings(preferred_date);
CREATE INDEX IF NOT EXISTS idx_test_drive_bookings_status ON test_drive_bookings(status);
CREATE INDEX IF NOT EXISTS idx_test_drive_bookings_reminder_scheduled ON test_drive_bookings(reminder_scheduled_for) WHERE whatsapp_reminder_sent = FALSE;

-- =====================================================
-- Grant Permissions
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON test_drive_bookings TO authenticated;
GRANT EXECUTE ON FUNCTION is_slot_available(UUID, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_slots(UUID, DATE) TO authenticated;

-- =====================================================
-- Completion Message
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Phase 1: Test Drive Bookings schema enhancement completed successfully!';
  RAISE NOTICE 'New features added:';
  RAISE NOTICE '  ✓ Time slot management (30-min slots from 10:00-17:30)';
  RAISE NOTICE '  ✓ WhatsApp tracking (confirmation + reminder)';
  RAISE NOTICE '  ✓ Showroom details (name, address, maps link)';
  RAISE NOTICE '  ✓ User/Dealer confirmation tracking';
  RAISE NOTICE '  ✓ Reschedule support';
  RAISE NOTICE '  ✓ RLS policies for Users, Dealers, PowerDesk';
  RAISE NOTICE '  ✓ Helper functions: is_slot_available(), get_available_slots()';
  RAISE NOTICE '  ✓ Performance indexes';
END $$;
