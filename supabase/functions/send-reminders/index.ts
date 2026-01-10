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
    console.log('⏰ Send Reminders Function - Starting...');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find enquiries that are:
    // 1. Status = 'new'
    // 2. Created more than 24 hours ago
    // 3. No reminder sent yet OR last reminder was sent more than 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: pendingEnquiries, error: queryError } = await supabase
      .from('car_enquiries')
      .select(`
        id,
        dealer_id,
        created_at,
        last_reminder_sent_at,
        reminder_count,
        car_listing:car_listings(
          listing_id,
          brand:brands(name),
          model:models(name),
          variant
        ),
        user:profiles!user_id(
          full_name
        )
      `)
      .eq('status', 'new')
      .lt('created_at', twentyFourHoursAgo)
      .or(`last_reminder_sent_at.is.null,last_reminder_sent_at.lt.${twentyFourHoursAgo}`)
      .limit(50); // Process max 50 reminders per run

    if (queryError) {
      console.error('❌ Error querying enquiries:', queryError);
      throw queryError;
    }

    console.log(`📊 Found ${pendingEnquiries?.length || 0} enquiries needing reminders`);

    if (!pendingEnquiries || pendingEnquiries.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No reminders to send',
          count: 0,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process each enquiry
    const results = await Promise.all(
      pendingEnquiries.map(async (enquiry: any) => {
        try {
          // Create notification for dealer
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: enquiry.dealer_id,
              notification_type: 'lead_reminder',
              title: '⏰ Lead Pending for 24+ Hours',
              message: `Enquiry for ${enquiry.car_listing?.brand?.name} ${enquiry.car_listing?.model?.name} from ${enquiry.user?.full_name || 'Unknown'} is still pending. Please contact them soon!`,
              action_url: `/dashboard/leads?enquiry=${enquiry.id}`,
            });

          if (notificationError) {
            console.error(`❌ Error creating notification for enquiry ${enquiry.id}:`, notificationError);
            throw notificationError;
          }

          // Update enquiry with reminder timestamp
          const { error: updateError } = await supabase
            .from('car_enquiries')
            .update({
              last_reminder_sent_at: new Date().toISOString(),
              reminder_count: (enquiry.reminder_count || 0) + 1,
            })
            .eq('id', enquiry.id);

          if (updateError) {
            console.error(`❌ Error updating enquiry ${enquiry.id}:`, updateError);
            throw updateError;
          }

          console.log(`✅ Reminder sent for enquiry ${enquiry.id}`);
          return { enquiryId: enquiry.id, success: true };
        } catch (error) {
          console.error(`❌ Error processing enquiry ${enquiry.id}:`, error);
          return { enquiryId: enquiry.id, success: false, error: (error as Error).message };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`✅ Reminders processed: ${successCount} success, ${failureCount} failures`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Reminders processed',
        total: results.length,
        successCount,
        failureCount,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error in send-reminders function:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
