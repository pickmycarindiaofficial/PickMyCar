import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';

interface TrendingItem {
  id: string;
  name: string;
  count: number;
  change?: number;
}

interface TrendingData {
  trendingBrands: {
    bySearches: TrendingItem[];
    byViews: TrendingItem[];
  };
  trendingModels: {
    bySearches: TrendingItem[];
    byViews: TrendingItem[];
  };
}

export function useTrendingData(days: number = 7) {
  return useQuery({
    queryKey: ['trending-data', days],
    queryFn: async (): Promise<TrendingData> => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get trending brands by searches from user_events
      const { data: searchEvents } = await (supabase as any)
        .from('user_events')
        .select('meta, car_id, car_listings!inner(brand_id, brands(id, name))')
        .eq('event', 'search')
        .gte('at', startDate.toISOString());

      // Get trending brands by views from car_listings
      const { data: viewData } = await (supabase as any)
        .from('car_listings')
        .select('brand_id, brands(id, name), view_count')
        .eq('status', 'live')
        .gte('published_at', startDate.toISOString());


      // Get trending models by searches
      const { data: modelSearchEvents } = await (supabase as any)
        .from('user_events')
        .select('meta, car_id, car_listings!inner(model_id, models(id, name), brand_id, brands(name))')
        .eq('event', 'search')
        .gte('at', startDate.toISOString());

      // Get trending models by views
      const { data: modelViewData } = await (supabase as any)
        .from('car_listings')
        .select('model_id, models(id, name), brands(name), view_count')
        .eq('status', 'live')
        .gte('published_at', startDate.toISOString());

      // Aggregate brands by searches
      const brandSearchMap = new Map<string, { name: string; count: number }>();
      searchEvents?.forEach((event: any) => {
        const brandId = event.car_listings?.brand_id;
        const brandName = event.car_listings?.brands?.name;
        if (brandId && brandName) {
          const existing = brandSearchMap.get(brandId) || { name: brandName, count: 0 };
          existing.count += 1;
          brandSearchMap.set(brandId, existing);
        }
      });

      // Aggregate brands by views
      const brandViewMap = new Map<string, { name: string; count: number }>();
      viewData?.forEach((listing: any) => {
        const brandId = listing.brand_id;
        const brandName = listing.brands?.name;
        if (brandId && brandName) {
          const existing = brandViewMap.get(brandId) || { name: brandName, count: 0 };
          existing.count += listing.view_count || 0;
          brandViewMap.set(brandId, existing);
        }
      });

      // Aggregate models by searches
      const modelSearchMap = new Map<string, { name: string; brandName: string; count: number }>();
      modelSearchEvents?.forEach((event: any) => {
        const modelId = event.car_listings?.model_id;
        const modelName = event.car_listings?.models?.name;
        const brandName = event.car_listings?.brands?.name;
        if (modelId && modelName && brandName) {
          const key = `${brandName} ${modelName}`;
          const existing = modelSearchMap.get(key) || { name: modelName, brandName, count: 0 };
          existing.count += 1;
          modelSearchMap.set(key, existing);
        }
      });

      // Aggregate models by views
      const modelViewMap = new Map<string, { name: string; brandName: string; count: number }>();
      modelViewData?.forEach((listing: any) => {
        const modelId = listing.model_id;
        const modelName = listing.models?.name;
        const brandName = listing.brands?.name;
        if (modelId && modelName && brandName) {
          const key = `${brandName} ${modelName}`;
          const existing = modelViewMap.get(key) || { name: modelName, brandName, count: 0 };
          existing.count += listing.view_count || 0;
          modelViewMap.set(key, existing);
        }
      });

      const result = {
        trendingBrands: {
          bySearches: Array.from(brandSearchMap.entries())
            .map(([id, data]) => ({ id, name: data.name, count: data.count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8),
          byViews: Array.from(brandViewMap.entries())
            .map(([id, data]) => ({ id, name: data.name, count: data.count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8),
        },
        trendingModels: {
          bySearches: Array.from(modelSearchMap.entries())
            .map(([id, data]) => ({ id, name: `${data.brandName} ${data.name}`, count: data.count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8),
          byViews: Array.from(modelViewMap.entries())
            .map(([id, data]) => ({ id, name: `${data.brandName} ${data.name}`, count: data.count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8),
        },
      };

      return result;
    },

    refetchInterval: 300000, // 5 minutes
  });
}
