import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { DealerCostProfile } from '@/types/profit-intelligence';

export function useDealerCostProfile() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const queryKey = ['dealer-cost-profile', user?.id];

    const query = useQuery({
        queryKey,
        queryFn: async (): Promise<DealerCostProfile | null> => {
            if (!user) return null;

            const { data, error } = await supabase
                .from('dealer_cost_profile')
                .select('*')
                .eq('dealer_id', user.id)
                .maybeSingle();

            if (error) {
                console.error('Error fetching dealer cost profile:', error);
                throw error;
            }

            // If no profile exists, return a default scaffolding
            if (!data) {
                return {
                    id: 'new',
                    dealer_id: user.id,
                    average_marketing_cost_per_car: 0,
                    cost_of_capital_percentage: 12.00, // 12% standard APR fallback
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                } as DealerCostProfile;
            }

            return data as DealerCostProfile;
        },
        enabled: !!user,
    });

    const saveProfile = useMutation({
        mutationFn: async (profileData: Partial<DealerCostProfile>) => {
            if (!user) throw new Error("Must be logged in to save cost profile");

            const { data, error } = await supabase
                .from('dealer_cost_profile')
                .upsert({
                    dealer_id: user.id,
                    average_marketing_cost_per_car: profileData.average_marketing_cost_per_car ?? 0,
                    cost_of_capital_percentage: profileData.cost_of_capital_percentage ?? 12.0,
                    ...profileData,
                }, { onConflict: 'dealer_id' })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            toast.success('Dealer cost baseline updated.');
        },
        onError: (error) => {
            console.error('Failed to save dealer cost profile:', error);
            toast.error('Failed to update cost baseline');
        }
    });

    return {
        ...query,
        saveProfile,
    };
}
