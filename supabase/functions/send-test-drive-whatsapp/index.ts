import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestDriveNotification {
  bookingId: string;
  type: 'confirmation' | 'reminder' | 'cancellation' | 'reschedule' | 'dealer_notification';
  recipientPhone: string;
  recipientName: string;
  carDetails: {
    brand: string;
    model: string;
    variant: string;
  };
  dealerName?: string;
  customerDetails?: {
    name: string;
    phone: string;
  };
  appointmentDate: string;
  timeSlot: string;
  showroomAddress: string;
  notes?: string;
  dealerNotes?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const notification: TestDriveNotification = await req.json();
    console.log('Processing test drive notification:', notification.type, 'for booking:', notification.bookingId);

    // Using dummy values until real MSG91 credentials are added
    const msg91AuthKey = Deno.env.get('MSG91_AUTH_KEY') || 'DUMMY_AUTH_KEY_REPLACE_LATER';
    const msg91SenderId = Deno.env.get('MSG91_SENDER_ID') || 'DUMMY_SENDER_ID';
    const msg91TemplateId = Deno.env.get('MSG91_WHATSAPP_TEMPLATE_ID') || 'DUMMY_TEMPLATE_ID';

    // Log warning if using dummy values
    if (msg91AuthKey === 'DUMMY_AUTH_KEY_REPLACE_LATER') {
      console.warn('⚠️ Using DUMMY MSG91 credentials - WhatsApp will not actually send');
    }

    // Prepare message based on type
    let message = '';
    switch (notification.type) {
      case 'confirmation':
        message = `Hi ${notification.recipientName}! 🚗\n\nYour test drive for ${notification.carDetails.brand} ${notification.carDetails.model} is confirmed:\n\n📅 Date: ${notification.appointmentDate}\n🕐 Time: ${notification.timeSlot}\n📍 Location: ${notification.showroomAddress}\n\nSee you soon! 👋`;
        break;
      case 'reminder':
        message = `Reminder: Your test drive for ${notification.carDetails.brand} ${notification.carDetails.model} is tomorrow at ${notification.timeSlot}. Location: ${notification.showroomAddress}`;
        break;
      case 'reschedule':
        message = `Your test drive has been rescheduled to ${notification.appointmentDate} at ${notification.timeSlot}. Location: ${notification.showroomAddress}`;
        break;
      case 'cancellation':
        message = `Your test drive for ${notification.carDetails.brand} ${notification.carDetails.model} has been cancelled.`;
        break;
      case 'dealer_notification':
        message = `🚗 New Test Drive Request!\n\nCustomer: ${notification.customerDetails?.name}\nPhone: ${notification.customerDetails?.phone}\nCar: ${notification.carDetails.brand} ${notification.carDetails.model}\nDate: ${notification.appointmentDate}\nTime: ${notification.timeSlot}\nLocation: ${notification.showroomAddress}${notification.notes ? `\nNotes: ${notification.notes}` : ''}\n\nPlease confirm ASAP! ✅`;
        break;
    }

    // Send WhatsApp via MSG91
    const whatsappResponse = await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        'authkey': msg91AuthKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        template_id: msg91TemplateId,
        sender: msg91SenderId,
        short_url: '0',
        mobiles: notification.recipientPhone,
        var1: notification.recipientName,
        var2: `${notification.carDetails.brand} ${notification.carDetails.model}`,
        var3: notification.appointmentDate,
        var4: notification.timeSlot,
        var5: notification.showroomAddress,
        var6: notification.customerDetails?.name || '',
        var7: notification.customerDetails?.phone || '',
        var8: notification.notes || notification.dealerNotes || ''
      })
    });

    const whatsappData = await whatsappResponse.json();
    console.log('MSG91 WhatsApp response:', whatsappData);

    // Update booking confirmation status
    if (notification.type === 'confirmation') {
      const { error: updateError } = await supabaseClient
        .from('test_drive_bookings')
        .update({ whatsapp_confirmation_sent: true })
        .eq('id', notification.bookingId);

      if (updateError) {
        console.error('Error updating booking status:', updateError);
      }
    }

    // Log notification in activity_logs
    await supabaseClient
      .from('activity_logs')
      .insert({
        action: `test_drive_${notification.type}`,
        details: {
          booking_id: notification.bookingId,
          recipient: notification.recipientPhone,
          car: `${notification.carDetails.brand} ${notification.carDetails.model}`,
          status: whatsappResponse.ok ? 'sent' : 'failed'
        }
      });

    return new Response(
      JSON.stringify({
        success: whatsappResponse.ok,
        message: whatsappResponse.ok ? 'Notification sent successfully' : 'Failed to send notification',
        data: whatsappData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: whatsappResponse.ok ? 200 : 500
      }
    );

  } catch (error) {
    console.error('Error in send-test-drive-whatsapp:', error);
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
