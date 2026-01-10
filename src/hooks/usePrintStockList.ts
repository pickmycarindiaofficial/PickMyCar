import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-client";
import { useAuth } from "@/contexts/AuthContext";

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
  const { profile, roles } = useAuth();
  const isPowerDesk = roles?.includes('powerdesk');

  return useQuery({
    queryKey: ['print-stock-list', filters, profile?.id],
    queryFn: async () => {
      let query = (supabase as any)
        .from('car_listings')
        .select(`
          *,
          brands:brand_id(id, name),
          models:model_id(id, name),
          fuel_types:fuel_type_id(id, name),
          transmissions:transmission_id(id, name),
          body_types:body_type_id(id, name),
          owner_types:owner_type_id(id, name),
          cities:city_id(id, name, state),
          car_categories:category_id(id, name),
          profiles:seller_id(full_name, phone_number, username)
        `)
        .eq('seller_type', 'dealer');

      // Role-based filtering
      if (!isPowerDesk) {
        query = query.eq('seller_id', profile?.id);
      } else if (filters.dealerId) {
        query = query.eq('seller_id', filters.dealerId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      if (!data) return [];

      // Client-side filtering
      let filteredData = data;

      if (filters.brands && filters.brands.length > 0) {
        filteredData = filteredData.filter(car => 
          filters.brands?.includes(car.brand_id || '')
        );
      }

      if (filters.models && filters.models.length > 0) {
        filteredData = filteredData.filter(car => 
          filters.models?.includes(car.model_id || '')
        );
      }

      if (filters.fuelTypes && filters.fuelTypes.length > 0) {
        filteredData = filteredData.filter(car => 
          filters.fuelTypes?.includes(car.fuel_type_id || '')
        );
      }

      if (filters.transmissions && filters.transmissions.length > 0) {
        filteredData = filteredData.filter(car => 
          filters.transmissions?.includes(car.transmission_id || '')
        );
      }

      if (filters.bodyTypes && filters.bodyTypes.length > 0) {
        filteredData = filteredData.filter(car => 
          filters.bodyTypes?.includes(car.body_type_id || '')
        );
      }

      if (filters.priceMin !== undefined) {
        filteredData = filteredData.filter(car => 
          Number(car.expected_price) >= filters.priceMin!
        );
      }

      if (filters.priceMax !== undefined) {
        filteredData = filteredData.filter(car => 
          Number(car.expected_price) <= filters.priceMax!
        );
      }

      if (filters.yearMin !== undefined) {
        filteredData = filteredData.filter(car => 
          car.year_of_make >= filters.yearMin!
        );
      }

      if (filters.yearMax !== undefined) {
        filteredData = filteredData.filter(car => 
          car.year_of_make <= filters.yearMax!
        );
      }

      if (filters.statuses && filters.statuses.length > 0) {
        filteredData = filteredData.filter(car => 
          filters.statuses?.includes(car.status)
        );
      }

      return filteredData;
    },
    staleTime: 60000, // 1 minute
  });
}
