-- ============================================================
-- FIX: Remove Foreign Key Constraint on activity_logs.user_id
-- This allows OTP dealers (from dealer_accounts) to have activity logged
-- Run this in Supabase SQL Editor
-- ============================================================

-- Step 1: Drop the existing foreign key constraint on activity_logs
ALTER TABLE activity_logs DROP CONSTRAINT IF EXISTS activity_logs_user_id_fkey;

-- Step 2: Create a function to validate user_id in activity_logs
CREATE OR REPLACE FUNCTION validate_activity_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow NULL user_id
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if user_id exists in auth.users (Supabase auth)
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.user_id) THEN
    RETURN NEW;
  END IF;
  
  -- Check if user_id exists in profiles
  IF EXISTS (SELECT 1 FROM profiles WHERE id = NEW.user_id) THEN
    RETURN NEW;
  END IF;
  
  -- Check if user_id exists in dealer_accounts (OTP dealers)
  IF EXISTS (SELECT 1 FROM dealer_accounts WHERE id = NEW.user_id) THEN
    RETURN NEW;
  END IF;
  
  -- If none match, just allow it (activity logs shouldn't block operations)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS validate_activity_user_id_trigger ON activity_logs;

-- Create trigger to validate user_id on insert
CREATE TRIGGER validate_activity_user_id_trigger
BEFORE INSERT OR UPDATE ON activity_logs
FOR EACH ROW
EXECUTE FUNCTION validate_activity_user_id();

SELECT 'activity_logs foreign key constraint fixed!' as status;
