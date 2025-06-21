
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EventLog {
  id: string;
  client_id: string;
  title: string;
  event_type: string;
  severity: string;
  description?: string;
  status: string;
  reporter: string;
  location?: string;
  category: string;
  body_map_points?: any;
  branch_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEventLogData {
  client_id: string;
  title: string;
  event_type: string;
  severity: string;
  description?: string;
  status: string;
  reporter: string;
  location?: string;
  category: string;
  body_map_points?: any;
  branch_id?: string;
}

// Fetch events logs for a specific branch
export const useEventsLogs = (branchId?: string, filters?: {
  searchQuery?: string;
  typeFilter?: string;
  statusFilter?: string;
  categoryFilter?: string;
  dateFilter?: string;
}) => {
  return useQuery({
    queryKey: ['events-logs', branchId, filters],
    queryFn: async () => {
      let query = supabase.from('client_events_logs').select('*');
      
      if (branchId && branchId !== 'global') {
        query = query.eq('branch_id', branchId);
      }
      
      if (filters?.searchQuery) {
        query = query.or(`title.ilike.%${filters.searchQuery}%,reporter.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`);
      }
      
      if (filters?.typeFilter && filters.typeFilter !== 'all') {
        query = query.eq('event_type', filters.typeFilter);
      }
      
      if (filters?.statusFilter && filters.statusFilter !== 'all') {
        query = query.eq('status', filters.statusFilter);
      }
      
      if (filters?.categoryFilter && filters.categoryFilter !== 'all') {
        query = query.eq('category', filters.categoryFilter);
      }
      
      if (filters?.dateFilter && filters.dateFilter !== 'all') {
        const now = new Date();
        const filterDate = new Date();
        if (filters.dateFilter === 'last7days') filterDate.setDate(now.getDate() - 7);
        else if (filters.dateFilter === 'last30days') filterDate.setDate(now.getDate() - 30);
        else if (filters.dateFilter === 'last90days') filterDate.setDate(now.getDate() - 90);
        query = query.gte('created_at', filterDate.toISOString());
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching events logs:', error);
        throw error;
      }
      
      return data as EventLog[];
    },
  });
};

// Create a new event log
export const useCreateEventLog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (eventData: CreateEventLogData) => {
      const { data, error } = await supabase
        .from('client_events_logs')
        .insert(eventData)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating event log:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events-logs'] });
      toast.success("Event log created successfully");
    },
    onError: (error) => {
      console.error('Error creating event log:', error);
      toast.error('Failed to create event log');
    },
  });
};

// Update event log status
export const useUpdateEventLogStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('client_events_logs')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating event log status:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events-logs'] });
      toast.success("Event status updated successfully");
    },
    onError: (error) => {
      console.error('Error updating event log status:', error);
      toast.error('Failed to update event status');
    },
  });
};

// Delete event log
export const useDeleteEventLog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('client_events_logs')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting event log:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events-logs'] });
      toast.success("Event deleted successfully");
    },
    onError: (error) => {
      console.error('Error deleting event log:', error);
      toast.error('Failed to delete event');
    },
  });
};

// Fetch clients for dropdown
export const useEventClients = (branchId?: string) => {
  return useQuery({
    queryKey: ['event-clients', branchId],
    queryFn: async () => {
      let query = supabase.from('clients').select('id, first_name, last_name');
      
      if (branchId && branchId !== 'global') {
        query = query.eq('branch_id', branchId);
      }
      
      const { data, error } = await query.order('first_name');
      
      if (error) {
        console.error('Error fetching clients:', error);
        throw error;
      }
      
      return data || [];
    },
  });
};
