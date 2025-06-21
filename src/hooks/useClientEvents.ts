
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
  body_map_points?: any;
  body_map_front_image_url?: string;
  body_map_back_image_url?: string;
  created_at: string;
  updated_at: string;
  // Client information
  client_name?: string;
  client_first_name?: string;
  client_last_name?: string;
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
    mutationFn: async (eventData: Omit<ClientEvent, "id" | "created_at" | "updated_at">) => {
      // First, create the event record to get the ID
      const { data, error } = await supabase
        .from("client_events_logs")
        .insert([eventData])
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

      return data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch client events
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
