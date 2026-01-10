import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// @ts-ignore
import { supabase } from '@/integrations/supabase/client';
import { DealerApplication, DealerApplicationFormData, ApplicationStatus } from '@/types/dealer';
import { toast } from '@/hooks/use-toast';

export function useSubmitDealerApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DealerApplicationFormData) => {
      // @ts-ignore
      const { data: application, error } = await supabase.from('dealer_applications').insert({ ...data, status: 'pending', terms_accepted_at: data.terms_accepted ? new Date().toISOString() : null }).select().single();

      if (error) throw error;
      return application;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealer-applications'] });
      toast({
        title: 'Application submitted',
        description: 'Your dealer application has been submitted successfully. We will review it and contact you soon.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Submission failed',
        description: error.message || 'Failed to submit application',
        variant: 'destructive',
      });
    },
  });
}

export function usePendingApplications() {
  return useQuery({
    queryKey: ['dealer-applications', 'pending'],
    queryFn: async () => {
      // @ts-ignore
      const { data, error } = await supabase.from('dealer_applications').select('*, requested_plan:subscription_plans(display_name, price), city:cities(name, state)').eq('status', 'pending').order('created_at', { ascending: false });

      if (error) throw error;
      return data as DealerApplication[];
    },
  });
}

export function useAllDealerApplications(status?: ApplicationStatus) {
  return useQuery({
    queryKey: ['dealer-applications', status],
    queryFn: async () => {
      // @ts-ignore
      let query = supabase.from('dealer_applications').select('*, requested_plan:subscription_plans(display_name, price), city:cities(name, state)');

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as DealerApplication[];
    },
  });
}

export function useApplicationDetails(id: string | null) {
  return useQuery({
    queryKey: ['dealer-application', id],
    queryFn: async () => {
      if (!id) return null;

      // @ts-ignore
      const { data, error } = await supabase.from('dealer_applications').select('*, requested_plan:subscription_plans(*), city:cities(name, state)').eq('id', id).maybeSingle();

      if (error) throw error;
      return data as DealerApplication;
    },
    enabled: !!id,
  });
}

export function useApproveApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      planId,
      adminNotes,
    }: {
      applicationId: string;
      planId: string;
      adminNotes?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('approve-dealer', {
        body: { applicationId, planId, adminNotes },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealer-applications'] });
      queryClient.invalidateQueries({ queryKey: ['dealers'] });
      toast({
        title: 'Dealer approved',
        description: 'The dealer account has been created successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Approval failed',
        description: error.message || 'Failed to approve dealer',
        variant: 'destructive',
      });
    },
  });
}

export function useRejectApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      reason,
    }: {
      applicationId: string;
      reason: string;
    }) => {
      // @ts-ignore
      const { data, error } = await supabase.from('dealer_applications').update({ status: 'rejected', rejection_reason: reason, reviewed_by: (await supabase.auth.getUser()).data.user?.id, reviewed_at: new Date().toISOString() }).eq('id', applicationId).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealer-applications'] });
      toast({
        title: 'Application rejected',
        description: 'The dealer application has been rejected.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Rejection failed',
        description: error.message || 'Failed to reject application',
        variant: 'destructive',
      });
    },
  });
}

export function usePendingApplicationsCount() {
  return useQuery({
    queryKey: ['dealer-applications-count'],
    queryFn: async () => {
      // @ts-ignore
      const { data, error } = await supabase.rpc('get_pending_applications_count');

      if (error) {
        console.error('Error fetching pending count:', error);
        return 0;
      }

      return data as number;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
