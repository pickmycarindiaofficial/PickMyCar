// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Model {
  id: string;
  name: string;
  brand_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ModelInput {
  name: string;
  brand_id: string;
  is_active?: boolean;
}

export function useModels() {
  return useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      // @ts-ignore - Table exists but not in generated types
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Model[];
    },
  });
}

export function useModelsByBrand(brandId: string | null) {
  return useQuery({
    queryKey: ['models', brandId],
    queryFn: async () => {
      if (!brandId) return [];
      
      // @ts-ignore - Table exists but not in generated types
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .eq('brand_id', brandId)
        .order('name');
      
      if (error) throw error;
      return data as Model[];
    },
    enabled: !!brandId,
  });
}

export function useCreateModel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: ModelInput) => {
      // @ts-ignore - Table exists but not in generated types
      const { data, error } = await supabase
        .from('models')
        .insert([input])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      toast.success('Model added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add model: ${error.message}`);
    },
  });
}

export function useUpdateModel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: ModelInput & { id: string }) => {
      // @ts-ignore - Table exists but not in generated types
      const { data, error } = await supabase
        .from('models')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      toast.success('Model updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update model: ${error.message}`);
    },
  });
}

export function useDeleteModel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // @ts-ignore - Table exists but not in generated types
      const { error } = await supabase
        .from('models')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['models'] });
      toast.success('Model deactivated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to deactivate model: ${error.message}`);
    },
  });
}
