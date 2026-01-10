import { supabase } from '@/lib/supabase-client';

interface AuditEventParams {
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, any>;
}

/**
 * Hook for logging security events and audit trails
 */
export function useSecurityAudit() {
  const logEvent = async ({
    action,
    resourceType,
    resourceId,
    details,
  }: AuditEventParams): Promise<string | null> => {
    try {
      // @ts-ignore - log_security_event function not in generated types yet
      const { data, error } = await supabase.rpc('log_security_event', {
        _action: action,
        _resource_type: resourceType || null,
        _resource_id: resourceId || null,
        _details: details ? JSON.stringify(details) : null,
      });

      if (error) {
        console.error('Error logging security event:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Exception logging security event:', err);
      return null;
    }
  };

  return {
    logEvent,
  };
}
