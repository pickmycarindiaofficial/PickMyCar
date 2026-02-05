
-- Check if the current user can see any dealer roles
SELECT count(*) FROM user_roles WHERE role = 'dealer';

-- Check if the current user can see any dealer profiles
SELECT count(*) FROM dealer_profiles;

-- Check if there are any profiles associated with dealer roles
SELECT count(*) 
FROM profiles p
JOIN user_roles ur ON p.id = ur.user_id
WHERE ur.role = 'dealer';

-- Check the join that the hook performs
SELECT count(*)
FROM profiles p
JOIN dealer_profiles dp ON p.id = dp.id
WHERE p.id IN (SELECT user_id FROM user_roles WHERE role = 'dealer');
