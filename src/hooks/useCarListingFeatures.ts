import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { toast } from 'sonner';

export function useSaveCarListingFeatures() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      carListingId, 
      featureIds 
    }: { 
      carListingId: string; 
      featureIds: string[];
    }) => {
      // Delete existing features
      // @ts-ignore - Table will be created via migration
      const { error: deleteError } = await (supabase as any)
        .from('car_listing_features')
        .delete()
        .eq('car_listing_id', carListingId);
      
      if (deleteError) throw deleteError;
      
      // Insert new features
      if (featureIds.length > 0) {
        // @ts-ignore - Table will be created via migration
        const { error: insertError } = await (supabase as any)
          .from('car_listing_features')
          .insert(
            featureIds.map(featureId => ({
              car_listing_id: carListingId,
              feature_id: featureId,
            }))
          );
        
        if (insertError) throw insertError;
      }
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['car-listings'] });
    },
    onError: (error: Error) => {
      console.error('Error saving features:', error);
      toast.error('Failed to save features');
    },
  });
}
