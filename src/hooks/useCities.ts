// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface City {
  id: string;
  name: string;
  state: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CityInput {
  name: string;
  state?: string;
  is_active?: boolean;
}

export function useCities() {
  return useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      // @ts-ignore - Table exists but not in generated types
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as City[];
    },
  });
}

export function useCreateCity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CityInput) => {
      // @ts-ignore - Table exists but not in generated types
      const { data, error } = await supabase
        .from('cities')
        .insert([input])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      toast.success('City added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add city: ${error.message}`);
    },
  });
}

export function useUpdateCity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: CityInput & { id: string }) => {
      // @ts-ignore - Table exists but not in generated types
      const { data, error } = await supabase
        .from('cities')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      toast.success('City updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update city: ${error.message}`);
    },
  });
}

export function useDeleteCity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // @ts-ignore - Table exists but not in generated types
      const { error } = await supabase
        .from('cities')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      toast.success('City deactivated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to deactivate city: ${error.message}`);
    },
  });
}
