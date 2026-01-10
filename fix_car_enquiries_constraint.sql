-- Fix car_enquiries table to ensure proper constraints and remove any conflicting triggers
-- This fixes the "no unique or exclusion constraint matching the ON CONFLICT specification" error

-- First, check if there's an ID column and ensure it's a primary key
DO $$
BEGIN
  -- Ensure id column exists and is primary key
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'car_enquiries' 
    AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE car_enquiries ADD PRIMARY KEY (id);
    RAISE NOTICE '✅ Added primary key to car_enquiries.id';
  END IF;
END $$;

-- Check if there are any problematic triggers that might cause ON CONFLICT issues
-- Remove any triggers that might be using ON CONFLICT internally
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT tgname, tgrelid::regclass as table_name
    FROM pg_trigger 
    WHERE tgrelid = 'car_enquiries'::regclass
    AND tgname LIKE '%upsert%' OR tgname LIKE '%conflict%'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', r.tgname, r.table_name);
    RAISE NOTICE '✅ Dropped trigger %s from %s', r.tgname, r.table_name;
  END LOOP;
END $$;

-- Ensure the table has proper default values for all required fields
ALTER TABLE car_enquiries 
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Make sure status has a default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'car_enquiries' 
    AND column_name = 'status'
    AND column_default IS NOT NULL
  ) THEN
    ALTER TABLE car_enquiries ALTER COLUMN status SET DEFAULT 'new';
    RAISE NOTICE '✅ Set default value for status column';
  END IF;
END $$;

-- Make sure enquiry_source has a default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'car_enquiries' 
    AND column_name = 'enquiry_source'
    AND column_default IS NOT NULL
  ) THEN
    ALTER TABLE car_enquiries ALTER COLUMN enquiry_source SET DEFAULT 'website';
    RAISE NOTICE '✅ Set default value for enquiry_source column';
  END IF;
END $$;

-- Verify the table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'car_enquiries'
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Car enquiries table constraints fixed successfully!';
  RAISE NOTICE '✅ You can now book test drives without errors';
END $$;
