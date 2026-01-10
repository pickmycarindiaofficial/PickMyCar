import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types/auth';

export interface StaffMember {
  id: string;
  full_name: string;
  username: string;
  email: string;
  role: AppRole;
  avatar_url?: string;
  is_active: boolean;
}

export function useStaffMembers(currentUserId?: string) {
  const query = useQuery({
    queryKey: ['staff-members', currentUserId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_internal_staff');

      if (error) {
        console.error('Error fetching staff members:', error);
        console.error('💡 Make sure you have run messaging_system_setup.sql in Supabase SQL Editor');
        throw error;
      }

      // Filter out current user to prevent self-messaging
      const filtered = (data || []).filter(
        (member: StaffMember) => !currentUserId || member.id !== currentUserId
      );
      return filtered as StaffMember[];
    },
    retry: 2,
  });

  return {
    staffMembers: query.data || [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
