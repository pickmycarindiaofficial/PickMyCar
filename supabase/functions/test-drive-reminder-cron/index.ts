import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Running test drive reminder cron job...');

    // Get bookings for tomorrow that are confirmed and haven't been reminded
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    const { data: bookings, error: fetchError } = await supabaseClient
      .from('test_drive_bookings')
      .select(`
        id,
        preferred_date,
        time_slot,
        showroom_address,
        user_confirmed,
        dealer_confirmed,
        profiles!test_drive_bookings_user_id_fkey (
          full_name,
          phone_number
        ),
        car_listings!test_drive_bookings_car_listing_id_fkey (
          variant,
          brand_id,
          model_id,
          brands!car_listings_brand_id_fkey (name),
          models!car_listings_model_id_fkey (name),
          profiles!car_listings_seller_id_fkey (
            full_name
          )
        )
      `)
      .eq('preferred_date', tomorrowDate)
      .eq('status', 'confirmed')
      .eq('dealer_confirmed', true)
      .eq('whatsapp_reminder_sent', false);

    if (fetchError) {
      console.error('Error fetching bookings:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${bookings?.length || 0} bookings to remind`);

    const results = [];
    for (const booking of bookings || []) {
      try {
        // Cast booking data to access nested objects properly
        const bookingData = booking as any;
        const profile = bookingData.profiles;
        const carListing = bookingData.car_listings;
        const brand = carListing?.brands;
        const model = carListing?.models;
        const dealerProfile = carListing?.profiles;

        // Send reminder via MSG91
        const reminderResponse = await supabaseClient.functions.invoke('send-test-drive-whatsapp', {
          body: {
            bookingId: bookingData.id,
            type: 'reminder',
            recipientPhone: profile?.phone_number,
            recipientName: profile?.full_name || 'Customer',
            carDetails: {
              brand: brand?.name || 'Car',
              model: model?.name || '',
              variant: carListing?.variant
            },
            dealerName: dealerProfile?.full_name || 'Dealer',
            appointmentDate: bookingData.preferred_date,
            timeSlot: bookingData.time_slot,
            showroomAddress: bookingData.showroom_address
          }
        });

        if (reminderResponse.error) {
          console.error(`Failed to send reminder for booking ${bookingData.id}:`, reminderResponse.error);
          results.push({ booking_id: bookingData.id, status: 'failed', error: reminderResponse.error });
        } else {
          // Mark reminder as sent
          await supabaseClient
            .from('test_drive_bookings')
            .update({ 
              whatsapp_reminder_sent: true,
              reminder_sent_at: new Date().toISOString()
            })
            .eq('id', bookingData.id);

          console.log(`Reminder sent for booking ${bookingData.id}`);
          results.push({ booking_id: bookingData.id, status: 'sent' });
        }
      } catch (error) {
        console.error(`Error processing booking ${(booking as any).id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({ booking_id: (booking as any).id, status: 'error', error: errorMessage });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in test-drive-reminder-cron:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
