import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';
import { CarListing, CarListingInput, CarListingWithRelations, ListingStatus, SellerType } from '@/types/car-listing';

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
      // Verify session exists - for OTP dealers, we don't need a Supabase session
      const { data: { session } } = await supabase.auth.getSession();

      // Get current dealer ID if not powerdesk
      let currentDealerId = filters?.seller_id;

      // Pagination settings
      const pageSize = filters?.pageSize || 20;
      const page = filters?.page || 1;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Optimize SELECT: Use the high-performance VIEW
      let query = supabase
        .from('car_listings_detailed' as any)
        .select('*', { count: 'exact' })
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

      // Map back to the structure expected by the frontend (Robust safety checks)
      const mappedData = (data as any[] || []).map(item => ({
        ...item,
        brand: item.brand_id ? { id: item.brand_id, name: item.brand_name, logo_url: item.brand_logo_url } : null,
        model: item.model_id ? { id: item.model_id, name: item.model_name } : null,
        fuel_type: item.fuel_type_id ? { id: item.fuel_type_id, name: item.fuel_type_name } : null,
        transmission: item.transmission_id ? { id: item.transmission_id, name: item.transmission_name } : null,
        body_type: item.body_type_id ? { id: item.body_type_id, name: item.body_type_name } : null,
        owner_type: item.owner_type_id ? { id: item.owner_type_id, name: item.owner_type_name } : null,
        city: item.city_id ? { id: item.city_id, name: item.city_name, state: item.city_state } : null,
        category: item.category_id ? { id: item.category_id, name: item.category_name, badge_color: item.category_badge_color } : null,
        seller: {
          id: item.seller_id,
          username: '',
          full_name: item.unified_seller_name || 'N/A',
          phone_number: item.unified_seller_phone || ''
        },
      }));

      return {
        data: mappedData as unknown as CarListingWithRelations[],
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
        .from('car_listings_detailed' as any)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      const item: any = data;
      return {
        ...item,
        brand: { id: item.brand_id, name: item.brand_name, logo_url: item.brand_logo_url },
        model: { id: item.model_id, name: item.model_name },
        fuel_type: { id: item.fuel_type_id, name: item.fuel_type_name },
        transmission: { id: item.transmission_id, name: item.transmission_name },
        body_type: { id: item.body_type_id, name: item.body_type_name },
        owner_type: { id: item.owner_type_id, name: item.owner_type_name },
        city: { id: item.city_id, name: item.city_name, state: item.city_state },
        category: { id: item.category_id, name: item.category_name, badge_color: item.category_badge_color },
        seller: {
          id: item.seller_id,
          username: '',
          full_name: item.unified_seller_name,
          phone_number: item.unified_seller_phone
        },
      } as unknown as CarListingWithRelations;
    },
    enabled: !!id,
  });
}


// Create listing mutation
export function useCreateCarListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listing: CarListingInput) => {
      // Check Supabase Auth first
      const { data: { user } } = await supabase.auth.getUser();

      // For OTP dealers, check localStorage
      let sellerId = user?.id;
      let isOtpDealer = false;

      if (!sellerId) {
        try {
          const dealerInfoStr = localStorage.getItem('dealer_info');
          if (dealerInfoStr) {
            const dealerInfo = JSON.parse(dealerInfoStr);
            sellerId = dealerInfo.id;
            isOtpDealer = true;
          }
        } catch (e) {
          console.error('Error parsing dealer info:', e);
        }
      }

      if (!sellerId) {
        throw new Error('User not authenticated');
      }

      // Check if dealer (either Supabase auth or OTP)
      let isDealer = isOtpDealer;

      if (!isOtpDealer && user) {
        const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
        isDealer = roles?.some((r: any) => r.role === 'dealer') || false;
      }

      let status: ListingStatus = 'pending_verification';
      let published_at = null;

      if (isDealer && listing.seller_type === 'dealer') {
        // For OTP dealers, use dealer_accounts RPC or check differently
        if (isOtpDealer) {
          // OTP dealers can create listings directly
          status = 'live';
          published_at = new Date().toISOString();
        } else {
          const { data: canCreate } = await supabase.rpc('can_dealer_create_listing', {
            dealer_uuid: sellerId
          });
          if (!canCreate) {
            throw new Error('Listing limit reached. Please upgrade your plan.');
          }
          status = 'live';
          published_at = new Date().toISOString();
        }
      }

      const { data, error } = await supabase
        .from('car_listings')
        .insert([{
          ...listing,
          seller_id: sellerId,
          status,
          published_at
        } as any])
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
      const { data, error } = await (supabase as any)
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
      console.log('🗑️ Starting delete for listing:', id);

      // 1. Fetch listing to get image URLs
      const { data: listing, error: fetchError } = await supabase
        .from('car_listings')
        .select('photos')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching listing before delete:', fetchError);
      }

      // 2. Delete images from storage if they exist
      if (listing?.photos && Array.isArray(listing.photos)) {
        const pathsToRemove: string[] = [];

        listing.photos.forEach((photo: any) => {
          const extractPath = (url: string) => {
            if (!url) return null;
            const match = url.match(/\/car-listings\/(.+)/);
            return match ? match[1] : null;
          };

          const largePath = extractPath(photo.url);
          const mediumPath = extractPath(photo.medium_url);
          const thumbPath = extractPath(photo.thumbnail_url);

          if (largePath) pathsToRemove.push(largePath);
          if (mediumPath) pathsToRemove.push(mediumPath);
          if (thumbPath) pathsToRemove.push(thumbPath);
        });

        if (pathsToRemove.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('car-listings')
            .remove(pathsToRemove);

          if (storageError) {
            console.error('Error deleting images from storage:', storageError);
          }
        }
      }

      // 3. Try RPC function first (bypasses RLS)
      console.log('🗑️ Attempting delete via RPC function...');
      const { data: rpcResult, error: rpcError } = await (supabase as any)
        .rpc('delete_car_listing', { listing_id: id });

      if (!rpcError && rpcResult === true) {
        console.log('✅ Delete successful via RPC function');
        return id;
      }

      if (rpcError) {
        console.warn('⚠️ RPC delete failed, trying direct delete:', rpcError.message);
      }

      // 4. Fallback: Direct delete
      console.log('🗑️ Attempting direct delete...');
      const { error: directError } = await supabase
        .from('car_listings')
        .delete()
        .eq('id', id);

      if (directError) {
        console.error('❌ Direct delete error:', directError);
        throw new Error(`Delete failed: ${directError.message}`);
      }

      // 5. Verify deletion
      const { data: verifyData } = await supabase
        .from('car_listings')
        .select('id')
        .eq('id', id)
        .single();

      if (verifyData) {
        console.error('❌ Listing still exists after delete!');
        throw new Error('Delete failed: Listing still exists. Please run the SQL fix in Supabase.');
      }

      console.log('✅ Verified: Listing deleted successfully');
      return id;
    },
    onSuccess: () => {
      console.log('🔄 Refetching queries after delete...');
      queryClient.refetchQueries({ queryKey: ['car-listings'] });
      queryClient.refetchQueries({ queryKey: ['car-listing-stats'] });
      queryClient.refetchQueries({ queryKey: ['my-car-listings'] });
      queryClient.refetchQueries({ queryKey: ['dealer-listings'] });
      queryClient.invalidateQueries({ queryKey: ['car-listings'] });
      queryClient.invalidateQueries({ queryKey: ['car-listing-stats'] });

      toast.success('Listing deleted successfully!', {
        description: 'The listing and all associated images have been removed.',
      });
    },
    onError: (error: Error) => {
      console.error('❌ Delete mutation error:', error);
      toast.error('Failed to delete listing', {
        description: error.message || 'Please check your permissions and try again.',
      });
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
        .from('car_listings_detailed' as any)
        .select('status');

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
