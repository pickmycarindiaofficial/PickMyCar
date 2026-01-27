-- FIXED SCRIPT v3: Drops ALL specific policies mentioned in errors

-- 1. Drop ALL specific policies that might prevent column alteration
DROP POLICY IF EXISTS "Users can save cars" ON user_saved_cars;
DROP POLICY IF EXISTS "Users can remove saved cars" ON user_saved_cars; -- This was the one causing the last error
DROP POLICY IF EXISTS "Users can view saved cars" ON user_saved_cars;

-- 2. Drop all other potential existing policies to be safe
DROP POLICY IF EXISTS "Users can view own saved cars" ON user_saved_cars;
DROP POLICY IF EXISTS "Users can insert own saved cars" ON user_saved_cars;
DROP POLICY IF EXISTS "Users can delete own saved cars" ON user_saved_cars;
DROP POLICY IF EXISTS "Anyone can view saved cars" ON user_saved_cars;
DROP POLICY IF EXISTS "Anyone can insert saved cars" ON user_saved_cars;
DROP POLICY IF EXISTS "Anyone can delete saved cars" ON user_saved_cars;
DROP POLICY IF EXISTS "Allow users to view own saved cars" ON user_saved_cars;
DROP POLICY IF EXISTS "Allow users to insert saved cars" ON user_saved_cars;
DROP POLICY IF EXISTS "Allow users to delete own saved cars" ON user_saved_cars;
DROP POLICY IF EXISTS "Allow all select on saved cars" ON user_saved_cars;
DROP POLICY IF EXISTS "Allow all insert on saved cars" ON user_saved_cars;
DROP POLICY IF EXISTS "Allow all delete on saved cars" ON user_saved_cars;

-- 3. Drop Foreign Key Constraint if it exists
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT tc.constraint_name INTO constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'user_saved_cars' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'user_id';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE user_saved_cars DROP CONSTRAINT ' || quote_ident(constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END IF;
END $$;

-- 4. Now we can safely alter the column type since policies are gone
ALTER TABLE user_saved_cars 
ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- 5. Re-enable RLS and add new permissive policies
ALTER TABLE user_saved_cars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select on saved cars"
ON user_saved_cars FOR SELECT
USING (true);

CREATE POLICY "Allow all insert on saved cars"
ON user_saved_cars FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow all delete on saved cars"
ON user_saved_cars FOR DELETE
USING (true);

-- 6. Grant permissions
GRANT SELECT, INSERT, DELETE ON user_saved_cars TO anon;
GRANT SELECT, INSERT, DELETE ON user_saved_cars TO authenticated;

SELECT 'Success: Policies dropped, Foreign Key removed, and RLS updated.' as status;
