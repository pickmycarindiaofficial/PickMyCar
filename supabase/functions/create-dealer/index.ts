import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateDealerRequest {
    dealership_name: string;
    owner_name: string;
    email: string;
    phone_number: string;
    username: string;
    password: string;
    business_type?: string;
    gst_number?: string;
    pan_number?: string;
    address?: string;
    city_id?: string;
    state?: string;
    pincode?: string;
    plan_id: string;
}

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        // Create admin client (bypasses RLS completely)
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        const data: CreateDealerRequest = await req.json();

        // Validate required fields
        if (!data.email || !data.password || !data.owner_name || !data.dealership_name || !data.plan_id) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 1. Create auth user using admin API (bypasses triggers)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: data.email,
            password: data.password,
            email_confirm: true, // Auto-confirm email
            user_metadata: {
                username: data.username,
                full_name: data.owner_name,
                phone_number: data.phone_number,
                role: 'dealer',
            },
        });

        if (authError) {
            console.error('Auth error:', authError);
            return new Response(
                JSON.stringify({ error: authError.message }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (!authData.user) {
            return new Response(
                JSON.stringify({ error: 'Failed to create user' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const userId = authData.user.id;

        // 2. Create profile in profiles table
        const { error: profileError } = await supabaseAdmin.from('profiles').insert({
            id: userId,
            full_name: data.owner_name,
            username: data.username,
            phone_number: data.phone_number,
            role: 'dealer',
            is_active: true,
        });

        if (profileError) {
            console.error('Profile error:', profileError);
            // Rollback: delete the auth user
            await supabaseAdmin.auth.admin.deleteUser(userId);
            return new Response(
                JSON.stringify({ error: 'Failed to create profile: ' + profileError.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 3. Create dealer profile
        const { error: dealerProfileError } = await supabaseAdmin.from('dealer_profiles').insert({
            id: userId,
            dealership_name: data.dealership_name,
            business_type: data.business_type || null,
            gst_number: data.gst_number || null,
            pan_number: data.pan_number || null,
            address: data.address || null,
            city_id: data.city_id || null,
            state: data.state || null,
            pincode: data.pincode || null,
            is_documents_verified: true,
        });

        if (dealerProfileError) {
            console.error('Dealer profile error:', dealerProfileError);
            // Rollback
            await supabaseAdmin.from('profiles').delete().eq('id', userId);
            await supabaseAdmin.auth.admin.deleteUser(userId);
            return new Response(
                JSON.stringify({ error: 'Failed to create dealer profile: ' + dealerProfileError.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 4. Create subscription
        const startsAt = new Date();
        const endsAt = new Date();
        endsAt.setMonth(endsAt.getMonth() + 1);

        const { error: subError } = await supabaseAdmin.from('dealer_subscriptions').insert({
            dealer_id: userId,
            plan_id: data.plan_id,
            status: 'active',
            starts_at: startsAt.toISOString(),
            ends_at: endsAt.toISOString(),
            manually_activated: true,
        });

        if (subError) {
            console.error('Subscription error:', subError);
            // Rollback
            await supabaseAdmin.from('dealer_profiles').delete().eq('id', userId);
            await supabaseAdmin.from('profiles').delete().eq('id', userId);
            await supabaseAdmin.auth.admin.deleteUser(userId);
            return new Response(
                JSON.stringify({ error: 'Failed to create subscription: ' + subError.message }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 5. Add user role
        const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
            user_id: userId,
            role: 'dealer',
        });

        if (roleError) {
            console.error('Role error (non-fatal):', roleError);
            // Non-fatal, continue
        }

        return new Response(
            JSON.stringify({
                success: true,
                user: {
                    id: userId,
                    email: data.email,
                    dealership_name: data.dealership_name
                }
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
