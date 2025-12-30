
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ClientServiceAction {
  id: string;
  client_id: string;
  care_plan_id?: string;
  service_name: string;
  service_category: string;
  provider_name: string;
  frequency: string;
  duration: string;
  schedule_details?: string;
  goals?: string[];
  progress_status: string;
  start_date: string;
  end_date?: string;
  last_completed_date?: string;
  next_scheduled_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  source?: 'care_plan' | 'client_details';
}

export const useClientServiceActions = (clientId: string) => {
  return useQuery({
    queryKey: ["client-service-actions", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from("client_service_actions")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching client service actions:", error);
        throw error;
      }

      // Add source indicator based on care_plan_id
      return (data || []).map(action => ({
        ...action,
        source: action.care_plan_id ? 'care_plan' : 'client_details'
      })) as ClientServiceAction[];
    },
    enabled: !!clientId,
  });
};

export const useCreateClientServiceAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serviceActionData: Omit<ClientServiceAction, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("client_service_actions")
        .insert([serviceActionData])
        .select()
        .single();

      if (error) {
        console.error("Error creating service action:", error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["client-service-actions", data.client_id] });
      toast({
        title: "Service action created",
        description: "The service action has been successfully created.",
      });
    },
    onError: (error) => {
      console.error("Error creating service action:", error);
      toast({
        title: "Error",
        description: "Failed to create service action. Please try again.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateClientServiceAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      serviceActionId,
      updates,
    }: {
      serviceActionId: string;
      updates: Partial<ClientServiceAction>;
    }) => {
      const { data, error } = await supabase
        .from("client_service_actions")
        .update(updates)
        .eq("id", serviceActionId)
        .select()
        .single();

      if (error) {
        console.error("Error updating service action:", error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["client-service-actions", data.client_id] });
      toast({
        title: "Service action updated",
        description: "The service action has been successfully updated.",
      });
    },
    onError: (error) => {
      console.error("Error updating service action:", error);
      toast({
        title: "Error",
        description: "Failed to update service action. Please try again.",
        variant: "destructive",
      });
    },
  });
};
