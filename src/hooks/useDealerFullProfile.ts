import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';

export interface DealerFullProfile {
  id: string;
  full_name: string;
  username: string;
  phone_number: string | null;
  avatar_url: string | null;
  is_active: boolean;
  dealership_name: string;
  business_type: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gst_number: string | null;
  logo_url: string | null;
  banner_url: string | null;
  about_text: string | null;
  specialization: string[] | null;
  year_established: number | null;
  google_place_id: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  operating_hours: any | null;
  certifications: string[] | null;
  awards: string[] | null;
  customer_photos: Array<{
    url: string;
    caption?: string;
    uploaded_at?: string;
  }> | null;
  total_listings: number;
  active_listings: number;
  sold_count: number;
  avg_response_time: string | null;
  customer_satisfaction_score: number | null;
  conversion_rate: number | null;
  show_logo: boolean;
  show_banner: boolean;
  show_about: boolean;
  show_social_media: boolean;
  show_operating_hours: boolean;
  show_certifications: boolean;
  show_awards: boolean;
  show_google_rating: boolean;
  show_customer_photos: boolean;
}

export function useDealerFullProfile(dealerId: string | undefined) {
  return useQuery({
    queryKey: ['dealer-full-profile', dealerId],
    queryFn: async () => {
      if (!dealerId) return null;

      try {
        // 1. Try fetching from Old System (profiles table + dealer_profiles)
        const { data: profileData, error: profileError } = await (supabase as any)
          .from('profiles')
          .select('id, full_name, username, phone_number, avatar_url, is_active')
          .eq('id', dealerId)
          .maybeSingle();

        // 2. Try fetching from Old System (dealer_profiles table)
        const { data: dealerData, error: dealerError } = await (supabase as any)
          .from('dealer_profiles')
          .select(`
            dealership_name,
            business_type,
            address,
            state,
            pincode,
            gst_number,
            logo_url,
            banner_url,
            about_text,
            specialization,
            year_established,
            google_place_id,
            google_rating,
            google_review_count,
            facebook_url,
            instagram_url,
            twitter_url,
            website_url,
            operating_hours,
            certifications,
            awards,
            customer_photos,
            show_logo,
            show_banner,
            show_about,
            show_social_media,
            show_operating_hours,
            show_certifications,
            show_awards,
            show_google_rating,
            show_customer_photos,
            city_id,
            cities(name, state)
          `)
          .eq('id', dealerId)
          .maybeSingle();

        // =========================================================
        // PRIMARY PATH: OLD SYSTEM FOUND
        // =========================================================
        if (dealerData) {
          // ... (Existing Logic for Old System) ...

          // Fetch performance metrics
          const { data: metricsData } = await (supabase as any)
            .from('dealer_performance_metrics')
            .select('*')
            .eq('dealer_id', dealerId)
            .maybeSingle();

          // Count listings
          const { count: totalCount } = await (supabase as any)
            .from('car_listings')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', dealerId)
            .eq('seller_type', 'dealer');

          const { count: activeCount } = await (supabase as any)
            .from('car_listings')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', dealerId)
            .eq('seller_type', 'dealer')
            .in('status', ['live', 'verified']);

          const { count: soldCount } = await (supabase as any)
            .from('car_listings')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', dealerId)
            .eq('seller_type', 'dealer')
            .eq('status', 'sold');

          return {
            id: dealerId,
            full_name: profileData?.full_name || dealerData.dealership_name,
            username: profileData?.username || '',
            phone_number: profileData?.phone_number || null,
            avatar_url: profileData?.avatar_url || dealerData.logo_url || null,
            is_active: profileData?.is_active ?? true,
            dealership_name: dealerData.dealership_name || profileData?.full_name || 'Dealer',
            business_type: dealerData?.business_type || null,
            address: dealerData?.address || '',
            city: (dealerData?.cities as any)?.name || '',
            state: dealerData?.state || (dealerData?.cities as any)?.state || '',
            pincode: dealerData?.pincode || '',
            gst_number: dealerData?.gst_number || null,
            logo_url: dealerData?.logo_url || null,
            banner_url: dealerData?.banner_url || null,
            about_text: dealerData?.about_text || null,
            specialization: dealerData?.specialization || null,
            year_established: dealerData?.year_established || null,
            google_place_id: dealerData?.google_place_id || null,
            google_rating: dealerData?.google_rating || null,
            google_review_count: dealerData?.google_review_count || null,
            facebook_url: dealerData?.facebook_url || null,
            instagram_url: dealerData?.instagram_url || null,
            twitter_url: dealerData?.twitter_url || null,
            website_url: dealerData?.website_url || null,
            operating_hours: dealerData?.operating_hours || null,
            certifications: dealerData?.certifications || null,
            awards: dealerData?.awards || null,
            customer_photos: dealerData?.customer_photos || [],
            total_listings: totalCount || 0,
            active_listings: activeCount || 0,
            sold_count: soldCount || 0,
            avg_response_time: metricsData?.avg_response_time || null,
            customer_satisfaction_score: metricsData?.customer_satisfaction_score || null,
            conversion_rate: metricsData?.conversion_rate || null,
            show_logo: dealerData?.show_logo ?? true,
            show_banner: dealerData?.show_banner ?? true,
            show_about: dealerData?.show_about ?? true,
            show_social_media: dealerData?.show_social_media ?? true,
            show_operating_hours: dealerData?.show_operating_hours ?? true,
            show_certifications: dealerData?.show_certifications ?? true,
            show_awards: dealerData?.show_awards ?? true,
            show_google_rating: dealerData?.show_google_rating ?? true,
            show_customer_photos: dealerData?.show_customer_photos ?? true
          };
        }

        // =========================================================
        // FALLBACK PATH: NEW DEALER SYSTEM (dealer_accounts)
        // =========================================================
        console.log("Checking New Dealer System...");

        const { data: newDealer, error: newSystemError } = await (supabase as any)
          .from('dealer_accounts')
          .select(`
            id,
            dealership_name,
            owner_name,
            phone_number,
            address,
            city_id,
            state,
            pincode,
            gst_number,
            business_type,
            cities(name, state)
          `)
          .eq('id', dealerId)
          .maybeSingle();

        if (newSystemError) {
          console.error("New System Fetch Error:", newSystemError);
        }

        if (newDealer) {
          // Count listings for New System (uses same seller_id)
          const { count: totalCount } = await (supabase as any)
            .from('car_listings')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', dealerId);

          const { count: activeCount } = await (supabase as any)
            .from('car_listings')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', dealerId)
            .in('status', ['live', 'verified']);

          const { count: soldCount } = await (supabase as any)
            .from('car_listings')
            .select('*', { count: 'exact', head: true })
            .eq('seller_id', dealerId)
            .eq('status', 'sold');

          // Map New System Data to Full Profile Interface
          return {
            id: newDealer.id,
            full_name: newDealer.owner_name,
            username: newDealer.phone_number, // User ID or Phone as username
            phone_number: newDealer.phone_number,
            avatar_url: null, // New system doesn't have avatar yet
            is_active: true,
            dealership_name: newDealer.dealership_name,
            business_type: newDealer.business_type,
            address: newDealer.address || '',
            city: (newDealer.cities as any)?.name || 'Unknown City',
            state: newDealer.state || (newDealer.cities as any)?.state || '',
            pincode: newDealer.pincode || '',
            gst_number: newDealer.gst_number,
            logo_url: null,
            banner_url: null,
            about_text: `Welcome to ${newDealer.dealership_name}. We offer a wide range of quality used cars. Contact us for the best deals!`,
            specialization: ['Used Cars'],
            year_established: null,
            google_place_id: null,
            google_rating: null,
            google_review_count: null,
            facebook_url: null,
            instagram_url: null,
            twitter_url: null,
            website_url: null,
            operating_hours: null,
            certifications: null,
            awards: null,
            customer_photos: [],
            total_listings: totalCount || 0,
            active_listings: activeCount || 0,
            sold_count: soldCount || 0,
            avg_response_time: null,
            customer_satisfaction_score: null,
            conversion_rate: null,
            show_logo: true,
            show_banner: true,
            show_about: true,
            show_social_media: false,
            show_operating_hours: true,
            show_certifications: false,
            show_awards: false,
            show_google_rating: false,
            show_customer_photos: false
          };
        }

        // If neither found
        throw new Error('Dealer profile not found in either system');

      } catch (error) {
        console.error('Error in useDealerFullProfile:', error);
        throw error;
      }
    },
    enabled: !!dealerId,
    retry: (failureCount, error: any) => {
      // Don't retry for "not found" or permission errors
      if (error?.message?.includes('not found') ||
        error?.message?.includes('permission') ||
        error?.code === 'PGRST116') {
        return false;
      }
      // Retry up to 2 times for network errors
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
