import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Session token storage key
const SESSION_TOKEN_KEY = 'pmc_staff_token';

export interface Banner {
    id: string;
    title: string;
    image_url: string;
    link_url?: string;
    display_order: number;
    is_active: boolean;
    start_date: string;
    end_date?: string;
    created_at: string;
}

export interface BannerInput {
    title: string;
    image_url: string;
    link_url?: string;
    display_order?: number;
    is_active?: boolean;
    start_date?: string;
    end_date?: string;
}

// READ operations still use direct Supabase (they're public/read-only)
export function useBanners() {
    return useQuery({
        queryKey: ['banners'],
        queryFn: async () => {
            // @ts-ignore
            const { data, error } = await supabase
                .from('banners')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            return data as Banner[];
        },
    });
}

export function useActiveBanners() {
    return useQuery({
        queryKey: ['banners', 'active'],
        queryFn: async () => {
            const now = new Date().toISOString();
            // @ts-ignore
            const { data, error } = await supabase
                .from('banners')
                .select('*')
                .eq('is_active', true)
                .lte('start_date', now)
                .or(`end_date.is.null,end_date.gte.${now}`)
                .order('display_order', { ascending: true });

            if (error) throw error;
            return data as Banner[];
        },
    });
}

// Helper function for secure staff API calls
async function secureStaffRequest(action: string, data?: any, id?: string) {
    const token = sessionStorage.getItem(SESSION_TOKEN_KEY);

    if (!token) {
        throw new Error('Not authenticated. Please login again.');
    }

    const { data: response, error } = await supabase.functions.invoke('staff-manage-data', {
        body: { action, table: 'banners', data, id },
        headers: { 'x-staff-token': token },
    });

    if (error) throw error;
    if (response?.error) throw new Error(response.error);

    return response?.data;
}

// WRITE operations go through secure Edge Function
export function useCreateBanner() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: BannerInput) => {
            return await secureStaffRequest('create', input);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['banners'] });
            toast.success('Banner created successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to create banner: ${error.message}`);
        },
    });
}

export function useUpdateBanner() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...input }: BannerInput & { id: string }) => {
            return await secureStaffRequest('update', input, id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['banners'] });
            toast.success('Banner updated successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to update banner: ${error.message}`);
        },
    });
}

export function useDeleteBanner() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            return await secureStaffRequest('delete', undefined, id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['banners'] });
            toast.success('Banner deleted successfully');
        },
        onError: (error: Error) => {
            toast.error(`Failed to delete banner: ${error.message}`);
        },
    });
}
