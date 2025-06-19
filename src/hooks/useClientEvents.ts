
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ClientEvent {
  id: string;
  client_id: string;
  title: string;
  event_type: string;
  severity: string;
  description?: string;
  status: string;
  reporter: string;
  created_at: string;
  updated_at: string;
}

export const useClientEvents = (clientId: string) => {
  return useQuery({
    queryKey: ["client-events", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from("client_events_logs")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching client events:", error);
        throw error;
      }

      return data as ClientEvent[];
    },
    enabled: !!clientId,
  });
};

export const useCreateClientEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventData: Omit<ClientEvent, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("client_events_logs")
        .insert([eventData])
        .select()
        .single();

      if (error) {
        console.error("Error creating client event:", error);
        throw error;
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
