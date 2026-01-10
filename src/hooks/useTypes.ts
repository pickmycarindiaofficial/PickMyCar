// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Fuel Types
export interface FuelType {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export function useFuelTypes() {
  return useQuery({
    queryKey: ['fuel_types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_types')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as FuelType[];
    },
  });
}

export function useCreateFuelType() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: { name: string; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('fuel_types')
        .insert([input])
        .select()
        .single();
      
      if (error) {
        if (error.message.includes('duplicate key') || error.code === '23505') {
          throw new Error('A fuel type with this name already exists');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel_types'] });
      toast.success('Fuel type added successfully');
    },
    onError: (error: Error) => {
      const message = error.message.includes('already exists') ? error.message : `Failed to add fuel type: ${error.message}`;
      toast.error(message);
    },
  });
}

export function useUpdateFuelType() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name?: string; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('fuel_types')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        if (error.message.includes('duplicate key') || error.code === '23505') {
          throw new Error('A fuel type with this name already exists');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel_types'] });
      toast.success('Fuel type updated successfully');
    },
    onError: (error: Error) => {
      const message = error.message.includes('already exists') ? error.message : `Failed to update fuel type: ${error.message}`;
      toast.error(message);
    },
  });
}

export function useDeleteFuelType() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fuel_types')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel_types'] });
      toast.success('Fuel type deactivated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to deactivate fuel type: ${error.message}`);
    },
  });
}

// Body Types
export interface BodyType {
  id: string;
  name: string;
  icon: string | null;
  is_active: boolean;
  created_at: string;
}

export function useBodyTypes() {
  return useQuery({
    queryKey: ['body_types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('body_types')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as BodyType[];
    },
  });
}

export function useCreateBodyType() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: { name: string; icon?: string; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('body_types')
        .insert([input])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body_types'] });
      toast.success('Body type added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add body type: ${error.message}`);
    },
  });
}

export function useUpdateBodyType() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name: string; icon?: string; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('body_types')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body_types'] });
      toast.success('Body type updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update body type: ${error.message}`);
    },
  });
}

export function useDeleteBodyType() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('body_types')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['body_types'] });
      toast.success('Body type deactivated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to deactivate body type: ${error.message}`);
    },
  });
}

// Transmissions
export interface Transmission {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export function useTransmissions() {
  return useQuery({
    queryKey: ['transmissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transmissions')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Transmission[];
    },
  });
}

export function useCreateTransmission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: { name: string; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('transmissions')
        .insert([input])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transmissions'] });
      toast.success('Transmission added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add transmission: ${error.message}`);
    },
  });
}

export function useUpdateTransmission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; name: string; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('transmissions')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transmissions'] });
      toast.success('Transmission updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update transmission: ${error.message}`);
    },
  });
}

export function useDeleteTransmission() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transmissions')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transmissions'] });
      toast.success('Transmission deactivated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to deactivate transmission: ${error.message}`);
    },
  });
}

// Seat Options
export interface SeatOption {
  id: string;
  seats: number;
  is_active: boolean;
  created_at: string;
}

export function useSeatOptions() {
  return useQuery({
    queryKey: ['seat_options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seat_options')
        .select('*')
        .order('seats');
      
      if (error) throw error;
      return data as SeatOption[];
    },
  });
}

export function useCreateSeatOption() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: { seats: number; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('seat_options')
        .insert([input])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seat_options'] });
      toast.success('Seat option added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add seat option: ${error.message}`);
    },
  });
}

export function useUpdateSeatOption() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; seats: number; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('seat_options')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seat_options'] });
      toast.success('Seat option updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update seat option: ${error.message}`);
    },
  });
}

export function useDeleteSeatOption() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('seat_options')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seat_options'] });
      toast.success('Seat option deactivated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to deactivate seat option: ${error.message}`);
    },
  });
}

// Years
export interface Year {
  id: string;
  year: number;
  is_active: boolean;
  created_at: string;
}

export function useYears() {
  return useQuery({
    queryKey: ['years'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('years')
        .select('*')
        .order('year', { ascending: false });
      
      if (error) throw error;
      return data as Year[];
    },
  });
}

export function useCreateYear() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: { year: number; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('years')
        .insert([input])
        .select()
        .single();
      
      if (error) {
        if (error.message.includes('duplicate key') || error.code === '23505') {
          throw new Error(`Year ${input.year} already exists`);
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['years'] });
      toast.success('Year added successfully');
    },
    onError: (error: Error) => {
      const message = error.message.includes('already exists') ? error.message : `Failed to add year: ${error.message}`;
      toast.error(message);
    },
  });
}

export function useUpdateYear() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; year?: number; is_active?: boolean }) => {
      const { data, error } = await supabase
        .from('years')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        if (error.message.includes('duplicate key') || error.code === '23505') {
          throw new Error(`Year ${input.year} already exists`);
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['years'] });
      toast.success('Year updated successfully');
    },
    onError: (error: Error) => {
      const message = error.message.includes('already exists') ? error.message : `Failed to update year: ${error.message}`;
      toast.error(message);
    },
  });
}

export function useDeleteYear() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('years')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['years'] });
      toast.success('Year deactivated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to deactivate year: ${error.message}`);
    },
  });
}
