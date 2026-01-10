import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';

interface UpdateStatusData {
  bookingId: string;
  status: 'confirmed' | 'rescheduled' | 'cancelled' | 'completed' | 'no_show';
  notes?: string;
  newDate?: string;
  newTimeSlot?: string;
}

export function useUpdateTestDriveStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateStatusData) => {
      const updateData: any = {
        status: data.status,
      };

      if (data.notes) {
        updateData.dealer_notes = data.notes;
      }

      if (data.status === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString();
        updateData.dealer_confirmed = true;
      }

      if (data.status === 'rescheduled' && data.newDate && data.newTimeSlot) {
        updateData.preferred_date = data.newDate;
        updateData.time_slot = data.newTimeSlot;
        updateData.rescheduled_at = new Date().toISOString();
      }

      const { error } = await (supabase as any)
        .from('test_drive_bookings')
        .update(updateData)
        .eq('id', data.bookingId);

      if (error) {
        throw error;
      }

      // Send WhatsApp notification to customer about status change
      try {
        const { data: bookingDetails } = await (supabase as any)
          .from('test_drive_bookings')
          .select(`
            *,
            car_listings!inner(
              variant,
              brands!car_listings_brand_id_fkey(name),
              models!car_listings_model_id_fkey(name)
            ),
            profiles!test_drive_bookings_user_id_fkey(full_name, phone_number)
          `)
          .eq('id', data.bookingId)
          .single();

        if (bookingDetails && bookingDetails.profiles?.phone_number) {
          const notificationType =
            data.status === 'confirmed' ? 'confirmation' :
              data.status === 'rescheduled' ? 'reschedule' :
                data.status === 'cancelled' ? 'cancellation' : null;

          if (notificationType) {
            await supabase.functions.invoke('send-test-drive-whatsapp', {
              body: {
                bookingId: data.bookingId,
                type: notificationType,
                recipientPhone: bookingDetails.profiles.phone_number,
                recipientName: bookingDetails.profiles.full_name || 'Customer',
                carDetails: {
                  brand: bookingDetails.car_listings.brands?.name || 'Car',
                  model: bookingDetails.car_listings.models?.name || '',
                  variant: bookingDetails.car_listings.variant
                },
                dealerName: 'Dealer',
                appointmentDate: data.newDate || bookingDetails.preferred_date,
                timeSlot: data.newTimeSlot || bookingDetails.time_slot,
                showroomAddress: bookingDetails.showroom_address,
                dealerNotes: data.notes
              }
            });
          }
        }
      } catch (notificationError) {
        // Silent fail - status update was successful
      }


      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['test-drive-bookings'] });

      const statusMessages = {
        confirmed: 'Test drive confirmed',
        rescheduled: 'Test drive rescheduled',
        cancelled: 'Test drive cancelled',
        completed: 'Test drive marked as completed',
        no_show: 'Marked as no-show',
      };

      toast.success(statusMessages[data.status]);
    },
    onError: (error: any) => {
      toast.error('Failed to update booking', {
        description: error.message
      });
    }
  });
}
