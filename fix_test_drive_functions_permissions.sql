-- Fix Test Drive Database Functions and Permissions
-- This ensures the functions work properly for authenticated users

-- Grant execute permissions on test drive helper functions
GRANT EXECUTE ON FUNCTION get_available_slots(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION is_slot_available(UUID, DATE, TEXT) TO authenticated;

-- Ensure functions run with proper security context
ALTER FUNCTION get_available_slots(UUID, DATE) SECURITY DEFINER;
ALTER FUNCTION is_slot_available(UUID, DATE, TEXT) SECURITY DEFINER;

-- Verify the functions exist and show their definitions
DO $$
BEGIN
  -- Check if get_available_slots exists
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_available_slots'
  ) THEN
    RAISE NOTICE '✅ get_available_slots function exists';
  ELSE
    RAISE NOTICE '❌ get_available_slots function NOT FOUND';
  END IF;

  -- Check if is_slot_available exists
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'is_slot_available'
  ) THEN
    RAISE NOTICE '✅ is_slot_available function exists';
  ELSE
    RAISE NOTICE '❌ is_slot_available function NOT FOUND';
  END IF;

  RAISE NOTICE '✅ Permissions and security definer set for test drive functions';
END $$;

-- Verify RLS policies on test_drive_bookings
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'test_drive_bookings' 
    AND schemaname = 'public'
  ) THEN
    RAISE NOTICE '✅ test_drive_bookings table exists';
    
    -- Check if RLS is enabled
    IF EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE tablename = 'test_drive_bookings' 
      AND rowsecurity = true
    ) THEN
      RAISE NOTICE '✅ RLS is enabled on test_drive_bookings';
    ELSE
      RAISE NOTICE '⚠️ RLS is NOT enabled on test_drive_bookings';
    END IF;
  ELSE
    RAISE NOTICE '❌ test_drive_bookings table NOT FOUND';
  END IF;
END $$;
