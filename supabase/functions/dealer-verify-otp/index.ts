import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Must match the hash function in dealer-send-otp
async function hashOTP(otp: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(otp + Deno.env.get('OTP_SECRET'));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateSessionToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

        const { dealer_id, otp } = await req.json();

        if (!dealer_id || !otp) {
            return new Response(
                JSON.stringify({ error: 'dealer_id and otp are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Hash the provided OTP
        const otpHash = await hashOTP(otp);

        // Verify OTP using security definer function
        const { data: isValid, error: verifyError } = await supabaseAdmin.rpc('verify_dealer_otp', {
            p_dealer_id: dealer_id,
            p_otp_hash: otpHash,
        });

        if (verifyError) {
            console.error('Verify OTP error:', verifyError);
            return new Response(
                JSON.stringify({ error: 'Verification failed' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (!isValid) {
            return new Response(
                JSON.stringify({ error: 'Invalid or expired OTP' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Generate session token
        const sessionToken = generateSessionToken();
        const tokenHash = await hashToken(sessionToken);

        // Get client info
        const deviceInfo = req.headers.get('user-agent') || 'Unknown';
        const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'Unknown';

        // Create session
        const { data: sessionId, error: sessionError } = await supabaseAdmin.rpc('create_dealer_session', {
            p_dealer_id: dealer_id,
            p_token_hash: tokenHash,
            p_device_info: deviceInfo,
            p_ip_address: ipAddress,
        });

        if (sessionError) {
            console.error('Create session error:', sessionError);
            return new Response(
                JSON.stringify({ error: 'Failed to create session' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Get dealer info for response
        const { data: dealerInfo } = await supabaseAdmin
            .from('dealer_accounts')
            .select('id, dealership_name, owner_name, phone_number, email')
            .eq('id', dealer_id)
            .single();

        return new Response(
            JSON.stringify({
                success: true,
                token: sessionToken,
                dealer: dealerInfo,
                expires_in: 604800, // 7 days in seconds
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
