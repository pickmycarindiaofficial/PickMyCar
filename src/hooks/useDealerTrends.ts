import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';

export interface DealerCar {
  id: string;
  listing_id: string;
  brand: string;
  model: string;
  variant: string;
  view_count: number;
  enquiry_count: number;
  price: number;
  published_at: string;
}

export interface DealerTrend {
  dealer_id: string;
  dealer_name: string;
  dealer_city: string;
  total_views: number;
  total_cars: number;
  total_enquiries: number;
  avg_response_rate: number;
  top_cars: DealerCar[];
}

export function useDealerTrends(days: number = 30) {
  return useQuery({
    queryKey: ['dealer-trends', days],
    queryFn: async (): Promise<DealerTrend[]> => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get all dealer listings with metrics
      const { data: listings, error: listingsError } = await (supabase as any)
        .from('car_listings')
        .select(`
          id,
          listing_id,
          variant,
          expected_price,
          view_count,
          enquiry_count,
          published_at,
          seller_id,
          brands(name),
          models(name),
          dealer_profiles!seller_id(dealership_name, cities(name))
        `)
        .eq('status', 'live')
        .eq('seller_type', 'dealer')
        .gte('published_at', startDate.toISOString())
        .order('view_count', { ascending: false });

      if (listingsError) throw listingsError;

      // Get dealer behavior metrics
      const { data: behaviorMetrics, error: metricsError } = await (supabase as any)
        .from('dealer_behavior_metrics')
        .select('dealer_id, response_rate')
        .is('period_end', null);

      if (metricsError) throw metricsError;

      const responseRateMap = new Map<string, number>();
      behaviorMetrics?.forEach((m: any) => {
        responseRateMap.set(m.dealer_id, m.response_rate || 0);
      });

      // Aggregate by dealer
      const dealerMap = new Map<string, {
        name: string;
        city: string;
        views: number;
        cars: number;
        enquiries: number;
        listings: any[];
      }>();

      listings?.forEach((listing: any) => {
        const dealerId = listing.seller_id;
        const dealerName = listing.dealer_profiles?.dealership_name || 'Unknown';
        const dealerCity = listing.dealer_profiles?.cities?.name || '';

        const existing = dealerMap.get(dealerId) || {
          name: dealerName,
          city: dealerCity,
          views: 0,
          cars: 0,
          enquiries: 0,
          listings: [],
        };

        existing.views += listing.view_count || 0;
        existing.cars += 1;
        existing.enquiries += listing.enquiry_count || 0;
        existing.listings.push(listing);

        dealerMap.set(dealerId, existing);
      });

      // Convert to array and get top 3 cars per dealer
      return Array.from(dealerMap.entries())
        .map(([dealer_id, data]) => ({
          dealer_id,
          dealer_name: data.name,
          dealer_city: data.city,
          total_views: data.views,
          total_cars: data.cars,
          total_enquiries: data.enquiries,
          avg_response_rate: responseRateMap.get(dealer_id) || 0,
          top_cars: data.listings
            .sort((a: any, b: any) => (b.view_count || 0) - (a.view_count || 0))
            .slice(0, 3)
            .map((car: any) => ({
              id: car.id,
              listing_id: car.listing_id || 'N/A',
              brand: car.brands?.name || 'Unknown',
              model: car.models?.name || 'Unknown',
              variant: car.variant || '',
              view_count: car.view_count || 0,
              enquiry_count: car.enquiry_count || 0,
              price: car.expected_price,
              published_at: car.published_at,
            })),
        }))
        .sort((a, b) => b.total_views - a.total_views)
        .slice(0, 20);
    },

    refetchInterval: 300000, // 5 minutes
  });
}
