
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { generateBodyMapImages } from "@/lib/bodyMapImageGenerator";

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
  event_date?: string;
  event_time?: string;
  recorded_by_staff_id?: string;
  body_map_points?: any;
  body_map_front_image_url?: string;
  body_map_back_image_url?: string;
  branch_id?: string;
  created_at: string;
  updated_at: string;
  // Client information
  client_name?: string;
  client_first_name?: string;
  client_last_name?: string;
  // Staff information
  recorded_by_staff_name?: string;
  // Enhanced fields
  staff_present?: string[];
  staff_aware?: string[];
  other_people_present?: any[];
  action_required?: boolean;
  follow_up_date?: string;
  follow_up_assigned_to?: string;
  follow_up_notes?: string;
  immediate_actions_taken?: string;
  investigation_required?: boolean;
  investigation_assigned_to?: string;
  expected_resolution_date?: string;
  lessons_learned?: string;
  risk_level?: string;
  contributing_factors?: string[];
  environmental_factors?: string;
  preventable?: boolean;
  similar_incidents?: string;
  family_notified?: boolean;
  family_notification_date?: string;
  family_notification_method?: string;
  gp_notified?: boolean;
  gp_notification_date?: string;
  insurance_notified?: boolean;
  insurance_notification_date?: string;
  external_reporting_required?: boolean;
  external_reporting_details?: string;
  attachments?: any[];
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
  event_date: string;
  event_time: string;
  recorded_by_staff_id: string;
  body_map_points?: any;
  branch_id?: string;
  // Enhanced fields
  staff_present?: string[];
  staff_aware?: string[];
  other_people_present?: any[];
  action_required?: boolean;
  follow_up_date?: string;
  follow_up_assigned_to?: string;
  follow_up_notes?: string;
  immediate_actions_taken?: string;
  investigation_required?: boolean;
  investigation_assigned_to?: string;
  expected_resolution_date?: string;
  attachments?: any[];
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
      console.log('Fetching events logs with filters:', { branchId, filters });
      
      let query = supabase
        .from('client_events_logs')
        .select(`
          *,
          clients!inner(
            first_name,
            last_name
          ),
          staff:recorded_by_staff_id(
            first_name,
            last_name
          )
        `);
      
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
      
      // Transform the data to include client and staff names
      const transformedData = data?.map(event => ({
        ...event,
        client_name: event.clients ? `${event.clients.first_name} ${event.clients.last_name}` : 'Unknown Client',
        client_first_name: event.clients?.first_name,
        client_last_name: event.clients?.last_name,
        recorded_by_staff_name: event.staff ? `${event.staff.first_name} ${event.staff.last_name}` : 'Unknown Staff',
      })) || [];
      
      console.log('Fetched events logs:', transformedData.length, 'records');
      return transformedData as EventLog[];
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Create a new event log
export const useCreateEventLog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (eventData: CreateEventLogData) => {
      console.log('Creating event log:', eventData);
      
      // First, create the event record to get the ID
      const { data, error } = await supabase
        .from('client_events_logs')
        .insert(eventData)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating event log:', error);
        throw error;
      }
      
      // If there are body map points, generate images
      if (data && eventData.body_map_points && Array.isArray(eventData.body_map_points) && eventData.body_map_points.length > 0) {
        try {
          const images = await generateBodyMapImages(eventData.body_map_points, data.id);
          
          // Update the event with image URLs
          const updateData: any = {};
          if (images.frontImageUrl) updateData.body_map_front_image_url = images.frontImageUrl;
          if (images.backImageUrl) updateData.body_map_back_image_url = images.backImageUrl;
          
          if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabase
              .from('client_events_logs')
              .update(updateData)
              .eq('id', data.id);
            
            if (updateError) {
              console.error('Error updating event with image URLs:', updateError);
              // Don't fail the whole operation, just log the error
            } else {
              // Return updated data
              return { ...data, ...updateData };
            }
          }
        } catch (imageError) {
          console.error('Error generating body map images:', imageError);
          // Don't fail the whole operation, just log the error
        }
      }
      
      console.log('Created event log:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events-logs'] });
      queryClient.invalidateQueries({ queryKey: ['client-events', data.client_id] });
      toast.success("Event log created successfully");
    },
    onError: (error: any) => {
      console.error('Error creating event log:', error);
      toast.error('Failed to create event log: ' + (error.message || 'Unknown error'));
    },
  });
};

// Update event log status
export const useUpdateEventLogStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      console.log('Updating event log status:', id, status);
      
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
      
      console.log('Updated event log status:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events-logs'] });
      toast.success("Event status updated successfully");
    },
    onError: (error: any) => {
      console.error('Error updating event log status:', error);
      toast.error('Failed to update event status: ' + (error.message || 'Unknown error'));
    },
  });
};

// Delete event log
export const useDeleteEventLog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting event log:', id);
      
      const { error } = await supabase
        .from('client_events_logs')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting event log:', error);
        throw error;
      }
      
      console.log('Deleted event log:', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events-logs'] });
      toast.success("Event deleted successfully");
    },
    onError: (error: any) => {
      console.error('Error deleting event log:', error);
      toast.error('Failed to delete event: ' + (error.message || 'Unknown error'));
    },
  });
};

// Fetch clients for dropdown
export const useEventClients = (branchId?: string) => {
  return useQuery({
    queryKey: ['event-clients', branchId],
    queryFn: async () => {
      console.log('Fetching clients for events:', branchId);
      
      let query = supabase.from('clients').select('id, first_name, last_name');
      
      if (branchId && branchId !== 'global') {
        query = query.eq('branch_id', branchId);
      }
      
      const { data, error } = await query.order('first_name');
      
      if (error) {
        console.error('Error fetching clients:', error);
        throw error;
      }
      
      console.log('Fetched clients:', data?.length || 0, 'records');
      return data || [];
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
