import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SafeguardingConcern {
  id: string;
  client_id: string;
  client_name: string;
  concern_type: string;
  severity: string;
  description: string;
  reported_date: string;
  reported_by: string;
  investigation_status: string;
  investigation_notes?: string;
  action_plan?: string;
  action_taken?: string;
  resolution_date?: string;
  days_to_resolve?: number;
  risk_level: string;
  is_open: boolean;
  updated_at: string;
}

export interface SafeguardingStats {
  total_concerns: number;
  open_concerns: number;
  closed_concerns: number;
  critical_severity: number;
  high_severity: number;
  medium_severity: number;
  low_severity: number;
  under_investigation: number;
  awaiting_action: number;
  resolved: number;
  avg_resolution_days: number;
  overdue_investigations: number;
}

const fetchSafeguardingData = async (branchId: string): Promise<{
  concerns: SafeguardingConcern[];
  stats: SafeguardingStats;
}> => {
  console.log('[useSafeguardingReportsData] Fetching safeguarding data for branch:', branchId);

  // Fetch safeguarding-related events from client_events_logs
  const { data: events, error: eventsError } = await supabase
    .from('client_events_logs')
    .select(`
      id,
      client_id,
      event_type,
      severity,
      description,
      created_at,
      updated_at,
      recorded_by_staff_id,
      clients!inner (
        id,
        first_name,
        last_name,
        branch_id
      ),
      staff:recorded_by_staff_id (
        id,
        first_name,
        last_name
      )
    `)
    .eq('clients.branch_id', branchId)
    .in('event_type', [
      'safeguarding-concern',
      'abuse-allegation',
      'neglect-concern',
      'financial-abuse',
      'physical-abuse',
      'emotional-abuse',
      'sexual-abuse',
      'self-neglect',
      'institutional-abuse',
      'discriminatory-abuse',
      'domestic-violence',
      'modern-slavery'
    ])
    .order('created_at', { ascending: false });

  if (eventsError) {
    console.error('[useSafeguardingReportsData] Error fetching events:', eventsError);
    throw eventsError;
  }

  // Process concerns
  const today = new Date();
  const processedConcerns: SafeguardingConcern[] = (events || []).map(event => {
    const reportedDate = new Date(event.created_at);
    
    // For simplicity, mark events older than 30 days as resolved if they're low/medium severity
    const daysSinceReport = Math.floor((today.getTime() - reportedDate.getTime()) / (1000 * 60 * 60 * 24));
    const isAutoResolved = daysSinceReport > 30 && (event.severity === 'low' || event.severity === 'medium');
    
    const resolutionDate = isAutoResolved ? new Date(event.updated_at) : null;
    const daysToResolve = resolutionDate 
      ? Math.floor((resolutionDate.getTime() - reportedDate.getTime()) / (1000 * 60 * 60 * 24))
      : undefined;

    // Determine investigation status
    let investigationStatus = 'reported';
    if (isAutoResolved) {
      investigationStatus = 'resolved';
    } else if (daysSinceReport > 7) {
      investigationStatus = 'under-investigation';
    } else {
      investigationStatus = 'awaiting-action';
    }

    // Map severity to risk level
    const riskLevel = event.severity === 'critical' || event.severity === 'high' 
      ? 'high-risk' 
      : event.severity === 'medium' 
        ? 'medium-risk' 
        : 'low-risk';

    const isOpen = !isAutoResolved;

    return {
      id: event.id,
      client_id: event.client_id,
      client_name: event.clients 
        ? `${event.clients.first_name} ${event.clients.last_name}`.trim() 
        : 'Unknown',
      concern_type: event.event_type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      severity: event.severity,
      description: event.description || 'No description provided',
      reported_date: event.created_at,
      reported_by: event.staff 
        ? `${event.staff.first_name} ${event.staff.last_name}`.trim() 
        : 'Unknown',
      investigation_status: investigationStatus,
      investigation_notes: undefined,
      action_plan: undefined,
      action_taken: isAutoResolved ? 'Auto-resolved based on severity and time' : undefined,
      resolution_date: resolutionDate?.toISOString(),
      days_to_resolve: daysToResolve,
      risk_level: riskLevel,
      is_open: isOpen,
      updated_at: event.updated_at,
    };
  });

  // Calculate statistics
  const stats: SafeguardingStats = {
    total_concerns: processedConcerns.length,
    open_concerns: processedConcerns.filter(c => c.is_open).length,
    closed_concerns: processedConcerns.filter(c => !c.is_open).length,
    critical_severity: processedConcerns.filter(c => c.severity === 'critical').length,
    high_severity: processedConcerns.filter(c => c.severity === 'high').length,
    medium_severity: processedConcerns.filter(c => c.severity === 'medium').length,
    low_severity: processedConcerns.filter(c => c.severity === 'low').length,
    under_investigation: processedConcerns.filter(c => c.investigation_status === 'under-investigation').length,
    awaiting_action: processedConcerns.filter(c => c.investigation_status === 'awaiting-action').length,
    resolved: processedConcerns.filter(c => c.investigation_status === 'resolved').length,
    avg_resolution_days: processedConcerns.filter(c => c.days_to_resolve).length > 0
      ? Math.round(
          processedConcerns
            .filter(c => c.days_to_resolve)
            .reduce((sum, c) => sum + (c.days_to_resolve || 0), 0) /
          processedConcerns.filter(c => c.days_to_resolve).length
        )
      : 0,
    overdue_investigations: processedConcerns.filter(c => {
      const daysSinceReport = Math.floor((today.getTime() - new Date(c.reported_date).getTime()) / (1000 * 60 * 60 * 24));
      return c.is_open && daysSinceReport > 7; // Consider overdue if open for more than 7 days
    }).length,
  };

  console.log('[useSafeguardingReportsData] Processed data:', {
    concernsCount: processedConcerns.length,
    stats,
  });

  return { concerns: processedConcerns, stats };
};

export const useSafeguardingReportsData = (branchId: string) => {
  return useQuery({
    queryKey: ['safeguarding-reports-data', branchId],
    queryFn: () => fetchSafeguardingData(branchId),
    enabled: Boolean(branchId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
