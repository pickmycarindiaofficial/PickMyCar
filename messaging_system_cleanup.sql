-- ============================================================================
-- MESSAGING SYSTEM - PRE-MIGRATION CLEANUP
-- Drops old function signatures that conflict with new ones
-- Run this FIRST before running messaging_system_setup.sql
-- ============================================================================

-- Drop old get_dealers_list function (has different signature)
DROP FUNCTION IF EXISTS public.get_dealers_list();

-- Drop old get_internal_staff if exists (just to be safe)
DROP FUNCTION IF EXISTS public.get_internal_staff();

-- Drop old get_or_create_direct_conversation if exists
DROP FUNCTION IF EXISTS public.get_or_create_direct_conversation(uuid[]);

-- Verification: Show remaining functions (should return 0 rows after cleanup)
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_internal_staff', 'get_dealers_list', 'get_or_create_direct_conversation');

-- Expected result: 0 rows (all old functions dropped successfully)
