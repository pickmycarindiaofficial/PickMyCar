import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';

export interface UpdateDealerProfileData {
  // Branding
  logo_url?: string | null;
  banner_url?: string | null;
  about_text?: string | null;

  // Online Presence
  website_url?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  twitter_url?: string | null;
  google_place_id?: string | null;

  // Business Details
  year_established?: number | null;
  specialization?: string[] | null;
  operating_hours?: any;

  // Achievements
  certifications?: string[] | null;
  awards?: string[] | null;

  // Customer Photos
  customer_photos?: Array<{
    url: string;
    caption?: string;
    uploaded_at?: string;
  }> | null;

  // Visibility Settings
  show_logo?: boolean;
  show_banner?: boolean;
  show_about?: boolean;
  show_social_media?: boolean;
  show_operating_hours?: boolean;
  show_certifications?: boolean;
  show_awards?: boolean;
  show_google_rating?: boolean;
  show_customer_photos?: boolean;
}

export function useUpdateDealerProfile(dealerId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateDealerProfileData) => {
      if (!dealerId) throw new Error('Dealer ID is required');

      // Use RPC to bypass RLS (since OTP users might not have auth.uid())
      const { error } = await supabase.rpc('upsert_dealer_profile_secure', {
        p_id: dealerId,
        p_data: data
      });

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all dealer profile caches
      queryClient.invalidateQueries({ queryKey: ['dealer-profile-management', dealerId] });
      queryClient.invalidateQueries({ queryKey: ['dealer-full-profile', dealerId] });
      queryClient.invalidateQueries({ queryKey: ['dealer-profile', dealerId] });

      // Refetch immediately to ensure consistency
      queryClient.refetchQueries({ queryKey: ['dealer-full-profile', dealerId] });

      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      console.error('Error updating dealer profile:', error);
      toast.error(error.message || 'Failed to update profile');
    },
  });
}
