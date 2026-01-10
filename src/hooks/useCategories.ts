// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  badge_color: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CategoryInput {
  name: string;
  description?: string;
  badge_color?: string;
  is_active?: boolean;
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      // @ts-ignore - Table exists but not in generated types
      const { data, error } = await supabase
        .from('car_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as Category[];
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CategoryInput) => {
      // @ts-ignore - Table exists but not in generated types
      const { data, error } = await supabase
        .from('car_categories')
        .insert([input])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add category: ${error.message}`);
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: CategoryInput & { id: string }) => {
      // @ts-ignore - Table exists but not in generated types
      const { data, error } = await supabase
        .from('car_categories')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update category: ${error.message}`);
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // @ts-ignore - Table exists but not in generated types
      const { error } = await supabase
        .from('car_categories')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deactivated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to deactivate category: ${error.message}`);
    },
  });
}
