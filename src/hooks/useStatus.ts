// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Availability Status
export interface AvailabilityStatus {
  id: string;
  name: string;
  color: string | null;
  is_active: boolean;
  created_at: string;
}

export function useAvailabilityStatus() {
  return useQuery({
    queryKey: ['availability_status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('availability_status')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as AvailabilityStatus[];
    },
  });
}

export function useCreateAvailabilityStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: { name: string; color?: string; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('availability_status')
        .insert([input])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability_status'] });
      toast.success('Availability status added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add availability status: ${error.message}`);
    },
  });
}

export function useUpdateAvailabilityStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name: string; color?: string; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('availability_status')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability_status'] });
      toast.success('Availability status updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update availability status: ${error.message}`);
    },
  });
}

export function useDeleteAvailabilityStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('availability_status')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability_status'] });
      toast.success('Availability status deactivated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to deactivate availability status: ${error.message}`);
    },
  });
}

// Owner Types
export interface OwnerType {
  id: string;
  name: string;
  sort_order: number | null;
  is_active: boolean;
  created_at: string;
}

export function useOwnerTypes() {
  return useQuery({
    queryKey: ['owner_types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('owner_types')
        .select('*')
        .order('sort_order', { nullsFirst: false })
        .order('name');
      
      if (error) throw error;
      return data as OwnerType[];
    },
  });
}

export function useCreateOwnerType() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: { name: string; sort_order?: number; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('owner_types')
        .insert([input])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner_types'] });
      toast.success('Owner type added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add owner type: ${error.message}`);
    },
  });
}

export function useUpdateOwnerType() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name: string; sort_order?: number; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('owner_types')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner_types'] });
      toast.success('Owner type updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update owner type: ${error.message}`);
    },
  });
}

export function useDeleteOwnerType() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('owner_types')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner_types'] });
      toast.success('Owner type deactivated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to deactivate owner type: ${error.message}`);
    },
  });
}
