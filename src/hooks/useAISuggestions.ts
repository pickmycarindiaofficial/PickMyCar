import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface AISuggestion {
  id: string;
  target_id: string;
  suggestion_type: string;
  title: string;
  description: string;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
  expected_impact: string;
  action_label: string;
  action_url: string;
  status: 'pending' | 'acted' | 'dismissed';
  created_at: string;
  acted_at?: string;
  dismissed_at?: string;
  outcome_success?: boolean;
  outcome_notes?: string;
}

export function useAISuggestions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['ai-suggestions', user?.id],
    queryFn: async () => {
      if (!user?.id) return { suggestions: [], stats: { pending: 0, acted: 0, dismissed: 0, successRate: 0 } };

      const { data, error } = await (supabase as any)
        .from('ai_suggestions')
        .select('*')
        .eq('target_id', user.id)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false }) as any;

      if (error) throw error;

      const suggestions: AISuggestion[] = (data || []).map(s => ({
        id: s.id,
        target_id: s.target_id,
        suggestion_type: s.suggestion_type,
        title: s.title,
        description: s.description,
        reasoning: s.reasoning || '',
        priority: s.priority,
        expected_impact: s.expected_impact || '',
        action_label: s.action_label || 'Take Action',
        action_url: s.action_url || '',
        status: s.status,
        created_at: s.created_at,
        acted_at: s.acted_at,
        dismissed_at: s.dismissed_at,
        outcome_success: s.outcome_success,
        outcome_notes: s.outcome_notes
      }));

      const stats = {
        pending: suggestions.filter(s => s.status === 'pending').length,
        acted: suggestions.filter(s => s.status === 'acted').length,
        dismissed: suggestions.filter(s => s.status === 'dismissed').length,
        successRate: suggestions.filter(s => s.outcome_success === true).length / (suggestions.filter(s => s.status === 'acted').length || 1) * 100
      };

      return { suggestions, stats };
    },
    enabled: !!user?.id,
    refetchInterval: 30000
  });

  const actOnSuggestion = useMutation({
    mutationFn: async (suggestionId: string) => {
      const { error } = await (supabase as any)
        .from('ai_suggestions')
        .update({ status: 'acted', acted_at: new Date().toISOString() })
        .eq('id', suggestionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] });
      toast.success('Suggestion marked as acted upon');
    }
  });

  const dismissSuggestion = useMutation({
    mutationFn: async ({ suggestionId, reason }: { suggestionId: string; reason: string }) => {
      const { error } = await (supabase as any)
        .from('ai_suggestions')
        .update({ status: 'dismissed', dismissed_at: new Date().toISOString(), dismissed_reason: reason })
        .eq('id', suggestionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] });
      toast.success('Suggestion dismissed');
    }
  });

  const recordOutcome = useMutation({
    mutationFn: async ({ suggestionId, success, notes }: { suggestionId: string; success: boolean; notes: string }) => {
      const { error } = await (supabase as any)
        .from('ai_suggestions')
        .update({ outcome_success: success, outcome_notes: notes, outcome_recorded: true })
        .eq('id', suggestionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] });
      toast.success('Outcome recorded');
    }
  });

  return { ...query, actOnSuggestion, dismissSuggestion, recordOutcome };
}
