-- BLOCK 1: VIEW ALL USERS (Run this first!)
SELECT id, phone, role, created_at FROM auth.users ORDER BY created_at DESC;

-- BLOCK 2: PROMOTE USER (Run this after finding your exact phone number above)
DO $$
DECLARE
  -- PASTE THE EXACT PHONE NUMBER FROM BLOCK 1 BELOW
  target_phone TEXT := '+917305004047'; 
  
  target_username TEXT := 'powerdesk_admin';
  v_user_id UUID;
  v_count INTEGER;
BEGIN
  -- Search for the user
  SELECT id INTO v_user_id FROM auth.users WHERE phone = target_phone;
  
  -- If not found, try to help the user by counting users
  IF v_user_id IS NULL THEN
    SELECT count(*) INTO v_count FROM auth.users;
    IF v_count = 0 THEN
      RAISE EXCEPTION '❌ NO USERS FOUND AT ALL. You must Login/Sign-up on the website first!';
    ELSE
      RAISE EXCEPTION '❌ User with phone % not found. Check the "Results" tab after running Block 1 to see the correct format.', target_phone;
    END IF;
  END IF;

  -- 1. Insert into staff_credentials
  INSERT INTO public.staff_credentials (user_id, username)
  VALUES (v_user_id, target_username)
  ON CONFLICT (user_id) DO UPDATE
  SET username = target_username;

  -- 2. Assign 'powerdesk' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'powerdesk')
  ON CONFLICT (user_id, role) DO NOTHING;

  RAISE NOTICE '✅ SUCCESS! User % matches ID %. Promoted to Admin: %', target_phone, v_user_id, target_username;
END $$;
