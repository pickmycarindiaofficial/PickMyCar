-- Add dealer_id and permissions to staff_accounts
ALTER TABLE staff_accounts 
ADD COLUMN IF NOT EXISTS dealer_id UUID REFERENCES dealer_profiles(id),
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"manage_listings": false, "view_leads": false}'::jsonb;

-- Update create_staff_account to include dealer_id and permissions
CREATE OR REPLACE FUNCTION create_staff_account(
    p_username TEXT,
    p_password TEXT,
    p_full_name TEXT,
    p_phone_number TEXT,
    p_role TEXT,
    p_email TEXT DEFAULT NULL,
    p_created_by TEXT DEFAULT NULL,
    p_dealer_id UUID DEFAULT NULL,
    p_permissions JSONB DEFAULT '{"manage_listings": false, "view_leads": false}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_staff_id UUID;
    v_result JSONB;
BEGIN
    -- Check if username exists
    IF EXISTS (SELECT 1 FROM staff_accounts WHERE username = p_username) THEN
        RAISE EXCEPTION 'Username already exists';
    END IF;

    -- Insert new staff account
    INSERT INTO staff_accounts (
        username,
        password_hash, -- Assuming password_hash is the column name, heavily implied by verify_staff_password existence
        full_name,
        phone_number,
        role,
        email,
        created_by,
        dealer_id,
        permissions,
        is_active,
        is_locked,
        failed_login_attempts
    ) VALUES (
        p_username,
        crypt(p_password, gen_salt('bf')),
        p_full_name,
        p_phone_number,
        p_role,
        p_email,
        p_created_by,
        p_dealer_id,
        p_permissions,
        true,
        false,
        0
    )
    RETURNING 
        jsonb_build_object(
            'id', id,
            'username', username,
            'full_name', full_name,
            'role', role,
            'dealer_id', dealer_id,
            'permissions', permissions
        ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Function to get staff for a specific dealer
CREATE OR REPLACE FUNCTION get_dealer_staff(p_dealer_id UUID)
RETURNS SETOF staff_accounts
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM staff_accounts 
    WHERE dealer_id = p_dealer_id 
    ORDER BY created_at DESC;
$$;

-- Function to update staff permissions
CREATE OR REPLACE FUNCTION update_staff_permissions(
    p_staff_id UUID,
    p_permissions JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    UPDATE staff_accounts
    SET permissions = p_permissions,
        updated_at = NOW()
    WHERE id = p_staff_id
    RETURNING to_jsonb(staff_accounts.*) INTO v_result;
    
    RETURN v_result;
END;
$$;

-- Function to get staff info for login (returns phone for OTP)
CREATE OR REPLACE FUNCTION get_staff_login_info(p_username TEXT)
RETURNS TABLE (
    id UUID,
    phone_number TEXT,
    is_locked BOOLEAN,
    role TEXT
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT id, phone_number, is_locked, role
    FROM staff_accounts
    WHERE username = p_username AND is_active = true;
$$;
