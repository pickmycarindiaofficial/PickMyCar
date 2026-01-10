import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';

export interface MostViewedCar {
  id: string;
  listing_id: string;
  brand: string;
  model: string;
  variant: string;
  year: number;
  price: number;
  view_count: number;
  enquiry_count: number;
  test_drive_count: number;
  published_at: string;
  dealer_id: string;
  dealer_name: string;
  dealer_city: string;
  city: string;
  color: string;
  kms_driven: number;
  fuel_type: string;
  transmission: string;
  photos: any[];
}

export function useMostViewedCars(brandFilter?: string, days: number = 30) {
  return useQuery({
    queryKey: ['most-viewed-cars', brandFilter, days],
    queryFn: async (): Promise<MostViewedCar[]> => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let query = (supabase as any)
        .from('car_listings')
        .select(`
          id,
          listing_id,
          variant,
          year_of_make,
          expected_price,
          view_count,
          enquiry_count,
          published_at,
          seller_id,
          color,
          kms_driven,
          photos,
          brands(name),
          models(name),
          cities(name),
          fuel_types(name),
          transmissions(name),
          dealer_profiles!seller_id(dealership_name, cities(name))
        `)
        .eq('status', 'live')
        .eq('seller_type', 'dealer')
        .gte('published_at', startDate.toISOString())
        .order('view_count', { ascending: false })
        .limit(50);

      if (brandFilter) {
        const { data: brandData } = await (supabase as any)
          .from('brands')
          .select('id')
          .eq('name', brandFilter)
          .single();

        if (brandData) {
          query = query.eq('brand_id', brandData.id);
        }
      }

      const { data: listings, error } = await query;

      if (error) throw error;

      // Get test drive counts for each listing
      const listingIds = listings?.map((l: any) => l.id) || [];
      const { data: testDrives } = await (supabase as any)
        .from('car_enquiries')
        .select('car_listing_id')
        .in('car_listing_id', listingIds)
        .eq('enquiry_type', 'test_drive');

      const testDriveCounts = new Map<string, number>();
      testDrives?.forEach((td: any) => {
        const count = testDriveCounts.get(td.car_listing_id) || 0;
        testDriveCounts.set(td.car_listing_id, count + 1);
      });

      return (listings || []).map((listing: any) => ({
        id: listing.id,
        listing_id: listing.listing_id || 'N/A',
        brand: listing.brands?.name || 'Unknown',
        model: listing.models?.name || 'Unknown',
        variant: listing.variant || '',
        year: listing.year_of_make,
        price: listing.expected_price,
        view_count: listing.view_count || 0,
        enquiry_count: listing.enquiry_count || 0,
        test_drive_count: testDriveCounts.get(listing.id) || 0,
        published_at: listing.published_at,
        dealer_id: listing.seller_id,
        dealer_name: listing.dealer_profiles?.dealership_name || 'Unknown Dealer',
        dealer_city: listing.dealer_profiles?.cities?.name || '',
        city: listing.cities?.name || 'Unknown',
        color: listing.color || '',
        kms_driven: listing.kms_driven || 0,
        fuel_type: listing.fuel_types?.name || '',
        transmission: listing.transmissions?.name || '',
        photos: listing.photos || [],
      }));
    },

    refetchInterval: 300000, // 5 minutes
  });
}
