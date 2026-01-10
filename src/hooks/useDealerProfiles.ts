import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';

export interface DealerProfileListItem {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  is_active: boolean;
  dealership_name: string;
  city_name: string | null;
  logo_url: string | null;
  banner_url: string | null;
  about_text: string | null;
  operating_hours: any;
  certifications: string[] | null;
  awards: string[] | null;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
  year_established: number | null;
  specialization: string[] | null;
  total_listings: number;
  profile_completion: number;
}

// Calculate profile completion percentage
function calculateProfileCompletion(dealer: any): number {
  let score = 0;
  const weights = {
    basic_info: 20,        // name, city, address (always present from registration)
    business_details: 20,  // year_established, specialization
    media: 20,             // logo_url, banner_url
    about_hours: 15,       // about_text, operating_hours
    social_media: 15,      // 2+ social links
    achievements: 10       // certifications or awards
  };

  // Basic info (always 20% - required during registration)
  score += weights.basic_info;

  // Business details
  if (dealer.year_established) score += weights.business_details / 2;
  if (dealer.specialization && dealer.specialization.length > 0) score += weights.business_details / 2;

  // Media
  if (dealer.logo_url) score += weights.media / 2;
  if (dealer.banner_url) score += weights.media / 2;

  // About & Hours
  if (dealer.about_text && dealer.about_text.length > 50) score += weights.about_hours / 2;
  if (dealer.operating_hours && Object.keys(dealer.operating_hours).length > 0) score += weights.about_hours / 2;

  // Social Media (at least 2 links)
  const socialLinks = [
    dealer.facebook_url,
    dealer.instagram_url,
    dealer.twitter_url,
    dealer.website_url
  ].filter(link => link && link.length > 0);
  if (socialLinks.length >= 2) score += weights.social_media;

  // Achievements
  const hasCerts = dealer.certifications && dealer.certifications.length > 0;
  const hasAwards = dealer.awards && dealer.awards.length > 0;
  if (hasCerts || hasAwards) score += weights.achievements;

  return Math.round(score);
}

export function useDealerProfiles() {
  return useQuery({
    queryKey: ['dealer-profiles-list'],
    queryFn: async () => {
      // First, get all dealer user IDs
      const { data: dealerRoles, error: rolesError } = await (supabase as any)
        .from('user_roles')
        .select('user_id')
        .eq('role', 'dealer');

      if (rolesError) throw rolesError;

      const dealerIds = dealerRoles?.map((r: any) => r.user_id) || [];

      if (dealerIds.length === 0) {
        return [];
      }

      // Fetch profiles with dealer_profiles data
      const { data: profiles, error: profilesError } = await (supabase as any)
        .from('profiles')
        .select(`
          id,
          full_name,
          username,
          avatar_url,
          is_active,
          dealer_profiles!inner(
            dealership_name,
            logo_url,
            banner_url,
            about_text,
            operating_hours,
            certifications,
            awards,
            facebook_url,
            instagram_url,
            twitter_url,
            website_url,
            year_established,
            specialization,
            city_id,
            cities(name)
          )
        `)
        .in('id', dealerIds);

      if (profilesError) throw profilesError;

      // Fetch listing counts for each dealer
      const { data: listingCounts, error: listingsError } = await (supabase as any)
        .from('car_listings')
        .select('seller_id')
        .eq('seller_type', 'dealer')
        .in('status', ['verified', 'live']);

      if (listingsError) throw listingsError;

      // Count listings per dealer
      const listingCountMap: Record<string, number> = {};
      listingCounts?.forEach((listing: any) => {
        listingCountMap[listing.seller_id] = (listingCountMap[listing.seller_id] || 0) + 1;
      });

      // Map and calculate profile completion
      const dealerProfiles: DealerProfileListItem[] = profiles?.map((profile: any) => {
        const dealerProfile = Array.isArray(profile.dealer_profiles) 
          ? profile.dealer_profiles[0] 
          : profile.dealer_profiles;

        return {
          id: profile.id,
          full_name: profile.full_name,
          username: profile.username,
          avatar_url: profile.avatar_url,
          is_active: profile.is_active,
          dealership_name: dealerProfile?.dealership_name || 'N/A',
          city_name: dealerProfile?.cities?.name || null,
          logo_url: dealerProfile?.logo_url || null,
          banner_url: dealerProfile?.banner_url || null,
          about_text: dealerProfile?.about_text || null,
          operating_hours: dealerProfile?.operating_hours || null,
          certifications: dealerProfile?.certifications || null,
          awards: dealerProfile?.awards || null,
          facebook_url: dealerProfile?.facebook_url || null,
          instagram_url: dealerProfile?.instagram_url || null,
          twitter_url: dealerProfile?.twitter_url || null,
          website_url: dealerProfile?.website_url || null,
          year_established: dealerProfile?.year_established || null,
          specialization: dealerProfile?.specialization || null,
          total_listings: listingCountMap[profile.id] || 0,
          profile_completion: calculateProfileCompletion(dealerProfile || {})
        };
      }) || [];

      return dealerProfiles;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
