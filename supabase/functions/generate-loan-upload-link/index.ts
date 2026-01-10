import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user is authorized (finance team)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: authData } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (!authData.user) {
      throw new Error('Unauthorized');
    }

    const body = await req.json();
    const { applicationId } = body;

    console.log('🔗 Generating upload link for application:', applicationId);

    // Get application details
    const { data: application, error: fetchError } = await supabase
      .from('loan_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (fetchError || !application) {
      throw new Error('Application not found');
    }

    // Generate secure token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token valid for 7 days

    // Update application with upload token
    const { error: updateError } = await supabase
      .from('loan_applications')
      .update({
        upload_token: token,
        upload_token_expires_at: expiresAt.toISOString(),
        upload_link_sent_at: new Date().toISOString(),
        status: 'document_pending',
      })
      .eq('id', applicationId);

    if (updateError) {
      console.error('❌ Error updating application:', updateError);
      throw updateError;
    }

    // Generate upload URL
    const uploadUrl = `${supabaseUrl.replace('https://', 'https://app.')}/loan-upload/${token}`;

    console.log('✅ Upload link generated:', uploadUrl);

    // TODO: Send WhatsApp message (integrate with your WhatsApp service)
    // const whatsappMessage = `Dear ${application.full_name},\n\nYour loan application ${application.application_number} is being processed.\n\nPlease upload your documents here: ${uploadUrl}\n\nDocuments needed:\n- Aadhaar Card\n- PAN Card\n- Salary Proof\n\nLink valid for 7 days.`;
    
    // For now, just return the link
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          uploadUrl,
          token,
          expiresAt,
          applicationNumber: application.application_number,
          customerName: application.full_name,
          phoneNumber: application.phone_number,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error in generate-loan-upload-link:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
