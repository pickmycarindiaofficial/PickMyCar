import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-staff-token',
};

interface CreateDealerRequest {
    username: string;
    phone_number: string;
    dealership_name: string;
    owner_name: string;
    email?: string;
    business_type?: string;
    gst_number?: string;
    pan_number?: string;
    address?: string;
    city_id?: string;
    state?: string;
    pincode?: string;
    plan_id?: string;
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });

        // Verify staff session (PowerDesk admin)
        const staffToken = req.headers.get('x-staff-token');
        if (!staffToken) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized: Staff token required' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Validate staff session
        const { data: staffSession } = await supabaseAdmin.rpc('get_staff_from_session', {
            p_token_hash: staffToken
        });

        if (!staffSession || staffSession.length === 0) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized: Invalid staff session' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const data: CreateDealerRequest = await req.json();

        // Validate required fields
        if (!data.username || !data.phone_number || !data.dealership_name || !data.owner_name) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: username, phone_number, dealership_name, owner_name' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Check if username already exists
        const { data: existing } = await supabaseAdmin.rpc('get_dealer_by_username', {
            p_username: data.username
        });

        if (existing && existing.length > 0) {
            return new Response(
                JSON.stringify({ error: 'Username already exists' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Create dealer account using security definer function
        const { data: dealerId, error: createError } = await supabaseAdmin.rpc('create_dealer_account', {
            p_username: data.username,
            p_phone_number: data.phone_number,
            p_dealership_name: data.dealership_name,
            p_owner_name: data.owner_name,
            p_email: data.email || null,
            p_business_type: data.business_type || null,
            p_gst_number: data.gst_number || null,
            p_pan_number: data.pan_number || null,
            p_address: data.address || null,
            p_city_id: data.city_id || null,
            p_state: data.state || null,
            p_pincode: data.pincode || null,
            p_plan_id: data.plan_id || null,
            p_created_by: staffSession[0]?.id || null,
        });

        if (createError) {
            console.error('Create dealer error:', createError);
            return new Response(
                JSON.stringify({ error: createError.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({
                success: true,
                dealer_id: dealerId,
                message: `Dealer account created. Username: ${data.username}`
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Unexpected error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
