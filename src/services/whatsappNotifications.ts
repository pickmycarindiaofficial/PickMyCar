import { supabase } from '@/integrations/supabase/client';

/**
 * Send WhatsApp confirmation message to user after enquiry
 */
export async function sendUserConfirmation(
  userId: string,
  carDetails: {
    brand: string;
    model: string;
    variant: string;
    price: number;
    listingId: string;
  },
  dealerName: string
) {
  try {
    // Create notification in database
    const { error: notificationError } = await (supabase as any)
      .from('notifications')
      .insert({
        user_id: userId,
        notification_type: 'enquiry_confirmation',
        title: 'Enquiry Submitted Successfully',
        message: `Your enquiry for ${carDetails.brand} ${carDetails.model} has been sent to ${dealerName}. They will contact you shortly.`,
        action_url: `/dashboard/user/enquiries`,
      });

    if (notificationError) throw notificationError;
    return { success: true };
  } catch (error) {
    throw error;
  }
}

/**
 * Trigger dealer notification via edge function
 */
export async function triggerDealerNotification(
  enquiryId: string,
  dealerId: string,
  carDetails: {
    brand: string;
    model: string;
    variant: string;
    price: number;
    listingId: string;
    photos: any[];
  },
  customerDetails: {
    name: string;
    phone?: string;
    email?: string;
  }
) {
  try {
    // Call edge function to send WhatsApp to dealer
    const { data, error } = await supabase.functions.invoke('notify-dealer', {
      body: {
        enquiryId,
        dealerId,
        carDetails,
        customerDetails,
      },
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    // Don't throw - notification is non-critical
    return { success: false, error };
  }
}

