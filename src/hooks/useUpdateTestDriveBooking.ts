import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';

interface UpdateBookingData {
  bookingId: string;
  carId: string;
  dealerId: string;
  preferredDate: string;
  timeSlot: string;
  notes?: string;
  showroomAddress: string;
}

export function useUpdateTestDriveBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateBookingData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const startTime = data.timeSlot.split('-')[0];

      // @ts-ignore - test_drive_bookings not in generated types
      const { data: updated, error } = await supabase
        .from('test_drive_bookings')
        .update({
          preferred_date: data.preferredDate,
          preferred_time: startTime,
          time_slot: data.timeSlot,
          notes: data.notes,
          showroom_address: data.showroomAddress,
          rescheduled_at: new Date().toISOString(),
        })
        .eq('id', data.bookingId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Send WhatsApp notification for rescheduled booking (silent)
      try {
        await supabase.functions.invoke(
          'send-test-drive-whatsapp',
          {
            body: {
              bookingId: data.bookingId,
              type: 'rescheduled'
            }
          }
        );
      } catch (notifyErr) {
        // Silent fail
      }

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-drive-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['existing-test-drive-booking'] });
      toast.success('Test drive rescheduled successfully!', {
        description: 'You will receive a confirmation on WhatsApp'
      });
    },
    onError: (error: any) => {
      toast.error('Failed to reschedule test drive', {
        description: error.message || 'Please try again later'
      });
    },
  });

}
