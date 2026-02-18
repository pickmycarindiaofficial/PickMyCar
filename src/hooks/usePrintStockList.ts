import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/contexts/AuthContext";
import { safeLocalStorage } from "@/lib/utils";

export interface PrintStockFilters {
  dealerId?: string;
  brands?: string[];
  models?: string[];
  fuelTypes?: string[];
  transmissions?: string[];
  bodyTypes?: string[];
  priceMin?: number;
  priceMax?: number;
  yearMin?: number;
  yearMax?: number;
  statuses?: string[];
}

export function usePrintStockList(filters: PrintStockFilters = {}) {
  const { user, profile, roles } = useAuth();
  const isPowerDesk = roles?.includes('powerdesk');

  // CRITICAL: Robust Dealer ID Retrieval (matches CarListings.tsx)
  let currentDealerId = user?.id;
  if (!currentDealerId) {
    try {
      const dealerInfoStr = safeLocalStorage.getItem('dealer_info');
      if (dealerInfoStr) {
        const dealerInfo = JSON.parse(dealerInfoStr);
        currentDealerId = dealerInfo.id;
      }
    } catch (e) {
      console.error('Error parsing dealer info:', e);
    }
  }

  // Fallback to profile id if accessible
  if (!currentDealerId && profile?.id) {
    currentDealerId = profile.id;
  }

  return useQuery({
    queryKey: ['print-stock-list', filters, currentDealerId],
    queryFn: async () => {
      // Use the VIEW matching useCarListings.ts for consistency
      let query = (supabase as any)
        .from('car_listings_detailed')
        .select('*');

      // Apply consistent filtering
      if (!isPowerDesk && currentDealerId) {
        query = query.eq('seller_id', currentDealerId);
      } else if (filters.dealerId) {
        query = query.eq('seller_id', filters.dealerId);
      }

      // ... remaining filters will utilize the flat column names from the view (e.g. brand_id, model_id)


      const { data, error } = await query;

      if (error) throw error;
      if (!data) return [];

      // Map view data to nested structure for UI compatibility (Mirroring useCarListings)
      let mappedData = (data as any[] || []).map(item => ({
        ...item,
        brands: item.brand_id ? { id: item.brand_id, name: item.brand_name } : null,
        models: item.model_id ? { id: item.model_id, name: item.model_name } : null,
        fuel_types: item.fuel_type_id ? { id: item.fuel_type_id, name: item.fuel_type_name } : null,
        transmissions: item.transmission_id ? { id: item.transmission_id, name: item.transmission_name } : null,
        body_types: item.body_type_id ? { id: item.body_type_id, name: item.body_type_name } : null,
        owner_types: item.owner_type_id ? { id: item.owner_type_id, name: item.owner_type_name } : null,
        cities: item.city_id ? { id: item.city_id, name: item.city_name, state: item.city_state } : null,
        car_categories: item.category_id ? { id: item.category_id, name: item.category_name } : null,
        profiles: {
          full_name: item.unified_seller_name || 'N/A',
          phone_number: item.unified_seller_phone || '',
          username: ''
        },
        // IMPORTANT: UI expects these keys for some columns
        listing_id: item.listing_id,
        year_of_make: item.year_of_make,
        kms_driven: item.kms_driven,
        expected_price: item.expected_price,
        status: item.status
      }));

      // Client-side filtering
      if (filters.brands && filters.brands.length > 0) {
        mappedData = mappedData.filter(car =>
          filters.brands?.includes(car.brand_id || '')
        );
      }

      if (filters.models && filters.models.length > 0) {
        mappedData = mappedData.filter(car =>
          filters.models?.includes(car.model_id || '')
        );
      }

      if (filters.fuelTypes && filters.fuelTypes.length > 0) {
        mappedData = mappedData.filter(car =>
          filters.fuelTypes?.includes(car.fuel_type_id || '')
        );
      }

      if (filters.transmissions && filters.transmissions.length > 0) {
        mappedData = mappedData.filter(car =>
          filters.transmissions?.includes(car.transmission_id || '')
        );
      }

      if (filters.bodyTypes && filters.bodyTypes.length > 0) {
        mappedData = mappedData.filter(car =>
          filters.bodyTypes?.includes(car.body_type_id || '')
        );
      }

      if (filters.priceMin !== undefined) {
        mappedData = mappedData.filter(car =>
          Number(car.expected_price) >= filters.priceMin!
        );
      }

      if (filters.priceMax !== undefined) {
        mappedData = mappedData.filter(car =>
          Number(car.expected_price) <= filters.priceMax!
        );
      }

      if (filters.yearMin !== undefined) {
        mappedData = mappedData.filter(car =>
          car.year_of_make >= filters.yearMin!
        );
      }

      if (filters.yearMax !== undefined) {
        mappedData = mappedData.filter(car =>
          car.year_of_make <= filters.yearMax!
        );
      }

      if (filters.statuses && filters.statuses.length > 0) {
        mappedData = mappedData.filter(car =>
          filters.statuses?.includes(car.status)
        );
      }

      return mappedData;
    },
    staleTime: 60000,
  });
}
