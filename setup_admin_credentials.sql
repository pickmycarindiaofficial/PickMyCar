-- =================================================================
-- SMART ADMIN SETUP SCRIPT (Fixes "User Not Found")
-- =================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  -- ⬇️ ENTER ONLY THE LAST 10 DIGITS OF YOUR PHONE NUMBER ⬇️
  -- Example: '9876543210' (No +91, No spaces)
  search_digits TEXT := '7305004047';
  
  -- Credentials to Set
  target_username TEXT := 'roshanmahendra';
  target_pass TEXT := 'Prawin1991!';
  target_email TEXT := 'roshanmahendra@staff.carcrm.com';
  
  v_user_id UUID;
  v_found_phone TEXT;
BEGIN
  -- 1. Smart Search: Find user where phone ends with these 10 digits
  SELECT id, phone INTO v_user_id, v_found_phone 
  FROM auth.users 
  WHERE phone LIKE '%' || search_digits
  LIMIT 1;
  
  -- Debug Output
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '❌ Still no user found ending in %. are you SURE you signed up? Run "SELECT * FROM auth.users" to check.', search_digits;
  END IF;

  RAISE NOTICE '✅ Found User: % (ID: %)', v_found_phone, v_user_id;

  -- 2. Update Auth Identity (Email & Password)
  UPDATE auth.users
  SET 
    email = target_email,
    encrypted_password = crypt(target_pass, gen_salt('bf')),
    email_confirmed_at = now(),
    raw_app_meta_data = raw_app_meta_data || '{"provider": "email"}'::jsonb,
    updated_at = now()
  WHERE id = v_user_id;

  -- 3. Update/Create Staff Credential Record
  INSERT INTO public.staff_credentials (user_id, username, is_locked, failed_login_attempts)
  VALUES (v_user_id, target_username, false, 0)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    username = target_username,
    is_locked = false,
    failed_login_attempts = 0,
    updated_at = now();

  -- 4. Assign PowerDesk Role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'powerdesk')
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE 'SUCCESS! You can now login as %', target_username;
END $$;
