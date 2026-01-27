-- FIX DATA INTEGRITY ISSUE
-- The error "violates foreign key constraint car_enquiries_user_id_fkey" means
-- the user trying to make an enquiry exists in the Auth system but is missing
-- from the 'public.profiles' table.
-- This script backfills any missing profiles from auth.users.

INSERT INTO public.profiles (id, full_name, username, created_at, updated_at)
SELECT
  au.id,
  -- Use name from metadata, or email prefix, or fallback to 'User'
  COALESCE(au.raw_user_meta_data->>'full_name', substring(au.email from '^[^@]+'), 'User'),
  -- Use email as username
  COALESCE(au.email, 'user_' || substr(au.id::text, 1, 8)),
  au.created_at,
  NOW()
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- Output result
SELECT count(*) as fixed_profiles_count
FROM public.profiles
WHERE updated_at > (NOW() - interval '1 minute');
