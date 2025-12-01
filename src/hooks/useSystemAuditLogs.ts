import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SystemAuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, any> | null;
  created_at: string;
  system_user_id: string;
  performed_by_name?: string;
}

const fetchSystemAuditLogs = async (): Promise<SystemAuditLog[]> => {
  const { data, error } = await supabase
    .from('system_audit_logs')
    .select(`
      id,
      action,
      resource_type,
      resource_id,
      details,
      created_at,
      system_user_id,
      system_users!inner (
        name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[useSystemAuditLogs] Error fetching audit logs:', error);
    throw error;
  }

  // Transform data to include performed_by_name
  return (data || []).map((log: any) => ({
    id: log.id,
    action: log.action,
    resource_type: log.resource_type,
    resource_id: log.resource_id,
    details: log.details,
    created_at: log.created_at,
    system_user_id: log.system_user_id,
    performed_by_name: log.system_users?.name || 'Unknown User',
  }));
};

export const useSystemAuditLogs = () => {
  return useQuery({
    queryKey: ['system-audit-logs'],
    queryFn: fetchSystemAuditLogs,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refresh every minute
  });
};
