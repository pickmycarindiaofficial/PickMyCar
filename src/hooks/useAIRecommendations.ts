import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export function useAIRecommendations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ai-recommendations', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const response = await fetch(
        `https://tfmaotjdfpqtnsghdwnl.supabase.co/functions/v1/ai-recommendations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ userId: user.id }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch AI recommendations');
      }

      const data = await response.json();
      return data.recommendations || [];
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    retry: 1,
  });
}
