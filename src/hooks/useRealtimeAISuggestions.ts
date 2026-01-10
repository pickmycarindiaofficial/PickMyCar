import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';

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
      if (!user) return [];

      const { data, error } = await (supabase as any)
        .from('ai_suggestions')
        .select('*')
        .eq('target_id', user.id)
        .in('status', ['pending', 'accepted'])
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false }) as any;

      if (error) throw error;

      return (data || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        suggestion_type: s.suggestion_type,
        priority: s.priority,
        status: s.status,
        action_label: s.action_label,
        action_url: s.action_url,
        expected_impact: s.expected_impact,
        created_at: s.created_at,
        expires_at: s.expires_at,
        metadata: s.metadata,
      })) as AISuggestion[];
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
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
      const updateData: any = {
        status,
        acted_at: new Date().toISOString(),
      };

      if (status === 'dismissed' && dismissReason) {
        updateData.dismissed_at = new Date().toISOString();
        updateData.dismissed_reason = dismissReason;
      }

      const { error } = await (supabase as any)
        .from('ai_suggestions')
        .update(updateData)
        .eq('id', suggestionId) as any;

      if (error) throw error;

      // Invalidate query to refresh data
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
