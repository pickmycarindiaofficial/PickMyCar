// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Feature {
  id: string;
  name: string;
  category: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
}

export interface FeatureInput {
  name: string;
  category?: string;
  icon?: string;
  is_active?: boolean;
}

export function useFeatures() {
  return useQuery({
    queryKey: ['features'],
    queryFn: async () => {
      // @ts-ignore - Table exists but not in generated types
      const { data, error } = await supabase
        .from('features')
        .select('*')
        .order('category', { nullsFirst: false })
        .order('name');
      
      if (error) throw error;
      return data as Feature[];
    },
  });
}

export function useCreateFeature() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: FeatureInput) => {
      // @ts-ignore - Table exists but not in generated types
      const { data, error } = await supabase
        .from('features')
        .insert([input])
        .select()
        .single();
      
      if (error) {
        // Parse duplicate key errors
        if (error.message.includes('duplicate key') || error.code === '23505') {
          throw new Error('A feature with this name already exists');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      toast.success('Feature added successfully');
    },
    onError: (error: Error) => {
      const message = error.message.includes('already exists') 
        ? error.message 
        : `Failed to add feature: ${error.message}`;
      toast.error(message);
    },
  });
}

export function useUpdateFeature() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: FeatureInput & { id: string }) => {
      // @ts-ignore - Table exists but not in generated types
      const { data, error } = await supabase
        .from('features')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        // Parse duplicate key errors
        if (error.message.includes('duplicate key') || error.code === '23505') {
          throw new Error('A feature with this name already exists');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      toast.success('Feature updated successfully');
    },
    onError: (error: Error) => {
      const message = error.message.includes('already exists') 
        ? error.message 
        : `Failed to update feature: ${error.message}`;
      toast.error(message);
    },
  });
}

export function useDeleteFeature() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // @ts-ignore - Table exists but not in generated types
      const { error } = await supabase
        .from('features')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      toast.success('Feature deactivated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to deactivate feature: ${error.message}`);
    },
  });
}
