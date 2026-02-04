import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';
import { MockAISuggestionService } from '@/lib/mock-ai-suggestions';

export interface AISuggestion {
  id: string;
  title: string;
  description: string;
  suggestion_type: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'accepted' | 'dismissed';
  action_label?: string;
  action_url?: string;
  expected_impact?: string;
  created_at: string;
  expires_at?: string;
  metadata?: any;
}

export function useRealtimeAISuggestions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: suggestions = [], isLoading, error } = useQuery({
    queryKey: ['ai-suggestions', user?.id],
    queryFn: async () => {
      // Mock data for stability
      const { suggestions } = await MockAISuggestionService.getSuggestions();
      return suggestions as unknown as AISuggestion[];
    },
    enabled: true,
    refetchInterval: 30000,
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('ai-suggestions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_suggestions',
          filter: `target_id=eq.${user.id}`,
        },
        (payload) => {
          // Invalidate and refetch
          queryClient.invalidateQueries({ queryKey: ['ai-suggestions', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const updateSuggestionStatus = async (
    suggestionId: string,
    status: 'accepted' | 'dismissed',
    dismissReason?: string
  ) => {
    try {
      // Mock success
      await new Promise(resolve => setTimeout(resolve, 500));
      queryClient.invalidateQueries({ queryKey: ['ai-suggestions', user?.id] });
    } catch (error) {
      throw error;
    }
  };


  return {
    suggestions,
    isLoading,
    error,
    updateSuggestionStatus,
  };
}
