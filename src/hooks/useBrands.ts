// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Brand {
  id: string;
  name: string;
  logo_url: string | null;
  is_active: boolean;
  is_luxury: boolean;
  sort_order: number;
  created_at: string;
}

export interface BrandInput {
  name: string;
  logo_url?: string;
  is_active?: boolean;
  is_luxury?: boolean;
}

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      // @ts-ignore - Table exists but not in generated types
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      return data as Brand[];
    },
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BrandInput) => {
      // @ts-ignore - Table exists but not in generated types
      const { data, error } = await supabase
        .from('brands')
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add brand: ${error.message}`);
    },
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: BrandInput & { id: string }) => {
      // @ts-ignore - Table exists but not in generated types
      const { data, error } = await supabase
        .from('brands')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update brand: ${error.message}`);
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // @ts-ignore - Table exists but not in generated types
      const { error } = await supabase
        .from('brands')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand deactivated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to deactivate brand: ${error.message}`);
    },
  });
}
