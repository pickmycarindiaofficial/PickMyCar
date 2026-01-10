import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { enquiryId, dealerId, carDetails, customerDetails } = await req.json();

    console.log('📞 Notify Dealer Function - Processing:', {
      enquiryId,
      dealerId,
      carBrand: carDetails?.brand,
      customerName: customerDetails?.name,
    });

    // Fetch dealer profile with phone number
    const { data: dealerProfile, error: dealerError } = await supabase
      .from('profiles')
      .select('id, full_name, phone_number')
      .eq('id', dealerId)
      .single();

    if (dealerError || !dealerProfile?.phone_number) {
      console.error('❌ Dealer profile not found or no phone:', dealerError);
      return new Response(
        JSON.stringify({ error: 'Dealer contact not available' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format WhatsApp message
    const carInfo = `${carDetails.brand} ${carDetails.model} ${carDetails.variant}`;
    const priceFormatted = `₹${(carDetails.price / 100000).toFixed(2)}L`;
    const customerInfo = `${customerDetails.name}${customerDetails.phone ? ` (${customerDetails.phone})` : ''}`;
    
    const baseUrl = 'https://tfmaotjdfpqtnsghdwnl.supabase.co/functions/v1';
    const contactedUrl = `${baseUrl}/update-enquiry-status?enquiryId=${enquiryId}&status=contacted`;
    const contactSoonUrl = `${baseUrl}/update-enquiry-status?enquiryId=${enquiryId}&status=contact_soon`;

    const whatsappMessage = `🚗 *New Lead Alert!*

*Car:* ${carInfo}
*Price:* ${priceFormatted}
*Listing ID:* ${carDetails.listingId}

*Customer:* ${customerInfo}
${customerDetails.email ? `*Email:* ${customerDetails.email}` : ''}

📲 *Quick Actions:*
✅ Contacted: ${contactedUrl}
⏰ Contact Soon: ${contactSoonUrl}

Reply ASAP to convert this lead!`;

    // Create notification in database
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: dealerId,
        notification_type: 'new_lead',
        title: '🚗 New Lead',
        message: `Enquiry for ${carInfo} from ${customerDetails.name}`,
        action_url: `/dashboard/leads`,
      });

    if (notificationError) {
      console.error('❌ Error creating notification:', notificationError);
    }

    // Note: Actual WhatsApp sending would require WhatsApp Business API integration
    // For now, we log the message and create a notification
    console.log('📱 WhatsApp Message (simulated):', whatsappMessage);
    console.log(`📞 Would send to: ${dealerProfile.phone_number}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Dealer notified successfully',
        dealer: dealerProfile.full_name,
        notificationCreated: !notificationError,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error in notify-dealer function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
