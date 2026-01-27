import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple hash function for OTP (in production, use bcrypt)
async function hashOTP(otp: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(otp + Deno.env.get('OTP_SECRET'));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const msg91AuthKey = Deno.env.get('MSG91_AUTH_KEY')!;

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false },
        });

        const { username } = await req.json();

        if (!username) {
            return new Response(
                JSON.stringify({ error: 'Username is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Get dealer by username
        const { data: dealer, error: dealerError } = await supabaseAdmin.rpc('get_dealer_by_username', {
            p_username: username
        });

        if (dealerError || !dealer || dealer.length === 0) {
            return new Response(
                JSON.stringify({ error: 'Dealer account not found' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const dealerInfo = dealer[0];

        // Check if account is active
        if (!dealerInfo.is_active) {
            return new Response(
                JSON.stringify({ error: 'Account is deactivated. Contact support.' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Check if account is locked
        if (dealerInfo.is_locked && dealerInfo.lock_expires_at && new Date(dealerInfo.lock_expires_at) > new Date()) {
            const remainingMinutes = Math.ceil((new Date(dealerInfo.lock_expires_at).getTime() - Date.now()) / 60000);
            return new Response(
                JSON.stringify({ error: `Account is locked. Try again in ${remainingMinutes} minutes.` }),
                { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Generate OTP
        const otp = generateOTP();
        const otpHash = await hashOTP(otp);

        // Store OTP hash
        const { error: storeError } = await supabaseAdmin.rpc('store_dealer_otp', {
            p_dealer_id: dealerInfo.id,
            p_otp_hash: otpHash,
        });

        if (storeError) {
            console.error('Store OTP error:', storeError);
            return new Response(
                JSON.stringify({ error: 'Failed to generate OTP' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Send OTP via MSG91 WhatsApp
        const phoneNumber = dealerInfo.phone_number.replace(/\D/g, '');

        try {
            const msg91Response = await fetch('https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authkey': msg91AuthKey,
                },
                body: JSON.stringify({
                    integrated_number: Deno.env.get('MSG91_WHATSAPP_NUMBER'),
                    content_type: 'template',
                    payload: {
                        to: phoneNumber,
                        type: 'template',
                        template: {
                            name: Deno.env.get('MSG91_TEMPLATE_NAME') || 'otp_verification',
                            namespace: Deno.env.get('MSG91_TEMPLATE_NAMESPACE'),
                            language: { code: 'en', policy: 'deterministic' },
                            components: [
                                {
                                    type: 'body',
                                    parameters: [{ type: 'text', text: otp }],
                                },
                            ],
                        },
                    },
                }),
            });

            if (!msg91Response.ok) {
                console.error('MSG91 error:', await msg91Response.text());
                // Continue anyway - in dev, we might not have MSG91 configured
            }
        } catch (whatsappError) {
            console.error('WhatsApp send error:', whatsappError);
            // Continue - for development without MSG91
        }

        // Mask phone number for response
        const maskedPhone = phoneNumber.slice(0, 2) + '****' + phoneNumber.slice(-4);

        return new Response(
            JSON.stringify({
                success: true,
                message: `OTP sent to ${maskedPhone}`,
                dealer_id: dealerInfo.id,
                dealership_name: dealerInfo.dealership_name,
                // For development only - remove in production
                ...(Deno.env.get('DEV_MODE') === 'true' ? { dev_otp: otp } : {}),
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
