import React from 'react';
import { useRoleCheck, AppRole } from '@/hooks/useRoleCheck';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

interface RoleGateProps {
  children: React.ReactNode;
  allowedRoles: AppRole[];
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

/**
 * Component that conditionally renders children based on user roles
 * Uses server-side role validation for security
 */
export function RoleGate({ 
  children, 
  allowedRoles, 
  fallback,
  requireAll = false 
}: RoleGateProps) {
  const { permissions, isLoading, hasAnyRole, hasAllRoles } = useRoleCheck();

  if (isLoading) {
    return null;
  }

  const hasAccess = requireAll 
    ? hasAllRoles(allowedRoles)
    : hasAnyRole(allowedRoles);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Alert variant="destructive" className="mt-4">
        <ShieldAlert className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to access this content. 
          Required role{allowedRoles.length > 1 ? 's' : ''}: {allowedRoles.join(', ')}
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}
