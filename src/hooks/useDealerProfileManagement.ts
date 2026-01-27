import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';

export interface DealerProfileManagement {
  // Basic Info
  id: string;
  dealership_name: string;
  business_type: string | null;
  gst_number: string | null;
  pan_number: string | null;
  address: string;
  city_id: string | null;
  city_name: string | null;
  state: string;
  pincode: string;

  // Branding
  logo_url: string | null;
  banner_url: string | null;
  about_text: string | null;

  // Online Presence
  website_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  google_place_id: string | null;
  google_rating: number | null;
  google_review_count: number | null;

  // Business Details
  year_established: number | null;
  specialization: string[] | null;
  operating_hours: any;

  // Achievements
  certifications: string[] | null;
  awards: string[] | null;

  // Customer Photos
  customer_photos: Array<{
    url: string;
    caption?: string;
    uploaded_at?: string;
  }> | null;

  // Visibility Settings
  show_logo: boolean;
  show_banner: boolean;
  show_about: boolean;
  show_social_media: boolean;
  show_operating_hours: boolean;
  show_certifications: boolean;
  show_awards: boolean;
  show_google_rating: boolean;
  show_customer_photos: boolean;

  // Profile Info
  full_name: string;
  username: string;
  phone_number: string | null;
  avatar_url: string | null;
}

export function useDealerProfileManagement(dealerId: string | undefined) {
  return useQuery({
    queryKey: ['dealer-profile-management', dealerId],
    queryFn: async () => {
      if (!dealerId) return null;

      // Try to fetch from profiles first (Supabase auth users)
      let profileData: any = null;
      const { data: supabaseProfile, error: profileError } = await (supabase as any)
        .from('profiles')
        .select('id, full_name, username, phone_number, avatar_url')
        .eq('id', dealerId)
        .maybeSingle();

      if (!profileError && supabaseProfile) {
        profileData = supabaseProfile;
      } else {
        // Fallback: Try dealer_accounts table for OTP dealers
        const { data: dealerAccount, error: dealerAccountError } = await (supabase as any)
          .from('dealer_accounts')
          .select('id, owner_name, dealership_name, phone_number, email')
          .eq('id', dealerId)
          .maybeSingle();

        if (!dealerAccountError && dealerAccount) {
          profileData = {
            id: dealerAccount.id,
            full_name: dealerAccount.owner_name || dealerAccount.dealership_name,
            username: dealerAccount.dealership_name?.toLowerCase().replace(/\s+/g, '_') || 'dealer',
            phone_number: dealerAccount.phone_number,
            avatar_url: null,
          };
        }
      }

      if (!profileData) return null;

      // Fetch dealer profile data with city
      let dealerData: any = null;
      const { data: dpData, error: dealerError } = await (supabase as any)
        .from('dealer_profiles')
        .select(`
          dealership_name,
          business_type,
          gst_number,
          pan_number,
          address,
          city_id,
          state,
          pincode,
          logo_url,
          banner_url,
          about_text,
          website_url,
          facebook_url,
          instagram_url,
          twitter_url,
          google_place_id,
          google_rating,
          google_review_count,
          year_established,
          specialization,
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
          cities(name)
        `)
        .eq('id', dealerId)
        .maybeSingle();

      if (!dealerError && dpData) {
        dealerData = dpData;
      } else {
        // Fallback: Get data from dealer_accounts for OTP dealers (with city join)
        const { data: daData } = await (supabase as any)
          .from('dealer_accounts')
          .select(`
            *,
            cities:city_id(name)
          `)
          .eq('id', dealerId)
          .maybeSingle();

        if (daData) {
          dealerData = {
            dealership_name: daData.dealership_name,
            business_type: daData.business_type || null,
            gst_number: daData.gst_number || null,
            pan_number: daData.pan_number || null,
            address: daData.address || '',
            city_id: daData.city_id || null,
            state: daData.state || '',
            pincode: daData.pincode || '',
            logo_url: null,
            banner_url: null,
            about_text: null,
            website_url: null,
            facebook_url: null,
            instagram_url: null,
            twitter_url: null,
            google_place_id: null,
            google_rating: null,
            google_review_count: null,
            year_established: null,
            specialization: null,
            operating_hours: {},
            certifications: null,
            awards: null,
            customer_photos: [],
            show_logo: true,
            show_banner: true,
            show_about: true,
            show_social_media: true,
            show_operating_hours: true,
            show_certifications: true,
            show_awards: true,
            show_google_rating: true,
            show_customer_photos: true,
            cities: daData.cities || null
          };
        }
      }

      const result: DealerProfileManagement = {
        id: profileData.id,
        full_name: profileData.full_name,
        username: profileData.username,
        phone_number: profileData.phone_number,
        avatar_url: profileData.avatar_url,
        dealership_name: dealerData?.dealership_name || '',
        business_type: dealerData?.business_type || null,
        gst_number: dealerData?.gst_number || null,
        pan_number: dealerData?.pan_number || null,
        address: dealerData?.address || '',
        city_id: dealerData?.city_id || null,
        city_name: (dealerData?.cities as any)?.name || null,
        state: dealerData?.state || '',
        pincode: dealerData?.pincode || '',
        logo_url: dealerData?.logo_url || null,
        banner_url: dealerData?.banner_url || null,
        about_text: dealerData?.about_text || null,
        website_url: dealerData?.website_url || null,
        facebook_url: dealerData?.facebook_url || null,
        instagram_url: dealerData?.instagram_url || null,
        twitter_url: dealerData?.twitter_url || null,
        google_place_id: dealerData?.google_place_id || null,
        google_rating: dealerData?.google_rating || null,
        google_review_count: dealerData?.google_review_count || null,
        year_established: dealerData?.year_established || null,
        specialization: dealerData?.specialization || null,
        operating_hours: dealerData?.operating_hours || {},
        certifications: dealerData?.certifications || null,
        awards: dealerData?.awards || null,
        customer_photos: dealerData?.customer_photos || [],
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

      return result;
    },
    enabled: !!dealerId,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}
