import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function useAuthGuard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const requireAuth = (
    action: () => void,
    options?: {
      message?: string;
      returnTo?: string;
    }
  ): void => {
    if (loading) return;

    if (!user) {
      toast.error(options?.message || 'Please login to continue', {
        description: 'You need to be logged in to perform this action',
        action: {
          label: 'Login',
          onClick: () => navigate(`/auth?returnTo=${options?.returnTo || window.location.pathname}`),
        },
      });
      return;
    }

    // User is authenticated, execute the action
    action();
  };

  return { requireAuth, isAuthenticated: !!user, loading };
}
