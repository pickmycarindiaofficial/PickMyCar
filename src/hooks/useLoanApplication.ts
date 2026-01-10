import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CreateLoanApplicationParams {
  fullName: string;
  phoneNumber: string;
  email?: string;
  cityId?: string;
  carListingId: string;
  carBrand: string;
  carModel: string;
  carVariant: string;
  carPrice: number;
  monthlyIncome: number;
  existingLoans: boolean;
  employmentType: string;
}

export function useLoanApplication() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createApplication = useMutation({
    mutationFn: async (params: CreateLoanApplicationParams) => {
      const response = await supabase.functions.invoke('create-loan-application', {
        body: {
          userId: user?.id,
          ...params,
          source: 'website',
          referrerUrl: window.location.href,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-applications'] });
      toast.success('Loan application submitted successfully!');
    },
    onError: (error: any) => {
      console.error('Error creating loan application:', error);
      toast.error(error.message || 'Failed to submit loan application');
    },
  });

  const fetchUserApplications = useQuery({
    queryKey: ['loan-applications', user?.id],
    queryFn: async () => {
      if (!user) return [];

      try {
        const { data, error } = await (supabase as any)
          .from('loan_applications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Error fetching loan applications:', err);
        return [];
      }
    },
    enabled: !!user,
  });

  return {
    createApplication,
    applications: fetchUserApplications.data,
    isLoading: createApplication.isPending || fetchUserApplications.isLoading,
  };
}
