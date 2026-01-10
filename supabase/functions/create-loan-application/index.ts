import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LoanApplicationRequest {
  userId?: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  cityId?: string;
  carListingId: string;
  carBrand: string;
  carModel: string;
  carVariant: string;
  carPrice: number;
  monthlyIncome: number;
  existingLoans: boolean;
  employmentType: string;
  source?: string;
  referrerUrl?: string;
  ipAddress?: string;
  userAgent?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: LoanApplicationRequest = await req.json();

    console.log('📋 Creating loan application:', {
      fullName: body.fullName,
      phoneNumber: body.phoneNumber,
      carBrand: body.carBrand,
      carModel: body.carModel
    });

    // Validate required fields
    if (!body.fullName || !body.phoneNumber || !body.monthlyIncome || !body.carListingId) {
      throw new Error('Missing required fields');
    }

    // Create loan application
    const { data: application, error: createError } = await supabase
      .from('loan_applications')
      .insert({
        user_id: body.userId || null,
        full_name: body.fullName,
        phone_number: body.phoneNumber,
        email: body.email || null,
        city_id: body.cityId || null,
        car_listing_id: body.carListingId,
        car_brand: body.carBrand,
        car_model: body.carModel,
        car_variant: body.carVariant,
        car_price: body.carPrice,
        monthly_income: body.monthlyIncome,
        existing_loans: body.existingLoans,
        employment_type: body.employmentType,
        status: 'pending',
        source: body.source || 'website',
        referrer_url: body.referrerUrl || null,
        ip_address: body.ipAddress || null,
        user_agent: body.userAgent || null,
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating loan application:', createError);
      throw createError;
    }

    console.log('✅ Loan application created:', application.application_number);

    // Send notification to finance team (optional - can be implemented later)
    try {
      const { data: powerdeskUsers } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'powerdesk');

      if (powerdeskUsers && powerdeskUsers.length > 0) {
        const notifications = powerdeskUsers.map(user => ({
          user_id: user.user_id,
          type: 'loan_application',
          title: 'New Loan Application',
          message: `New loan application from ${body.fullName} for ${body.carBrand} ${body.carModel}`,
          data: {
            application_id: application.id,
            application_number: application.application_number,
          },
        }));

        await supabase.from('notifications').insert(notifications);
      }
    } catch (notifError) {
      console.error('⚠️ Failed to send notifications (non-critical):', notifError);
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
    console.error('❌ Error in create-loan-application:', error);
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
