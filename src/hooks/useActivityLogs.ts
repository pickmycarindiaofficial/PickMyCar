import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: {
    username: string;
    avatar_url?: string;
  };
}

export function useActivityLogs(filters?: {
  action?: string;
  entityType?: string;
  userId?: string;
  limit?: number;
}) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();

    // Subscribe to new activity logs
    const channel = supabase
      .channel('activity-logs-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
        },
        (payload) => {
          setLogs((prev) => [payload.new as ActivityLog, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filters]);

  const fetchLogs = async () => {
    try {
      let query = (supabase as any)
        .from('activity_logs')
        .select(
          `
          *,
          user:profiles!user_id(username, avatar_url)
        `
        )
        .order('created_at', { ascending: false })
        .limit(filters?.limit || 100);

      if (filters?.action) {
        query = query.eq('action', filters.action);
      }
      if (filters?.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs((data as any) || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const createLog = async (
    action: string,
    entityType: string,
    entityId?: string,
    details?: any
  ) => {
    try {
      const { error } = await (supabase as any).from('activity_logs').insert({
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
        ip_address: null, // Could be captured client-side if needed
        user_agent: navigator.userAgent,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating activity log:', error);
    }
  };

  return {
    logs,
    loading,
    createLog,
    refetch: fetchLogs,
  };
}
