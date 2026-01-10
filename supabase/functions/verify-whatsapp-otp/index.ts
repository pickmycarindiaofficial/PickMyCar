import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate secure token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

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
    const { verificationId, otp, phoneNumber, purpose } = await req.json();

    if (!verificationId || !otp || !phoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: verificationId, otp, phoneNumber' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Retrieve OTP record
    const { data: otpRecord, error: fetchError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('id', verificationId)
      .eq('phone_number', phoneNumber)
      .single();

    if (fetchError || !otpRecord) {
      console.error('OTP record not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Invalid verification ID or phone number' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already verified
    if (otpRecord.is_verified) {
      return new Response(
        JSON.stringify({ error: 'OTP already used' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'OTP expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check attempts
    if (otpRecord.attempts >= 3) {
      return new Response(
        JSON.stringify({ error: 'Maximum verification attempts exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify OTP
    const isValid = bcrypt.compareSync(otp, otpRecord.otp_hash);

    if (!isValid) {
      await supabase
        .from('otp_verifications')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', verificationId);

      return new Response(
        JSON.stringify({
          error: 'Invalid OTP',
          attemptsRemaining: 3 - (otpRecord.attempts + 1)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark OTP as verified
    await supabase
      .from('otp_verifications')
      .update({ is_verified: true, verified_at: new Date().toISOString() })
      .eq('id', verificationId);

    // If admin login, just return success (AdminAuth handles session)
    if (purpose === 'admin_login' || otpRecord.purpose === 'admin_login') {
      return new Response(
        JSON.stringify({
          success: true,
          verified: true,
          phoneNumber: phoneNumber,
          message: 'OTP verified successfully',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // CUSTOMER LOGIN - Create simple session
    // ============================================

    // Generate session token
    const token = generateToken();
    const tokenHash = await hashToken(token);

    // Create customer session (7 days expiry)
    const { data: sessionData, error: sessionError } = await supabase.rpc('create_customer_session', {
      p_phone_number: phoneNumber,
      p_token_hash: tokenHash,
      p_expires_hours: 168, // 7 days
    });

    if (sessionError) {
      console.error('Error creating customer session:', sessionError);
      return new Response(
        JSON.stringify({
          success: true,
          verified: true,
          phoneNumber: phoneNumber,
          message: 'Phone verified but session creation failed. Please try again.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure customer profile exists
    await supabase.from('customer_profiles').upsert({
      phone_number: phoneNumber,
    }, { onConflict: 'phone_number' });

    console.log('Customer session created:', sessionData);

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        phoneNumber: phoneNumber,
        sessionId: sessionData,
        customerToken: token, // Return raw token to frontend
        message: 'Login successful!',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-whatsapp-otp:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
