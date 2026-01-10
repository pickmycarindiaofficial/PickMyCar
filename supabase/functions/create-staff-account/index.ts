import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify the caller is a PowerDesk admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has PowerDesk role
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError || !userRoles?.some(r => r.role === 'powerdesk')) {
      return new Response(
        JSON.stringify({ error: 'Only PowerDesk admins can create staff accounts' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { username, email, password, fullName, role, phoneNumber } = await req.json();

    // Validate required fields
    if (!username || !email || !fullName || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: username, email, fullName, role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate role
    const validRoles = ['dealer', 'sales', 'finance', 'inspection', 'website_manager'];
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate username format (alphanumeric, underscore, hyphen, 3-30 chars)
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return new Response(
        JSON.stringify({ error: 'Invalid username format. Use 3-30 alphanumeric characters, underscore, or hyphen.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check if username already exists
    const { data: existingUsername } = await supabaseAdmin
      .from('staff_credentials')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUsername) {
      return new Response(
        JSON.stringify({ error: 'Username already exists' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate temporary password if not provided
    const finalPassword = password || crypto.randomUUID().substring(0, 12);

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: finalPassword,
      email_confirm: true,
      user_metadata: {
        username: username,
        full_name: fullName,
        phone_number: phoneNumber,
        role: role,
      },
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newUserId = authData.user.id;

    // Insert into profiles
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: newUserId,
      username: username,
      full_name: fullName,
      phone_number: phoneNumber,
    });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw profileError;
    }

    // Insert into staff_credentials
    const { error: staffError } = await supabaseAdmin.from('staff_credentials').insert({
      user_id: newUserId,
      username: username,
      must_change_password: !password, // Force change if auto-generated
    });

    if (staffError) {
      console.error('Error creating staff credentials:', staffError);
      // Rollback
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      await supabaseAdmin.from('profiles').delete().eq('id', newUserId);
      throw staffError;
    }

    // Assign role
    const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
      user_id: newUserId,
      role: role,
      assigned_by: user.id,
    });

    if (roleError) {
      console.error('Error assigning role:', roleError);
      // Rollback
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      await supabaseAdmin.from('profiles').delete().eq('id', newUserId);
      await supabaseAdmin.from('staff_credentials').delete().eq('user_id', newUserId);
      throw roleError;
    }

    // Log admin activity
    await supabaseAdmin.from('activity_logs').insert({
      user_id: user.id,
      action: 'staff_account_created',
      entity_type: 'staff_account',
      entity_id: newUserId,
      details: {
        username: username,
        role: role,
        email: email,
        created_by: user.id,
      },
    });

    // Log in admin_login_attempts for audit
    await supabaseAdmin.from('admin_login_attempts').insert({
      user_id: user.id,
      username: username,
      step: 'account_creation',
      success: true,
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
    });

    return new Response(
      JSON.stringify({
        success: true,
        userId: newUserId,
        username: username,
        email: email,
        temporaryPassword: !password ? finalPassword : undefined,
        mustChangePassword: !password,
        message: 'Staff account created successfully',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-staff-account:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
