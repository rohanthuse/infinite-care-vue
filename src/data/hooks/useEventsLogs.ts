
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
  // Branch information
  branch_name?: string;
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
  assignedToMe?: string;
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
            last_name,
            branch_id
          ),
          staff:recorded_by_staff_id(
            first_name,
            last_name
          ),
          branches!branch_id(
            name
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

      if (filters?.assignedToMe) {
        query = query.or(`follow_up_assigned_to.eq.${filters.assignedToMe},recorded_by_staff_id.eq.${filters.assignedToMe},investigation_assigned_to.eq.${filters.assignedToMe}`);
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
        branch_name: event.branches?.name || 'Unknown Branch'
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
    mutationFn: async (eventData: CreateEventLogData & { attachments?: any[] }) => {
      console.log('Creating event log:', eventData);
      
      // Handle file attachments - upload to storage and create metadata array
      let processedAttachments: any[] = [];
      
      if (eventData.attachments && eventData.attachments.length > 0) {
        try {
          for (const attachment of eventData.attachments) {
            // Check if it's a File object (with .file property)
            if (attachment.file instanceof File) {
              const filePath = `event-attachments/${eventData.client_id}/${Date.now()}-${attachment.name}`;
              
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, attachment.file);
              
              if (uploadError) throw uploadError;
              
              // Get public URL
              const { data: urlData } = supabase.storage
                .from('documents')
                .getPublicUrl(uploadData.path);
              
              processedAttachments.push({
                id: attachment.id,
                name: attachment.name,
                size: attachment.size,
                type: attachment.type,
                file_path: uploadData.path,
                public_url: urlData.publicUrl,
                uploadDate: new Date().toISOString()
              });
              
              // Insert metadata into documents table for tracking
              await supabase
                .from('documents')
                .insert({
                  name: attachment.name,
                  type: 'attachment',
                  category: 'event_attachment',
                  file_path: uploadData.path,
                  file_size: attachment.size.toString(),
                  file_type: attachment.type,
                  storage_bucket: 'documents',
                  client_id: eventData.client_id,
                  branch_id: eventData.branch_id,
                  uploaded_by_name: 'System'
                });
            }
          }
        } catch (error) {
          console.error('Error uploading attachments:', error);
          throw new Error('Failed to upload attachments');
        }
      }
      
      // Create the event record with processed attachments metadata
      const eventRecord = {
        ...eventData,
        attachments: processedAttachments.length > 0 ? processedAttachments : null
      };
      
      const { data, error } = await supabase
        .from('client_events_logs')
        .insert(eventRecord)
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
            } else {
              Object.assign(data, updateData);
            }
          }
        } catch (imageError) {
          console.error('Error generating body map images:', imageError);
        }
      }
      
      // Create notifications for high severity events
      if (data.severity === 'high' || data.severity === 'critical') {
        try {
          const { data: branchAdmins } = await supabase
            .from('admin_branches')
            .select('admin_id')
            .eq('branch_id', eventData.branch_id);

          // Create notifications for all branch admins
          for (const admin of branchAdmins || []) {
            await supabase
              .from('notifications')
              .insert({
                user_id: admin.admin_id,
                branch_id: eventData.branch_id,
                type: 'event_log',
                category: 'warning',
                priority: data.severity === 'critical' ? 'urgent' : 'high',
                title: `${data.severity.toUpperCase()} Event: ${data.title}`,
                message: `A ${data.severity} severity event has been recorded.`,
                data: {
                  event_id: data.id,
                  client_id: data.client_id,
                  event_type: data.event_type,
                  severity: data.severity
                }
              });
          }
        } catch (notificationError) {
          console.error('Error creating notification:', notificationError);
        }
      }

      // Create notifications for assigned staff with enhanced details
      const staffAssignments: { staffId: string; type: string; additionalInfo?: string; priority: string }[] = [];

      // Add recorded_by_staff notification
      if (eventData.recorded_by_staff_id) {
        staffAssignments.push({
          staffId: eventData.recorded_by_staff_id,
          type: 'Recording',
          additionalInfo: 'You have recorded this event and can view it on your portal.',
          priority: 'low'
        });
      }

      // Add follow-up assignment notification
      if (eventData.follow_up_assigned_to && eventData.follow_up_assigned_to !== eventData.recorded_by_staff_id) {
        const followUpInfo = eventData.follow_up_date 
          ? `Follow-up required by ${eventData.follow_up_date}.${eventData.follow_up_notes ? ' Notes: ' + eventData.follow_up_notes : ''}`
          : eventData.follow_up_notes || 'Follow-up action required.';
        
        staffAssignments.push({
          staffId: eventData.follow_up_assigned_to,
          type: 'Follow-up',
          additionalInfo: followUpInfo,
          priority: 'medium'
        });
      }

      // Add investigation assignment notification
      if (eventData.investigation_assigned_to && 
          eventData.investigation_assigned_to !== eventData.recorded_by_staff_id &&
          eventData.investigation_assigned_to !== eventData.follow_up_assigned_to) {
        const investigationInfo = eventData.expected_resolution_date
          ? `Investigation required. Expected resolution by ${eventData.expected_resolution_date}.`
          : 'Investigation required.';
        
        staffAssignments.push({
          staffId: eventData.investigation_assigned_to,
          type: 'Investigation',
          additionalInfo: investigationInfo,
          priority: 'high'
        });
      }

      // Create notifications for each staff assignment
      for (const assignment of staffAssignments) {
        try {
          const { data: staff } = await supabase
            .from('staff')
            .select('auth_user_id, first_name, last_name')
            .eq('id', assignment.staffId)
            .single();

          if (staff?.auth_user_id) {
            await supabase
              .from('notifications')
              .insert({
                user_id: staff.auth_user_id,
                branch_id: eventData.branch_id,
                type: 'task',
                category: assignment.type === 'Investigation' ? 'warning' : 'info',
                priority: assignment.priority,
                title: `${assignment.type} Assignment: ${data.title}`,
                message: assignment.additionalInfo || `You have been assigned to this event.`,
                data: {
                  event_id: data.id,
                  client_id: data.client_id,
                  event_type: data.event_type,
                  assignment_type: assignment.type.toLowerCase(),
                  follow_up_date: eventData.follow_up_date || null,
                  expected_resolution_date: eventData.expected_resolution_date || null
                }
              });
            console.log(`${assignment.type} notification created for staff:`, staff.first_name, staff.last_name);
          }
        } catch (notificationError) {
          console.error(`Error creating ${assignment.type} notification:`, notificationError);
        }
      }

      // Create client notification
      try {
        const { data: client } = await supabase
          .from('clients')
          .select('auth_user_id, first_name, last_name')
          .eq('id', eventData.client_id)
          .single();

        if (client?.auth_user_id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: client.auth_user_id,
              branch_id: eventData.branch_id,
              type: 'event_log',
              category: 'info',
              priority: data.severity === 'critical' ? 'high' : data.severity === 'high' ? 'medium' : 'low',
              title: 'Care Action Recorded',
              message: `A care event "${data.title}" has been recorded and is being followed up by your care team.`,
              data: {
                event_id: data.id,
                event_type: data.event_type,
                event_title: data.title,
                severity: data.severity
              }
            });
          console.log('Client notification created successfully');
        }
      } catch (clientNotificationError) {
        console.error('Error creating client notification:', clientNotificationError);
      }
      
      console.log('Created event log:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events-logs'] });
      queryClient.invalidateQueries({ queryKey: ['client-events', data.client_id] });
      queryClient.invalidateQueries({ queryKey: ['carer-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
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
      
      // Get the current event data first
      const { data: currentEvent } = await supabase
        .from('client_events_logs')
        .select('*, clients(branch_id)')
        .eq('id', id)
        .single();
      
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
      
      // Create notification for status changes to resolved/closed
      if (currentEvent && (status === 'resolved' || status === 'closed') && currentEvent.status !== status) {
        try {
          const branchId = currentEvent.clients?.branch_id;
          if (branchId) {
            const { data: branchAdmins } = await supabase
              .from('admin_branches')
              .select('admin_id')
              .eq('branch_id', branchId);

            // Create notifications for all branch admins
            for (const admin of branchAdmins || []) {
              await supabase
                .from('notifications')
                .insert({
                  user_id: admin.admin_id,
                  branch_id: branchId,
                  type: 'event_log',
                  category: 'info',
                  priority: 'medium',
                  title: `Event ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                  message: `Event "${currentEvent.title}" has been marked as ${status}.`,
                  data: {
                    event_id: data.id,
                    client_id: data.client_id,
                    event_type: data.event_type,
                    new_status: status,
                    old_status: currentEvent.status
                  }
                });
            }
          }
        } catch (notificationError) {
          console.error('Error creating status notification:', notificationError);
        }
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
