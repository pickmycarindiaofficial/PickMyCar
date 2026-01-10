import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';
import { CarListing, CarListingInput, CarListingWithRelations } from '@/types/car-listing';

export interface ListingFilters {
  status?: string;
  seller_type?: string;
  seller_id?: string;
  brand_id?: string;
  city_id?: string;
  phone_number?: string;
  page?: number;
  pageSize?: number;
}

interface PaginatedListings {
  data: CarListingWithRelations[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Main listings hook
export function useCarListings(filters?: ListingFilters, options?: { enabled?: boolean }) {

  return useQuery({
    queryKey: ['car-listings', filters],
    queryFn: async () => {
      // Verify session exists
      const { data: { session } } = await supabase.auth.getSession();

      // Pagination settings
      const pageSize = filters?.pageSize || 20;
      const page = filters?.page || 1;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('car_listings')
        .select(`

          *,
          brand:brands(id,name,logo_url),
          model:models(id,name),
          fuel_type:fuel_types(id,name),
          transmission:transmissions(id,name),
          body_type:body_types(id,name),
          owner_type:owner_types(id,name),
          city:cities(id,name,state),
          category:car_categories(id,name,badge_color),
          seller:profiles!car_listings_seller_id_fkey(id,username,full_name,phone_number),
          car_listing_features(
            id,
            features(id, name, category, icon)
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      // Apply filters
      if (filters?.status) query = query.eq('status', filters.status as any);
      if (filters?.seller_type) query = query.eq('seller_type', filters.seller_type as any);
      if (filters?.seller_id) query = query.eq('seller_id', filters.seller_id);
      if (filters?.brand_id) query = query.eq('brand_id', filters.brand_id);
      if (filters?.city_id) query = query.eq('city_id', filters.city_id);

      // Phone number search
      if (filters?.phone_number) {
        const phone = filters.phone_number.trim();
        if (phone) {
          query = query.or(`primary_phone.ilike.%${phone}%,alternate_phone.ilike.%${phone}%`);
        }
      }

      const { data, error, count } = await query;

      if (error) throw error;


      return {
        data: data as unknown as CarListingWithRelations[],
        count: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize)
      } as PaginatedListings;
    },
    enabled: options?.enabled !== false,
    staleTime: 30000, // 30 seconds
    retry: 2,
  });
}

// Single listing hook
export function useCarListing(id: string) {
  return useQuery({
    queryKey: ['car-listing', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('car_listings')
        .select(`
          *,
          brand:brands(id,name,logo_url),
          model:models(id,name),
          fuel_type:fuel_types(id,name),
          transmission:transmissions(id,name),
          body_type:body_types(id,name),
          owner_type:owner_types(id,name),
          city:cities(id,name,state),
          category:car_categories(id,name,badge_color),
          seller:profiles!car_listings_seller_id_fkey(id,username,full_name,phone_number)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as unknown as CarListingWithRelations;
    },
    enabled: !!id,
  });
}


// Create listing mutation
export function useCreateCarListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listing: CarListingInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
      const isDealer = roles?.some((r: any) => r.role === 'dealer');

      let status: ListingStatus = 'pending_verification';
      let published_at = null;

      if (isDealer && listing.seller_type === 'dealer') {
        const { data: canCreate } = await supabase.rpc('can_dealer_create_listing', {
          dealer_uuid: user.id
        });
        if (!canCreate) {
          throw new Error('Listing limit reached. Please upgrade your plan.');
        }
        status = 'live';
        published_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('car_listings')
        .insert([{
          ...listing,
          seller_id: user.id,
          status,
          published_at
        }])
        .select()
        .single();

      if (error) throw error;
      return data as unknown as CarListing;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['car-listings'] });
      queryClient.invalidateQueries({ queryKey: ['dealer-subscription'] });
      toast.success('🎉 Car listing published successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed: ${error.message}`);
    },
  });
}

// Update listing mutation
export function useUpdateCarListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CarListing> & { id: string }) => {
      const { data, error } = await supabase
        .from('car_listings')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          brands(id, name, logo_url),
          models(id, name),
          fuel_types(id, name),
          transmissions(id, name),
          body_types(id, name),
          owner_types(id, name),
          cities(id, name, state),
          car_categories(id, name, badge_color)
        `)
        .single();

      if (error) {
        throw error;
      }

      return data as any;

    },
    onSuccess: (data: any, variables) => {
      // Invalidate ALL related query caches
      queryClient.invalidateQueries({ queryKey: ['car-listings'] });

      queryClient.invalidateQueries({ queryKey: ['my-car-listings'] });
      queryClient.invalidateQueries({ queryKey: ['car-listing', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['car-listing-edit', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['car-listing-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dealer-listings'] });

      // Show detailed success message
      const carName = data.brands?.name && data.models?.name
        ? `${data.brands.name} ${data.models.name} ${data.variant || ''}`.trim()
        : 'Listing';

      toast.success('Listing Updated Successfully!', {
        description: `${carName} has been updated`,
        duration: 3000,
      });
    },

    onError: (error: Error) => {
      console.error('❌ UPDATE MUTATION - onError triggered:', error);
      toast.error('Update Failed', {
        description: error.message || 'Could not update listing. Please try again.',
        duration: 5000,
      });
    },
  });
}

// Delete listing mutation
export function useDeleteCarListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('car_listings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['car-listings'] });
      toast.success('Deleted!');
    },
    onError: (error: Error) => {
      toast.error(`Failed: ${error.message}`);
    }
  });
}

// Update listing status mutation
export function useUpdateListingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, rejection_reason }: { id: string; status: string; rejection_reason?: string }) => {
      const updates: any = { status };
      if (rejection_reason) updates.rejection_reason = rejection_reason;
      const { data, error } = await supabase.from('car_listings').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data as unknown as CarListing;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['car-listings'] });
      queryClient.invalidateQueries({ queryKey: ['car-listing', variables.id] });
      toast.success('Status updated!');
    },
    onError: (error: Error) => {
      toast.error(`Failed: ${error.message}`);
    }
  });
}

// Verify car listing mutation
export function useVerifyCarListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('car_listings').update({
        call_verified: true,
        call_verified_at: new Date().toISOString(),
        call_verified_by: user?.id,
        status: 'verified'
      }).eq('id', id).select().single();
      if (error) throw error;
      return data as unknown as CarListing;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['car-listings'] });
      queryClient.invalidateQueries({ queryKey: ['car-listing', id] });
      toast.success('Verified!');
    },
    onError: (error: Error) => {
      toast.error(`Failed: ${error.message}`);
    }
  });
}

// My listings hook
export function useMyListings() {
  return useQuery({
    queryKey: ['my-car-listings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('car_listings')
        .select('*,brand:brands(id,name,logo_url),model:models(id,name),city:cities(id,name),seller:profiles!car_listings_seller_id_fkey(id,username,full_name,phone_number)')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as CarListingWithRelations[];
    },
  });
}

// Stats hook with filter support
export function useCarListingStats(filters?: Omit<ListingFilters, 'page' | 'pageSize'>) {
  return useQuery({
    queryKey: ['car-listing-stats', filters],
    queryFn: async () => {
      let query = supabase
        .from('car_listings')
        .select('status', { count: 'exact' });

      // Apply same filters as main query (except pagination)
      if (filters?.status) query = query.eq('status', filters.status as any);
      if (filters?.seller_type) query = query.eq('seller_type', filters.seller_type as any);
      if (filters?.seller_id) query = query.eq('seller_id', filters.seller_id);
      if (filters?.brand_id) query = query.eq('brand_id', filters.brand_id);
      if (filters?.city_id) query = query.eq('city_id', filters.city_id);

      // Phone number search
      if (filters?.phone_number) {
        const phone = filters.phone_number.trim();
        if (phone) {
          query = query.or(`primary_phone.ilike.%${phone}%,alternate_phone.ilike.%${phone}%`);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        total: data?.length || 0,
        pending: data?.filter((l: any) => l.status === 'pending_verification').length || 0,
        verified: data?.filter((l: any) => l.status === 'verified').length || 0,
        live: data?.filter((l: any) => l.status === 'live').length || 0,
        rejected: data?.filter((l: any) => l.status === 'rejected').length || 0,
        sold: data?.filter((l: any) => l.status === 'sold').length || 0,
      };
    },
    enabled: filters !== undefined,
    staleTime: 30000,
  });
}

// Activate car listing mutation
export function useActivateCarListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('car_listings')
        .update({ status: 'live' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['car-listings'] });
      queryClient.invalidateQueries({ queryKey: ['car-listing-stats'] });
    },
  });
}

// Deactivate car listing mutation
export function useDeactivateCarListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('car_listings')
        .update({ status: 'verified' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['car-listings'] });
      queryClient.invalidateQueries({ queryKey: ['car-listing-stats'] });
    },
  });
}

// Mark listing as sold mutation
export function useMarkAsSoldListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('car_listings')
        .update({ status: 'sold', sold_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['car-listings'] });
      queryClient.invalidateQueries({ queryKey: ['car-listing-stats'] });
    },
  });
}

// Mark listing as unsold (reactivate to live status)
export function useMarkAsUnsoldListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('car_listings')
        .update({
          status: 'live',
          sold_at: null,
          published_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['car-listings'] });
      queryClient.invalidateQueries({ queryKey: ['car-listing-stats'] });
      toast.success('Listing reactivated and set to live!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reactivate: ${error.message}`);
    }
  });
}
