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
    const {
      verificationId,
      otp,
      phoneNumber,
      userType = 'customer',  // NEW: 'customer' | 'dealer'
      purpose
    } = await req.json();

    if (!verificationId || !otp) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: verificationId, otp' }),
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
      .single();

    if (fetchError || !otpRecord) {
      console.error('OTP record not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Invalid verification ID' }),
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

    // Generate session token
    const token = generateToken();
    const tokenHash = await hashToken(token);

    // ============================================
    // HANDLE DIFFERENT USER TYPES
    // ============================================

    // Check if this is a dealer login (from metadata or purpose)
    const isDealer = userType === 'dealer' ||
      otpRecord.purpose?.startsWith('dealer_') ||
      otpRecord.metadata?.dealer_id;

    if (isDealer) {
      // ============================================
      // DEALER LOGIN - Create dealer session
      // ============================================
      const dealerId = otpRecord.metadata?.dealer_id;

      if (!dealerId) {
        return new Response(
          JSON.stringify({ error: 'Dealer ID not found in verification record' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create dealer session
      const { data: sessionId, error: sessionError } = await supabase.rpc('create_dealer_session', {
        p_dealer_id: dealerId,
        p_token_hash: tokenHash,
        p_device_info: req.headers.get('user-agent') || 'Unknown',
        p_ip_address: req.headers.get('x-forwarded-for') || 'Unknown',
      });

      if (sessionError) {
        console.error('Error creating dealer session:', sessionError);
        return new Response(
          JSON.stringify({ error: 'Session creation failed. Please try again.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update dealer last login
      await supabase
        .from('dealer_accounts')
        .update({
          last_login_at: new Date().toISOString(),
          failed_otp_attempts: 0,
          is_locked: false,
          lock_expires_at: null
        })
        .eq('id', dealerId);

      // Get dealer info for response
      const { data: dealerInfo } = await supabase
        .from('dealer_accounts')
        .select('id, username, dealership_name, owner_name, phone_number, email')
        .eq('id', dealerId)
        .single();

      return new Response(
        JSON.stringify({
          success: true,
          verified: true,
          userType: 'dealer',
          token: token,
          sessionId: sessionId,
          dealer: dealerInfo,
          expiresIn: 604800, // 7 days
          message: 'Dealer login successful!',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // ADMIN LOGIN - Just return success
    // ============================================
    if (purpose === 'admin_login' || otpRecord.purpose === 'admin_login') {
      return new Response(
        JSON.stringify({
          success: true,
          verified: true,
          phoneNumber: otpRecord.phone_number,
          message: 'OTP verified successfully',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ============================================
    // CUSTOMER LOGIN - Create customer session
    // ============================================
    const { data: sessionData, error: sessionError } = await supabase.rpc('create_customer_session', {
      p_phone_number: otpRecord.phone_number,
      p_token_hash: tokenHash,
      p_expires_hours: 168, // 7 days
    });

    if (sessionError) {
      console.error('Error creating customer session:', sessionError);
      return new Response(
        JSON.stringify({
          success: true,
          verified: true,
          phoneNumber: otpRecord.phone_number,
          message: 'Phone verified but session creation failed. Please try again.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure customer profile exists
    await supabase.from('customer_profiles').upsert({
      phone_number: otpRecord.phone_number,
    }, { onConflict: 'phone_number' });

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        userType: 'customer',
        phoneNumber: otpRecord.phone_number,
        sessionId: sessionData,
        customerToken: token,
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
