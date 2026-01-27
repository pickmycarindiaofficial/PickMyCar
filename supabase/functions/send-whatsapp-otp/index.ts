import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      phoneNumber,
      username,       // NEW: for dealer login
      userType = 'customer',  // NEW: 'customer' | 'dealer' | 'staff'
      purpose = 'login'
    } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let targetPhoneNumber: string;
    let dealerId: string | null = null;
    let dealershipName: string | null = null;

    // ============================================
    // HANDLE DIFFERENT USER TYPES
    // ============================================
    if (userType === 'dealer') {
      // Dealer login: lookup by username
      if (!username) {
        return new Response(
          JSON.stringify({ error: 'Username is required for dealer login' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get dealer info by username
      const { data: dealer, error: dealerError } = await supabase.rpc('get_dealer_by_username', {
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

      targetPhoneNumber = dealerInfo.phone_number.replace(/\D/g, '');
      // Remove country code if present
      if (targetPhoneNumber.startsWith('91') && targetPhoneNumber.length === 12) {
        targetPhoneNumber = targetPhoneNumber.slice(2);
      }
      dealerId = dealerInfo.id;
      dealershipName = dealerInfo.dealership_name;

    } else {
      // Customer/Staff login: use phone number directly
      if (!phoneNumber) {
        return new Response(
          JSON.stringify({ error: 'Phone number is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate phone number format (Indian format)
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return new Response(
          JSON.stringify({ error: 'Invalid phone number format. Must be 10 digits starting with 6-9' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      targetPhoneNumber = phoneNumber;
    }

    // ============================================
    // RATE LIMITING (common for all user types)
    // ============================================
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentOtps, error: otpCheckError } = await supabase
      .from('otp_verifications')
      .select('id')
      .eq('phone_number', targetPhoneNumber)
      .gte('created_at', tenMinutesAgo);

    if (otpCheckError) {
      console.error('Error checking recent OTPs:', otpCheckError);
      throw otpCheckError;
    }

    if (recentOtps && recentOtps.length >= 3) {
      return new Response(
        JSON.stringify({ error: 'Too many OTP requests. Please wait 10 minutes before trying again.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // GENERATE & STORE OTP
    // ============================================
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Generated OTP for ${targetPhoneNumber} (${userType}): ${otp}`);

    const otpHash = bcrypt.hashSync(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { data: otpRecord, error: insertError } = await supabase
      .from('otp_verifications')
      .insert({
        phone_number: targetPhoneNumber,
        otp_hash: otpHash,
        purpose: `${userType}_${purpose}`,
        expires_at: expiresAt,
        // Store dealer_id if applicable
        metadata: dealerId ? { dealer_id: dealerId, username: username } : null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing OTP:', insertError);
      throw insertError;
    }

    // ============================================
    // SEND OTP VIA MSG91 WHATSAPP
    // ============================================
    const msg91AuthKey = Deno.env.get('MSG91_AUTH_KEY');
    const msg91IntegratedNumber = '15557963664';
    const msg91TemplateName = 'otp_verification_pickmycar';
    const msg91Namespace = 'a934f4f8_dcf3_416e_b56a_1e1bfcd230b9';

    if (!msg91AuthKey) {
      console.warn('MSG91_AUTH_KEY not configured - OTP not sent via WhatsApp');
    } else {
      try {
        const components = {
          body_1: { type: 'text', value: otp },
          button_1: { subtype: 'url', type: 'text', value: otp }
        };

        const msg91Response = await fetch('https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'authkey': msg91AuthKey,
          },
          body: JSON.stringify({
            integrated_number: msg91IntegratedNumber,
            content_type: 'template',
            payload: {
              messaging_product: 'whatsapp',
              type: 'template',
              template: {
                name: msg91TemplateName,
                language: { code: 'en', policy: 'deterministic' },
                namespace: msg91Namespace,
                to_and_components: [
                  { to: [`91${targetPhoneNumber}`], components: components }
                ]
              }
            }
          }),
        });

        const msg91Data = await msg91Response.json();
        console.log('MSG91 WhatsApp Response:', msg91Data);
      } catch (msg91Error) {
        console.error('Error sending WhatsApp OTP:', msg91Error);
      }
    }

    // ============================================
    // RETURN RESPONSE
    // ============================================
    const maskedPhone = targetPhoneNumber.slice(0, 2) + '****' + targetPhoneNumber.slice(-4);

    return new Response(
      JSON.stringify({
        success: true,
        verificationId: otpRecord.id,
        expiresAt: expiresAt,
        maskedPhone: maskedPhone,
        message: `OTP sent to ${maskedPhone}`,
        // Include dealer info if applicable
        ...(dealerId ? { dealer_id: dealerId, dealership_name: dealershipName } : {}),
        // Dev mode: include OTP for testing
        ...(Deno.env.get('DEV_MODE') === 'true' ? { dev_otp: otp } : {}),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-whatsapp-otp:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
