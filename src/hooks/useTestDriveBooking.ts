import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';

interface BookingData {
  carId: string;
  dealerId: string;
  preferredDate: string;
  timeSlot: string;
  notes?: string;
  showroomAddress: string;
}

export function useTestDriveBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BookingData) => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Validate dealer exists
        const { data: dealerExists, error: dealerCheckError } = await (supabase as any)
          .from('profiles')
          .select('id')
          .eq('id', data.dealerId)
          .maybeSingle();

        if (dealerCheckError) throw dealerCheckError;
        if (!dealerExists) {
          throw new Error('Dealer not found. This car may no longer be available.');
        }

        // Validate car listing exists and is live
        const { data: carExists, error: carCheckError } = await (supabase as any)
          .from('car_listings')
          .select('id, status')
          .eq('id', data.carId)
          .maybeSingle();

        if (carCheckError) throw carCheckError;
        if (!carExists) {
          throw new Error('Car listing not found. It may have been removed.');
        }
        if (carExists.status !== 'live') {
          throw new Error('This car is no longer available for test drives.');
        }

        // Parse time slot to extract start time (e.g., "10:00-10:30" -> "10:00")
        const startTime = data.timeSlot.split('-')[0];


        // @ts-ignore - test_drive_bookings not in generated types
        const { data: booking, error: bookingError } = await supabase
          // @ts-ignore
          .from('test_drive_bookings')
          .insert({
            // @ts-ignore
            user_id: user.id,
            // @ts-ignore
            car_listing_id: data.carId,
            // @ts-ignore
            dealer_id: data.dealerId,
            // @ts-ignore
            preferred_date: data.preferredDate,
            // @ts-ignore
            preferred_time: startTime,
            // @ts-ignore
            time_slot: data.timeSlot,
            // @ts-ignore
            notes: data.notes,
            // @ts-ignore
            showroom_address: data.showroomAddress,
            // @ts-ignore
            status: 'pending',
          })
          .select()
          .single();

        if (bookingError) {
          console.error('❌ Database error:', bookingError);
          throw bookingError;
        }
        if (!booking) {
          throw new Error('Booking not created');
        }

        // Get car and user details for WhatsApp notification with correct foreign key relationships
        const { data: carDetails, error: carError } = await supabase
          .from('car_listings')
          .select(`
          variant,
          brands!car_listings_brand_id_fkey(name),
          models!car_listings_model_id_fkey(name),
          profiles!car_listings_seller_id_fkey(full_name, phone_number)
        `)
          .eq('id', data.carId)
          .single();

        if (carError) throw carError;
        if (!carDetails) throw new Error('Car details not found');

        const brandName = (carDetails as any).brands?.name || 'Unknown Brand';
        const modelName = (carDetails as any).models?.name || 'Unknown Model';
        const dealerName = (carDetails as any).profiles?.full_name || 'Dealer';
        const dealerPhone = (carDetails as any).profiles?.phone_number;

        // @ts-ignore - profiles not typed
        const { data: profile } = await supabase
          // @ts-ignore
          .from('profiles')
          .select('full_name, phone_number')
          .eq('id', user?.id)
          .maybeSingle();

        if (!profile) throw new Error('User profile not found');

        // Send WhatsApp confirmation to CUSTOMER (silent on errors)
        const { error: customerWhatsappError } = await supabase.functions.invoke('send-test-drive-whatsapp', {
          body: {
            bookingId: (booking as any).id,
            type: 'confirmation',
            recipientPhone: profile.phone_number,
            recipientName: profile.full_name || 'Customer',
            carDetails: {
              brand: brandName,
              model: modelName,
              variant: (carDetails as any).variant
            },
            dealerName: dealerName,
            appointmentDate: data.preferredDate,
            timeSlot: data.timeSlot,
            showroomAddress: data.showroomAddress
          }
        });

        if (!customerWhatsappError) {
          // Update the booking to mark WhatsApp as sent
          await supabase
            // @ts-ignore
            .from('test_drive_bookings')
            // @ts-ignore
            .update({ whatsapp_confirmation_sent: true })
            // @ts-ignore
            .eq('id', (booking as any).id);
        }

        // Send WhatsApp notification to DEALER (silent on errors)
        if (dealerPhone) {
          await supabase.functions.invoke('send-test-drive-whatsapp', {
            body: {
              bookingId: (booking as any).id,
              type: 'dealer_notification',
              recipientPhone: dealerPhone,
              recipientName: dealerName,
              carDetails: {
                brand: brandName,
                model: modelName,
                variant: (carDetails as any).variant
              },
              customerDetails: {
                name: profile.full_name || 'Customer',
                phone: profile.phone_number
              },
              appointmentDate: data.preferredDate,
              timeSlot: data.timeSlot,
              showroomAddress: data.showroomAddress,
              notes: data.notes
            }
          });
        }

        // Log to activity_logs table
        await (supabase as any).from('activity_logs').insert({
          user_id: user.id,
          entity_type: 'test_drive_booking',
          entity_id: (booking as any).id,
          action: 'created',
          details: {
            car_id: data.carId,
            dealer_id: data.dealerId,
            preferred_date: data.preferredDate,
            time_slot: data.timeSlot
          }
        });

        return booking;
      } catch (error: any) {
        // Log error to activity_logs (silent)


        // Log error to activity_logs
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        await (supabase as any).from('activity_logs').insert({
          user_id: currentUser?.id,
          entity_type: 'test_drive_booking',
          action: 'creation_failed',
          details: {
            error: error.message,
            code: error.code,
            data: data
          }
        });

        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['test-drive-bookings'] });
      toast.success('Test drive booked successfully!', {
        description: 'You will receive a WhatsApp confirmation shortly.'
      });
    },
    onError: (error: any) => {
      console.error('Test Drive Booking Error:', error);

      let errorMessage = 'Failed to book test drive';
      let errorDescription = error.message;

      // Handle specific database errors
      if (error.code === '23503') {
        // Foreign key violation
        if (error.message.includes('dealer_id')) {
          errorDescription = 'Dealer profile not found. Please contact support.';
        } else if (error.message.includes('car_listing_id')) {
          errorDescription = 'Car listing not found. Please refresh the page.';
        } else if (error.message.includes('user_id')) {
          errorDescription = 'User profile not found. Please log out and log in again.';
        }
      } else if (error.code === '23505') {
        // Unique violation - time slot already booked
        errorDescription = 'This time slot is already booked. Please choose another time.';
      } else if (error.message.includes('RLS') || error.message.includes('policy')) {
        errorDescription = 'Permission denied. Please log in again.';
      }

      toast.error(errorMessage, {
        description: errorDescription,
        duration: 5000
      });
    }
  });
}
