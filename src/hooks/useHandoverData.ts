import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HandoverVisitRecord {
  id: string;
  visit_start_time: string;
  visit_end_time: string | null;
  visit_notes: string | null;
  visit_summary: string | null;
  status: string;
  staff: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

export interface HandoverServiceReport {
  client_mood: string | null;
  client_engagement: string | null;
  created_at: string;
}

export interface HandoverClientNote {
  id: string;
  title: string;
  content: string | null;
  author: string | null;
  created_at: string;
}

export interface HandoverEvent {
  id: string;
  event_type: string;
  description: string | null;
  severity: string | null;
  status: string | null;
  reporter: string | null;
  event_date: string;
}

export const useHandoverData = (clientId: string) => {
  // Fetch recent visit records with staff names
  const visitRecordsQuery = useQuery({
    queryKey: ['handover-visit-records', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visit_records')
        .select(`
          id, visit_start_time, visit_end_time, visit_notes, visit_summary, status, staff_id
        `)
        .eq('client_id', clientId)
        .eq('status', 'completed')
        .order('visit_start_time', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      // Fetch staff details separately if there are visits
      if (data && data.length > 0) {
        const staffIds = [...new Set(data.map(v => v.staff_id).filter(Boolean))];
        if (staffIds.length > 0) {
          const { data: staffData } = await supabase
            .from('staff')
            .select('id, first_name, last_name')
            .in('id', staffIds);
          
          const staffMap = new Map(staffData?.map(s => [s.id, s]) || []);
          
          return data.map(visit => ({
            ...visit,
            staff: visit.staff_id ? staffMap.get(visit.staff_id) || null : null
          })) as HandoverVisitRecord[];
        }
      }
      
      return (data || []).map(visit => ({ ...visit, staff: null })) as HandoverVisitRecord[];
    },
    enabled: !!clientId,
  });

  // Fetch recent service reports for mood/engagement
  const serviceReportsQuery = useQuery({
    queryKey: ['handover-service-reports', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_service_reports')
        .select('client_mood, client_engagement, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return (data || []) as HandoverServiceReport[];
    },
    enabled: !!clientId,
  });

  // Fetch recent client notes
  const clientNotesQuery = useQuery({
    queryKey: ['handover-client-notes', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_notes')
        .select('id, title, content, author, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return (data || []) as HandoverClientNote[];
    },
    enabled: !!clientId,
  });

  // Fetch open/recent events
  const eventsQuery = useQuery({
    queryKey: ['handover-events', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_events_logs')
        .select('id, event_type, description, severity, status, reporter, event_date')
        .eq('client_id', clientId)
        .or('status.eq.open,status.eq.pending')
        .order('event_date', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return (data || []) as HandoverEvent[];
    },
    enabled: !!clientId,
  });

  return {
    recentVisits: visitRecordsQuery.data || [],
    moodReports: serviceReportsQuery.data || [],
    clientNotes: clientNotesQuery.data || [],
    openEvents: eventsQuery.data || [],
    isLoading: visitRecordsQuery.isLoading || serviceReportsQuery.isLoading || clientNotesQuery.isLoading || eventsQuery.isLoading,
    isError: visitRecordsQuery.isError || serviceReportsQuery.isError || clientNotesQuery.isError || eventsQuery.isError,
  };
};
