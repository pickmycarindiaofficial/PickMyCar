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

    // Verify authorization
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
    const { applicationId, status, approvedAmount, interestRate, tenureMonths, rejectionReason, notes } = body;

    console.log('🔄 Updating loan application status:', { applicationId, status });

    // Validate status
    const validStatuses = ['new_lead', 'document_pending', 'docs_received', 'bank_underwriting', 'approved', 'rejected', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    // Prepare update data
    const updateData: any = {
      status,
      status_updated_at: new Date().toISOString(),
      status_updated_by: authData.user.id,
    };

    if (status === 'approved' && approvedAmount) {
      updateData.approved_loan_amount = approvedAmount;
      if (interestRate) updateData.interest_rate = interestRate;
      if (tenureMonths) updateData.tenure_months = tenureMonths;
    }

    if (status === 'rejected' && rejectionReason) {
      updateData.rejection_reason = rejectionReason;
    }

    if (notes) {
      updateData.notes = notes;
    }

    // Update application
    const { data: application, error: updateError } = await supabase
      .from('loan_applications')
      .update(updateData)
      .eq('id', applicationId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating application:', updateError);
      throw updateError;
    }

    console.log('✅ Application status updated:', application.application_number);

    // Send notification to user
    if (application.user_id) {
      try {
        let notificationMessage = '';
        
        if (status === 'approved') {
          notificationMessage = `Great news! Your loan application has been approved for ₹${approvedAmount.toLocaleString('en-IN')}`;
        } else if (status === 'rejected') {
          notificationMessage = `Your loan application has been reviewed. Please contact our finance team for details.`;
        } else if (status === 'document_pending') {
          notificationMessage = `Please upload your documents to proceed with your loan application.`;
        } else if (status === 'bank_underwriting') {
          notificationMessage = `Your application is under review by our banking partners.`;
        }

        if (notificationMessage) {
          await supabase.from('notifications').insert({
            user_id: application.user_id,
            type: 'loan_status_update',
            title: `Loan Application Update`,
            message: notificationMessage,
            data: {
              application_id: application.id,
              application_number: application.application_number,
              status,
            },
          });
        }
      } catch (notifError) {
        console.error('⚠️ Failed to send notification (non-critical):', notifError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          applicationId: application.id,
          applicationNumber: application.application_number,
          status: application.status,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Error in update-loan-status:', error);
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
