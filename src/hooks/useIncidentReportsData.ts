import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface IncidentBySeverity {
  severity: string;
  count: number;
}

export interface IncidentByType {
  type: string;
  count: number;
}

export interface IncidentByStaff {
  staffId: string;
  staffName: string;
  incidentCount: number;
}

export interface IncidentByClient {
  clientId: string;
  clientName: string;
  incidentCount: number;
}

export interface IncidentTrend {
  month: string;
  incidents: number;
  resolved: number;
  pending: number;
}

export interface IncidentDetail {
  id: string;
  category: string;
  severity: string;
  description: string;
  date: string;
  clientName: string;
  staffName: string;
  status: string;
  resolutionTime?: number; // in days
}

export interface IncidentReportsData {
  summary: {
    totalIncidents: number;
    resolvedIncidents: number;
    pendingIncidents: number;
    averageResolutionTime: number; // in days
    criticalIncidents: number;
    highPriorityIncidents: number;
  };
  bySeverity: IncidentBySeverity[];
  byType: IncidentByType[];
  byStaff: IncidentByStaff[];
  byClient: IncidentByClient[];
  trends: IncidentTrend[];
  recentIncidents: IncidentDetail[];
}

interface UseIncidentReportsDataProps {
  branchId: string;
  startDate?: string;
  endDate?: string;
}

export const useIncidentReportsData = ({
  branchId,
  startDate,
  endDate,
}: UseIncidentReportsDataProps) => {
  return useQuery({
    queryKey: ['incident-reports', branchId, startDate, endDate],
    queryFn: async (): Promise<IncidentReportsData> => {
      console.log('[useIncidentReportsData] Fetching data for branch:', branchId);

      // Build date filter
      let query = supabase
        .from('client_events_logs')
        .select(`
          id,
          category,
          severity,
          description,
          created_at,
          updated_at,
          status,
          client:clients!inner(id, first_name, last_name),
          staff:staff!recorded_by_staff_id(id, first_name, last_name)
        `)
        .eq('branch_id', branchId);

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data: incidents, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('[useIncidentReportsData] Error:', error);
        throw error;
      }

      if (!incidents || incidents.length === 0) {
        return {
          summary: {
            totalIncidents: 0,
            resolvedIncidents: 0,
            pendingIncidents: 0,
            averageResolutionTime: 0,
            criticalIncidents: 0,
            highPriorityIncidents: 0,
          },
          bySeverity: [],
          byType: [],
          byStaff: [],
          byClient: [],
          trends: [],
          recentIncidents: [],
        };
      }

      // Calculate summary statistics
      const totalIncidents = incidents.length;
      const resolvedIncidents = incidents.filter((i) => i.status === 'resolved').length;
      const pendingIncidents = totalIncidents - resolvedIncidents;
      const criticalIncidents = incidents.filter(
        (i) => i.severity === 'critical' || i.severity === 'high'
      ).length;
      const highPriorityIncidents = incidents.filter((i) => i.severity === 'high').length;

      // Calculate average resolution time (using updated_at as resolution time for resolved incidents)
      const resolvedWithTime = incidents.filter((i) => i.status === 'resolved' && i.updated_at && i.created_at);
      const totalResolutionDays = resolvedWithTime.reduce((sum, incident) => {
        const created = new Date(incident.created_at);
        const resolved = new Date(incident.updated_at!);
        const days = Math.ceil((resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      const averageResolutionTime =
        resolvedWithTime.length > 0 ? Math.round(totalResolutionDays / resolvedWithTime.length) : 0;

      // Group by severity
      const severityMap = new Map<string, number>();
      incidents.forEach((incident) => {
        const severity = incident.severity || 'unknown';
        severityMap.set(severity, (severityMap.get(severity) || 0) + 1);
      });
      const bySeverity: IncidentBySeverity[] = Array.from(severityMap.entries()).map(
        ([severity, count]) => ({
          severity: severity.charAt(0).toUpperCase() + severity.slice(1),
          count,
        })
      );

      // Group by type/category
      const typeMap = new Map<string, number>();
      incidents.forEach((incident) => {
        const type = incident.category || 'Uncategorized';
        typeMap.set(type, (typeMap.get(type) || 0) + 1);
      });
      const byType: IncidentByType[] = Array.from(typeMap.entries())
        .map(([type, count]) => ({
          type,
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Group by staff
      const staffMap = new Map<string, { name: string; count: number }>();
      incidents.forEach((incident) => {
        if (incident.staff) {
          const staffId = incident.staff.id;
          const staffName = `${incident.staff.first_name} ${incident.staff.last_name}`;
          const current = staffMap.get(staffId) || { name: staffName, count: 0 };
          staffMap.set(staffId, { name: current.name, count: current.count + 1 });
        }
      });
      const byStaff: IncidentByStaff[] = Array.from(staffMap.entries())
        .map(([staffId, data]) => ({
          staffId,
          staffName: data.name,
          incidentCount: data.count,
        }))
        .sort((a, b) => b.incidentCount - a.incidentCount)
        .slice(0, 10);

      // Group by client
      const clientMap = new Map<string, { name: string; count: number }>();
      incidents.forEach((incident) => {
        if (incident.client) {
          const clientId = incident.client.id;
          const clientName = `${incident.client.first_name} ${incident.client.last_name}`;
          const current = clientMap.get(clientId) || { name: clientName, count: 0 };
          clientMap.set(clientId, { name: current.name, count: current.count + 1 });
        }
      });
      const byClient: IncidentByClient[] = Array.from(clientMap.entries())
        .map(([clientId, data]) => ({
          clientId,
          clientName: data.name,
          incidentCount: data.count,
        }))
        .sort((a, b) => b.incidentCount - a.incidentCount)
        .slice(0, 10);

      // Generate trend data (last 6 months)
      const monthMap = new Map<string, { total: number; resolved: number; pending: number }>();
      incidents.forEach((incident) => {
        const date = new Date(incident.created_at);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const current = monthMap.get(monthKey) || { total: 0, resolved: 0, pending: 0 };
        current.total += 1;
        if (incident.status === 'resolved') {
          current.resolved += 1;
        } else {
          current.pending += 1;
        }
        monthMap.set(monthKey, current);
      });

      // Sort trends chronologically
      const trends: IncidentTrend[] = Array.from(monthMap.entries())
        .map(([month, data]) => ({
          month,
          incidents: data.total,
          resolved: data.resolved,
          pending: data.pending,
        }))
        .reverse()
        .slice(0, 6)
        .reverse();

      // Recent incidents details
      const recentIncidents: IncidentDetail[] = incidents.slice(0, 20).map((incident) => {
        let resolutionTime: number | undefined;
        if (incident.status === 'resolved' && incident.updated_at && incident.created_at) {
          const created = new Date(incident.created_at);
          const resolved = new Date(incident.updated_at);
          resolutionTime = Math.ceil(
            (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
          );
        }

        return {
          id: incident.id,
          category: incident.category || 'Uncategorized',
          severity: incident.severity || 'unknown',
          description: incident.description || 'No description',
          date: incident.created_at,
          clientName: incident.client
            ? `${incident.client.first_name} ${incident.client.last_name}`
            : 'Unknown',
          staffName: incident.staff
            ? `${incident.staff.first_name} ${incident.staff.last_name}`
            : 'N/A',
          status: incident.status || 'pending',
          resolutionTime,
        };
      });

      console.log('[useIncidentReportsData] Processed', totalIncidents, 'incidents');

      return {
        summary: {
          totalIncidents,
          resolvedIncidents,
          pendingIncidents,
          averageResolutionTime,
          criticalIncidents,
          highPriorityIncidents,
        },
        bySeverity,
        byType,
        byStaff,
        byClient,
        trends,
        recentIncidents,
      };
    },
    enabled: Boolean(branchId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
