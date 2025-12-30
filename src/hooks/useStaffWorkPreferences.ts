import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface StaffWorkPreferences {
  id: string;
  staff_id: string;
  client_types: string[];
  service_types: string[];
  work_patterns: string[];
  work_locations: string[];
  travel_distance: number;
  special_notes: string;
  created_at: string;
  updated_at: string;
}

export interface StaffWorkPreferencesInput {
  staff_id: string;
  client_types: string[];
  service_types: string[];
  work_patterns: string[];
  work_locations: string[];
  travel_distance: number;
  special_notes: string;
}

export const useStaffWorkPreferences = (staffId: string | undefined) => {
  return useQuery({
    queryKey: ["staff-work-preferences", staffId],
    queryFn: async () => {
      if (!staffId) return null;

      const { data, error } = await supabase
        .from("staff_work_preferences")
        .select("*")
        .eq("staff_id", staffId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching staff work preferences:", error);
        throw error;
      }

      return data as StaffWorkPreferences | null;
    },
    enabled: !!staffId,
  });
};

export const useUpdateStaffWorkPreferences = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (preferences: StaffWorkPreferencesInput) => {
      // Use upsert to handle both insert and update
      const { data, error } = await supabase
        .from("staff_work_preferences")
        .upsert(
          {
            staff_id: preferences.staff_id,
            client_types: preferences.client_types,
            service_types: preferences.service_types,
            work_patterns: preferences.work_patterns,
            work_locations: preferences.work_locations,
            travel_distance: preferences.travel_distance,
            special_notes: preferences.special_notes,
          },
          {
            onConflict: "staff_id",
          }
        )
        .select()
        .single();

      if (error) {
        console.error("Error saving staff work preferences:", error);
        throw error;
      }

      return data as StaffWorkPreferences;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["staff-work-preferences", data.staff_id],
      });
      toast({
        title: "Success",
        description: "Work preferences saved successfully.",
      });
    },
    onError: (error) => {
      console.error("Failed to save work preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save work preferences. Please try again.",
        variant: "destructive",
      });
    },
  });
};
