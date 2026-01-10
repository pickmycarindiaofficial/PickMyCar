import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

interface TrackInteractionParams {
  interactionType: 'view' | 'save' | 'emi_calculation' | 'dealer_contact' | 'whatsapp_click' | 'call_click' | 'chat_interaction';
  carListingId?: string;
  metadata?: Record<string, any>;
}

export function useTrackInteraction() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ interactionType, carListingId, metadata }: TrackInteractionParams) => {
      if (!user) return null;

      const response = await fetch(
        `https://tfmaotjdfpqtnsghdwnl.supabase.co/functions/v1/track-interaction`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            userId: user.id,
            interactionType,
            carListingId,
            metadata,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to track interaction');
      }

      return response.json();
    },
  });
}
