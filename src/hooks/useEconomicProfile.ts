import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CarEconomicProfile } from '@/types/profit-intelligence';

export function useEconomicProfile(carId: string) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const queryKey = ['economic-profile', carId];

    const query = useQuery({
        queryKey,
        queryFn: async (): Promise<CarEconomicProfile | null> => {
            if (!carId) return null;

            const { data, error } = await supabase
                .from('car_economic_profile')
                .select('*')
                .eq('car_id', carId)
                .maybeSingle();

            if (error) {
                console.error('Error fetching economic profile:', error);
                throw error;
            }

            return data as CarEconomicProfile;
        },
        enabled: !!carId && !!user,
    });

    const saveProfile = useMutation({
        mutationFn: async (profileData: Partial<CarEconomicProfile>) => {
            if (!user) throw new Error("Must be logged in to save economic profile");

            const { data, error } = await supabase
                .from('car_economic_profile')
                .upsert({
                    car_id: carId,
                    dealer_id: user.id,
                    acquisition_cost: profileData.acquisition_cost || 0,
                    reconditioning_cost: profileData.reconditioning_cost || 0,
                    daily_holding_cost: profileData.daily_holding_cost || 0,
                    expected_margin: profileData.expected_margin || 0,
                    ...profileData,
                }, { onConflict: 'car_id' })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            toast.success('Economic profile saved');
        },
        onError: (error) => {
            console.error('Failed to save economic profile:', error);
            toast.error('Failed to save economic profile');
        }
    });

    return {
        ...query,
        saveProfile,
    };
}
