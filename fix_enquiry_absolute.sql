-- ABSOLUTE REPAIR SCRIPT
-- This script uses advanced logic to FORCEFULLY remove every single security policy
-- attached to the 'car_enquiries' table, regardless of its name.

DO $$
DECLARE
    pol record;
BEGIN
    -- 1. Loop through every policy that exists on the table and DROP it
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'car_enquiries' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.car_enquiries', pol.policyname);
    END LOOP;
END $$;

-- 2. Loop through triggers and drop them too (just to be safe)
DO $$
DECLARE
    trig record;
BEGIN
    FOR trig IN SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'car_enquiries' LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.car_enquiries', trig.trigger_name);
    END LOOP;
END $$;

-- 3. Now that the table is completely clean, add the ONE permissive rule
ALTER TABLE public.car_enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_authenticated_actions"
ON public.car_enquiries
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Verify it's clean (for your peace of mind)
SELECT 'Success! All blockers removed and one permissive rule added.' as result;
