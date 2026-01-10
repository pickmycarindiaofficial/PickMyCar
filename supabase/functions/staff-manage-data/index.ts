import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-staff-token',
};

// Hash token using SHA-256
async function hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Get the staff token from header
        const staffToken = req.headers.get('x-staff-token');

        if (!staffToken) {
            return new Response(
                JSON.stringify({ error: 'Missing staff authentication token' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Hash the token to match database storage
        const tokenHash = await hashToken(staffToken);

        // Create Supabase client with SERVICE ROLE for elevated permissions
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Validate the staff session
        const { data: sessionData, error: sessionError } = await supabase
            .rpc('validate_staff_session', { p_token_hash: tokenHash });

        if (sessionError) {
            console.error('Session validation error:', sessionError);
            return new Response(
                JSON.stringify({ error: 'Session validation failed' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const session = Array.isArray(sessionData) ? sessionData[0] : sessionData;

        if (!session || !session.is_valid) {
            return new Response(
                JSON.stringify({ error: 'Invalid or expired session. Please login again.' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Parse the request body
        const { action, table, data, id } = await req.json();

        // Validate allowed tables (whitelist for security)
        const allowedTables = ['banners', 'cars', 'leads', 'dealers', 'enquiries', 'test_drives'];
        if (!allowedTables.includes(table)) {
            return new Response(
                JSON.stringify({ error: `Table '${table}' is not allowed` }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Check role-based permissions
        const rolePermissions: Record<string, string[]> = {
            powerdesk: ['banners', 'cars', 'leads', 'dealers', 'enquiries', 'test_drives'],
            website_manager: ['banners', 'cars'],
            dealer: ['cars', 'leads', 'enquiries', 'test_drives'],
            sales: ['leads', 'enquiries', 'test_drives'],
            finance: ['leads', 'enquiries'],
            inspection: ['cars'],
        };

        const allowedTablesForRole = rolePermissions[session.role] || [];
        if (!allowedTablesForRole.includes(table)) {
            return new Response(
                JSON.stringify({ error: `Your role '${session.role}' cannot access '${table}'` }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        let result;
        let error;

        // Perform the requested action
        switch (action) {
            case 'create':
                const insertData = { ...data, created_by: session.staff_id };
                ({ data: result, error } = await supabase.from(table).insert(insertData).select().single());
                break;

            case 'update':
                if (!id) {
                    return new Response(
                        JSON.stringify({ error: 'ID is required for update' }),
                        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    );
                }
                const updateData = { ...data, updated_by: session.staff_id, updated_at: new Date().toISOString() };
                ({ data: result, error } = await supabase.from(table).update(updateData).eq('id', id).select().single());
                break;

            case 'delete':
                if (!id) {
                    return new Response(
                        JSON.stringify({ error: 'ID is required for delete' }),
                        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    );
                }
                ({ error } = await supabase.from(table).delete().eq('id', id));
                result = { deleted: true, id };
                break;

            case 'read':
                if (id) {
                    ({ data: result, error } = await supabase.from(table).select('*').eq('id', id).single());
                } else {
                    ({ data: result, error } = await supabase.from(table).select('*').order('created_at', { ascending: false }));
                }
                break;

            default:
                return new Response(
                    JSON.stringify({ error: `Invalid action: ${action}` }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
        }

        if (error) {
            console.error(`Error in ${action} on ${table}:`, error);
            return new Response(
                JSON.stringify({ error: error.message }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Log the action for audit trail
        await supabase.from('staff_login_audit').insert({
            staff_id: session.staff_id,
            action: `${action}_${table}`,
            details: { id, table, action },
        }).catch(e => console.error('Audit log error:', e));

        return new Response(
            JSON.stringify({ success: true, data: result }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error in staff-manage-data:', error);
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
