import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { AppRole } from '@/types/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

interface PermissionGateProps {
  children: ReactNode;
  roles?: AppRole[];
  module?: string;
  fallback?: ReactNode;
  showError?: boolean;
}

export function PermissionGate({ 
  children, 
  roles, 
  module,
  fallback,
  showError = true 
}: PermissionGateProps) {
  const { hasAnyRole, canAccessModule } = usePermissions();

  let hasPermission = true;

  if (roles && roles.length > 0) {
    hasPermission = hasAnyRole(roles);
  }

  if (module && hasPermission) {
    hasPermission = canAccessModule(module);
  }

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showError) {
      return (
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access this feature.
            Please contact your administrator if you believe this is an error.
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  }

  return <>{children}</>;
}
