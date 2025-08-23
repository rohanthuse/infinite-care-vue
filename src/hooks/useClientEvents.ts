
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { generateBodyMapImages } from "@/lib/bodyMapImageGenerator";

export interface ClientEvent {
  id: string;
  client_id: string;
  title: string;
  event_type: string;
  severity: string;
  description?: string;
  status: string;
  reporter: string;
  event_date?: string;
  event_time?: string;
  recorded_by_staff_id?: string;
  body_map_points?: any;
  body_map_front_image_url?: string;
  body_map_back_image_url?: string;
  created_at: string;
  updated_at: string;
  // Client information
  client_name?: string;
  client_first_name?: string;
  client_last_name?: string;
  // Staff information
  recorded_by_staff_name?: string;
}

export const useClientEvents = (clientId: string) => {
  return useQuery({
    queryKey: ["client-events", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from("client_events_logs")
        .select(`
          *,
          clients!inner(
            first_name,
            last_name
          )
        `)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching client events:", error);
        throw error;
      }

      // Transform the data to include client names
      const transformedData = data?.map(event => ({
        ...event,
        client_name: event.clients ? `${event.clients.first_name} ${event.clients.last_name}` : 'Unknown Client',
        client_first_name: event.clients?.first_name,
        client_last_name: event.clients?.last_name,
      })) || [];

      return transformedData as ClientEvent[];
    },
    enabled: !!clientId,
  });
};

export const useCreateClientEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventData: Omit<ClientEvent, "id" | "created_at" | "updated_at"> & { attachments?: File[] }) => {
      // Handle file attachments first
      let attachmentUrls: string[] = [];
      
      if (eventData.attachments && eventData.attachments.length > 0) {
        try {
          for (const file of eventData.attachments) {
            const fileExt = file.name.split('.').pop();
            const filePath = `${eventData.client_id}/${Date.now()}-${file.name}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('documents')
              .upload(filePath, file);
            
            if (uploadError) throw uploadError;
            
            attachmentUrls.push(uploadData.path);
            
            // Insert metadata into documents table
            await supabase
              .from('documents')
              .insert({
                name: file.name,
                type: 'attachment',
                category: 'event_attachment',
                file_path: uploadData.path,
                file_size: file.size.toString(),
                file_type: file.type,
                storage_bucket: 'documents',
                client_id: eventData.client_id,
                uploaded_by_name: 'System'
              });
          }
        } catch (error) {
          console.error('Error uploading attachments:', error);
          throw new Error('Failed to upload attachments');
        }
      }

      // Create the event record
      const eventRecord = {
        ...eventData,
        attachments: attachmentUrls.length > 0 ? attachmentUrls : undefined
      };
      delete eventRecord.attachments; // Remove File objects from the database insert
      
      const { data, error } = await supabase
        .from("client_events_logs")
        .insert([eventRecord])
        .select()
        .single();

      if (error) {
        console.error("Error creating client event:", error);
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
              return { ...data, ...updateData };
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
            .eq('branch_id', eventData.client_id); // Assuming we have branch info from client

          // Create notifications for all branch admins
          for (const admin of branchAdmins || []) {
            await supabase
              .from('notifications')
              .insert({
                user_id: admin.admin_id,
                type: 'client_event',
                category: 'warning',
                priority: data.severity === 'critical' ? 'urgent' : 'high',
                title: `${data.severity.toUpperCase()} Event: ${data.title}`,
                message: `A ${data.severity} severity event has been recorded for client.`,
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

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["client-events", data.client_id] });
      
      toast({
        title: "Event created",
        description: "The event has been successfully recorded.",
      });
    },
    onError: (error) => {
      console.error("Error creating client event:", error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateClientEventStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("client_events_logs")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating client event status:", error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["client-events"] });
      
      toast({
        title: "Status updated",
        description: `Event status updated to ${data.status}`,
      });
    },
    onError: (error) => {
      console.error("Error updating client event status:", error);
      toast({
        title: "Error",
        description: "Failed to update event status",
        variant: "destructive",
      });
    },
  });
};
