-- =============================================
-- CLEANUP AND RECREATE TEST DRIVE BOOKINGS RLS
-- This fixes duplicate policies and constraint issues
-- =============================================

-- Step 1: Drop ALL existing policies
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

-- Step 2: Fix status check constraint (add 'no-show' status)
ALTER TABLE test_drive_bookings 
DROP CONSTRAINT IF EXISTS test_drive_bookings_status_check;

ALTER TABLE test_drive_bookings 
ADD CONSTRAINT test_drive_bookings_status_check 
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no-show'));

-- Step 3: Create SINGLE comprehensive policy set
-- Ensure RLS is enabled
ALTER TABLE test_drive_bookings ENABLE ROW LEVEL SECURITY;

-- Users: Can INSERT their own bookings
CREATE POLICY "Users: INSERT own bookings"
  ON test_drive_bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users: Can SELECT their own bookings
CREATE POLICY "Users: SELECT own bookings"
  ON test_drive_bookings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users: Can UPDATE their own bookings
CREATE POLICY "Users: UPDATE own bookings"
  ON test_drive_bookings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Dealers: Can SELECT their bookings
CREATE POLICY "Dealers: SELECT their bookings"
  ON test_drive_bookings
  FOR SELECT
  TO authenticated
  USING (dealer_id = auth.uid());

-- Dealers: Can UPDATE their bookings
CREATE POLICY "Dealers: UPDATE their bookings"
  ON test_drive_bookings
  FOR UPDATE
  TO authenticated
  USING (dealer_id = auth.uid())
  WITH CHECK (dealer_id = auth.uid());

-- PowerDesk: FULL ACCESS to all bookings
CREATE POLICY "PowerDesk: FULL ACCESS"
  ON test_drive_bookings
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'powerdesk'))
  WITH CHECK (has_role(auth.uid(), 'powerdesk'));

-- Step 4: Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'test_drive_bookings'
ORDER BY policyname;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Test drive bookings RLS policies cleaned up and recreated successfully!';
  RAISE NOTICE '✅ Status constraint updated to include "no-show"';
  RAISE NOTICE '✅ Run the SELECT query above to verify policies';
END $$;
