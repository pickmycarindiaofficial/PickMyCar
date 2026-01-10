import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/contexts/AuthContext';

export type AppRole = 'user' | 'dealer' | 'admin' | 'powerdesk';

interface UserPermissions {
  roles: AppRole[];
  isAdmin: boolean;
  isDealer: boolean;
  isUser: boolean;
  isPowerdesk: boolean;
}

/**
 * Hook to check user roles and permissions
 * Uses the user_permissions view for efficient role checking
 */
export function useRoleCheck() {
  const { user } = useAuth();

  const { data: permissions, isLoading } = useQuery({
    queryKey: ['user-permissions', user?.id],
    queryFn: async (): Promise<UserPermissions> => {
      if (!user?.id) {
        return {
          roles: [],
          isAdmin: false,
          isDealer: false,
          isUser: false,
          isPowerdesk: false,
        };
      }

      // Call the RPC function to get user permissions
      const { data, error } = await (supabase as any).rpc('get_user_permissions');

      if (error) {
        console.error('Error fetching user permissions:', error);
        throw error;
      }

      // RPC returns an array, get the first item for current user
      const permissionData = Array.isArray(data) ? data[0] : data;

      if (!permissionData) {
        // User has no roles assigned
        return {
          roles: [],
          isAdmin: false,
          isDealer: false,
          isUser: false,
          isPowerdesk: false,
        };
      }

      return {
        roles: permissionData.roles || [],
        isAdmin: permissionData.is_admin || false,
        isDealer: permissionData.is_dealer || false,
        isUser: permissionData.is_user || false,
        isPowerdesk: permissionData.is_powerdesk || false,
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: true,
  });

  const hasRole = (role: AppRole): boolean => {
    return permissions?.roles.includes(role) || false;
  };

  const hasAnyRole = (roles: AppRole[]): boolean => {
    return roles.some(role => hasRole(role));
  };

  const hasAllRoles = (roles: AppRole[]): boolean => {
    return roles.every(role => hasRole(role));
  };

  return {
    permissions: permissions || {
      roles: [],
      isAdmin: false,
      isDealer: false,
      isUser: false,
      isPowerdesk: false,
    },
    isLoading,
    hasRole,
    hasAnyRole,
    hasAllRoles,
  };
}
