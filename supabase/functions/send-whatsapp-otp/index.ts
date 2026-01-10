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
    const { phoneNumber, purpose = 'login' } = await req.json();

    // Validate phone number format (Indian format)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number format. Must be 10 digits starting with 6-9' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Rate limiting: Check recent OTPs for this phone number
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentOtps, error: otpCheckError } = await supabase
      .from('otp_verifications')
      .select('id')
      .eq('phone_number', phoneNumber)
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

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`Generated OTP for ${phoneNumber}: ${otp}`);

    // Hash OTP with bcrypt synchronously to avoid worker issues in Edge Runtime
    const otpHash = bcrypt.hashSync(otp);

    // Store OTP in database
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { data: otpRecord, error: insertError } = await supabase
      .from('otp_verifications')
      .insert({
        phone_number: phoneNumber,
        otp_hash: otpHash,
        purpose: purpose,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing OTP:', insertError);
      throw insertError;
    }

    // Send OTP via MSG91 WhatsApp Business API
    const msg91AuthKey = Deno.env.get('MSG91_AUTH_KEY');
    const msg91IntegratedNumber = '15557963664'; // Your WhatsApp Business number
    const msg91TemplateName = 'otp_verification_pickmycar';
    const msg91Namespace = 'a934f4f8_dcf3_416e_b56a_1e1bfcd230b9';

    if (!msg91AuthKey) {
      console.warn('MSG91_AUTH_KEY not configured - OTP not sent');
    } else {
      try {
        // Construct components based on approved template structure
        // body_1: OTP code
        // button_1: URL button (we'll use the OTP as the URL variable)
        const components = {
          body_1: {
            type: 'text',
            value: otp
          },
          button_1: {
            subtype: 'url',
            type: 'text',
            value: otp
          }
        };

        // Use MSG91 WhatsApp API to send OTP
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
                language: {
                  code: 'en',
                  policy: 'deterministic'
                },
                namespace: msg91Namespace,
                to_and_components: [
                  {
                    to: [`91${phoneNumber}`],
                    components: components
                  }
                ]
              }
            }
          }),
        });

        const msg91Data = await msg91Response.json();
        console.log('MSG91 WhatsApp Response:', msg91Data);

        if (!msg91Response.ok || msg91Data.type === 'error') {
          console.error('MSG91 WhatsApp API error:', msg91Data);
          // Don't fail the request if MSG91 fails - OTP is still stored
        } else {
          console.log('OTP sent successfully via WhatsApp');
        }
      } catch (msg91Error) {
        console.error('Error sending WhatsApp OTP:', msg91Error);
        // Don't fail the request if MSG91 fails
      }
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      action: 'otp_sent',
      entity_type: 'authentication',
      entity_id: otpRecord.id,
      details: {
        phone_number: phoneNumber,
        purpose: purpose,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        verificationId: otpRecord.id,
        expiresAt: expiresAt,
        message: 'OTP sent successfully via WhatsApp',
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
