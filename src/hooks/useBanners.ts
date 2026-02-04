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

// Helper function for Auth check
import { useAuth } from '@/contexts/AuthContext';

// WRITE operations now use direct DB access (since RLS allows it and Edge Functions are down)
export function useCreateBanner() {
    const queryClient = useQueryClient();
    // @ts-ignore
    const { user } = useAuth(); // Check for authenticated session (Dealer/Staff)

    return useMutation({
        mutationFn: async (input: BannerInput) => {
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('banners')
                .insert(input)
                .select()
                .single();

            if (error) throw error;
            return data;
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
    // @ts-ignore
    const { user } = useAuth();

    return useMutation({
        mutationFn: async ({ id, ...input }: BannerInput & { id: string }) => {
            if (!user) throw new Error('Not authenticated');

            const { data, error } = await supabase
                .from('banners')
                .update(input)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
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
    // @ts-ignore
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (id: string) => {
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('banners')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return id;
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
