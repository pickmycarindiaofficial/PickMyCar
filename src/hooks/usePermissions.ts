import { useAuth } from '@/contexts/AuthContext';
import { AppRole } from '@/types/auth';

export function usePermissions() {
  const { roles, hasRole } = useAuth();

  const hasAnyRole = (allowedRoles: AppRole[]) => {
    return allowedRoles.some(role => roles.includes(role));
  };

  const canAccessModule = (moduleName: string): boolean => {
    // PowerDesk has access to everything
    if (hasRole('powerdesk')) return true;

    // Module-specific access control
    const moduleAccess: Record<string, AppRole[]> = {
      // Master Data
      'master-setup': ['powerdesk', 'website_manager'],
      'master-data': ['powerdesk', 'website_manager'],
      
      // User Management
      'users': ['powerdesk'],
      'permissions': ['powerdesk'],
      'activity': ['powerdesk'],
      
      // Content Management
      'content': ['powerdesk', 'website_manager'],
      'seo': ['powerdesk', 'website_manager'],
      'campaigns': ['powerdesk', 'website_manager'],
      'analytics': ['powerdesk', 'website_manager'],
      
      // Inventory & Sales
      'inventory': ['powerdesk', 'dealer'],
      'leads': ['powerdesk', 'dealer', 'sales'],
      'sales-pipeline': ['powerdesk', 'dealer', 'sales'],
      'customers': ['powerdesk', 'sales'],
      'deals': ['powerdesk', 'sales'],
      'performance': ['powerdesk', 'sales'],
      'followups': ['powerdesk', 'sales'],
      
      // Finance
      'finance-requests': ['powerdesk', 'dealer', 'finance'],
      'applications': ['powerdesk', 'finance'],
      'emi-calculator': ['powerdesk', 'finance'],
      'documents': ['powerdesk', 'finance'],
      'approvals': ['powerdesk', 'finance'],
      
      // Inspection
      'inspections': ['powerdesk', 'dealer', 'inspection'],
      'inspection-queue': ['powerdesk', 'inspection'],
      'inspection-reports': ['powerdesk', 'inspection'],
      'vehicle-history': ['powerdesk', 'inspection'],
      'quality-metrics': ['powerdesk', 'inspection'],
      
      // Shared
      'messages': ['powerdesk', 'website_manager', 'dealer', 'sales', 'finance', 'inspection', 'user'],
      'overview': ['powerdesk', 'website_manager', 'dealer', 'sales', 'finance', 'inspection', 'user'],
      'profile': ['powerdesk', 'website_manager', 'dealer', 'sales', 'finance', 'inspection', 'user'],
      'reports': ['powerdesk', 'finance'],
    };

    const allowedRoles = moduleAccess[moduleName];
    if (!allowedRoles) return false;

    return hasAnyRole(allowedRoles);
  };

  const canPerformAction = (action: 'create' | 'edit' | 'delete' | 'view', resource: string): boolean => {
    // PowerDesk can do everything
    if (hasRole('powerdesk')) return true;

    // Resource-specific permissions
    const permissions: Record<string, Record<string, AppRole[]>> = {
      'master-data': {
        view: ['powerdesk', 'website_manager'],
        create: ['powerdesk', 'website_manager'],
        edit: ['powerdesk', 'website_manager'],
        delete: ['powerdesk'],
      },
      'user': {
        view: ['powerdesk'],
        create: ['powerdesk'],
        edit: ['powerdesk'],
        delete: ['powerdesk'],
      },
      'car': {
        view: ['powerdesk', 'dealer', 'sales', 'user'],
        create: ['powerdesk', 'dealer'],
        edit: ['powerdesk', 'dealer'],
        delete: ['powerdesk', 'dealer'],
      },
      'lead': {
        view: ['powerdesk', 'dealer', 'sales'],
        create: ['powerdesk', 'dealer', 'sales'],
        edit: ['powerdesk', 'dealer', 'sales'],
        delete: ['powerdesk', 'sales'],
      },
      'content': {
        view: ['powerdesk', 'website_manager'],
        create: ['powerdesk', 'website_manager'],
        edit: ['powerdesk', 'website_manager'],
        delete: ['powerdesk', 'website_manager'],
      },
    };

    const resourcePermissions = permissions[resource];
    if (!resourcePermissions) return false;

    const allowedRoles = resourcePermissions[action];
    if (!allowedRoles) return false;

    return hasAnyRole(allowedRoles);
  };

  return {
    roles,
    hasRole,
    hasAnyRole,
    canAccessModule,
    canPerformAction,
  };
}
