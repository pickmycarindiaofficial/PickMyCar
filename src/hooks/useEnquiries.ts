import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CreateEnquiryParams {
  carListingId: string;
  dealerId: string;
  enquiryType: 'whatsapp' | 'call' | 'message' | 'test_drive' | 'finance';
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
}

export function useCreateEnquiry() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateEnquiryParams) => {
      const enquiryData = {
        user_id: user?.id || null,
        car_listing_id: params.carListingId,
        dealer_id: params.dealerId,
        enquiry_type: params.enquiryType,
        guest_name: params.guestName,
        guest_phone: params.guestPhone,
        guest_email: params.guestEmail || user?.email,
        user_agent: navigator.userAgent,
        referrer_url: document.referrer || window.location.href,
      };

      const { data, error } = await (supabase as any)
        .from('car_enquiries')
        .insert(enquiryData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['dealer-leads'] });
      queryClient.invalidateQueries({ queryKey: ['dealer-enquiries'] });
    },
  });
}

export function useUserEnquiries() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-enquiries', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await (supabase as any)
        .from('car_enquiries')
        .select(`
          *,
          car_listing:car_listings(
            id,
            listing_id,
            brand:brands(name),
            model:models(name),
            variant,
            expected_price,
            year_of_make,
            photos
          ),
          dealer:profiles!dealer_id(
            id,
            full_name,
            phone_number
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useDealerEnquiries(dealerId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dealer-enquiries', dealerId || user?.id],
    queryFn: async () => {
      const targetDealerId = dealerId || user?.id;
      if (!targetDealerId) return [];

      const { data, error } = await (supabase as any)
        .from('car_enquiries')
        .select(`
          *,
          car_listing:car_listings(
            id,
            listing_id,
            brand:brands(name),
            model:models(name),
            variant,
            expected_price,
            year_of_make,
            photos
          ),
          user:profiles!user_id(
            id,
            full_name,
            phone_number
          )
        `)
        .eq('dealer_id', targetDealerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!(dealerId || user?.id),
  });
}

export function useUpdateEnquiryStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      enquiryId,
      status,
      dealerNotes
    }: {
      enquiryId: string;
      status: string;
      dealerNotes?: string;
    }) => {
      const { data, error } = await (supabase as any)
        .from('car_enquiries')
        .update({
          status,
          dealer_notes: dealerNotes,
          contacted_at: status === 'contacted' ? new Date().toISOString() : undefined,
          converted_at: status === 'converted' ? new Date().toISOString() : undefined,
        })
        .eq('id', enquiryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealer-enquiries'] });
      queryClient.invalidateQueries({ queryKey: ['enquiries'] });
    },
  });
}
