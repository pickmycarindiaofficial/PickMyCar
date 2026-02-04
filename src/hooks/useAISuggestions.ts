import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { MockAISuggestionService } from '@/lib/mock-ai-suggestions';

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
      // Return mock data for demo/stability purposes
      return await MockAISuggestionService.getSuggestions();
    },
    enabled: true, // Always enabled for demo
    refetchInterval: 30000
  });

  const actOnSuggestion = useMutation({
    mutationFn: async (suggestionId: string) => {
      // Mock success
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      // queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] });
      toast.success('Suggestion marked as acted upon');
    }
  });

  const dismissSuggestion = useMutation({
    mutationFn: async ({ suggestionId, reason }: { suggestionId: string; reason: string }) => {
      // Mock success
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      // queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] });
      toast.success('Suggestion dismissed');
    }
  });

  const recordOutcome = useMutation({
    mutationFn: async ({ suggestionId, success, notes }: { suggestionId: string; success: boolean; notes: string }) => {
      // Mock success
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      // queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] });
      toast.success('Outcome recorded');
    }
  });

  return { ...query, actOnSuggestion, dismissSuggestion, recordOutcome };
}
