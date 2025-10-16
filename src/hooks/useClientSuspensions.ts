import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { markBookingsForStaffPayment, removeBookingsStaffPaymentProtection } from "@/services/StaffPaymentProtectionService";

type ClientStatusHistory = Database["public"]["Tables"]["client_status_history"]["Row"];
type ClientStatusHistoryInsert = Database["public"]["Tables"]["client_status_history"]["Insert"];

interface SuspensionStatus {
  is_suspended: boolean;
  suspension_id?: string;
  suspension_type?: string;
  effective_from?: string;
  effective_until?: string;
  reason?: string;
  apply_to?: any;
}

interface SuspendClientData {
  clientId: string;
  data: {
    suspension_type: "temporary" | "indefinite";
    reason: string;
    details?: string | null;
    effective_from: string;
    effective_until?: string | null;
    apply_to: {
      visits: boolean;
      serviceActions: boolean;
      billing: boolean;
      messaging: boolean;
    };
    notify: {
      client: boolean;
      nextOfKin: boolean;
      carers: boolean;
      admin: boolean;
      ccEmails?: string[];
    };
    attachments: Array<{
      name: string;
      size: number;
      type: string;
    }>;
  };
}

interface EndSuspensionData {
  clientId: string;
  suspensionId: string;
}

interface UpdateSuspensionData {
  suspensionId: string;
  clientId: string;
  data: {
    suspension_type: "temporary" | "indefinite";
    reason: string;
    details?: string | null;
    effective_from: string;
    effective_until?: string | null;
  };
}

interface DeleteSuspensionData {
  suspensionId: string;
  clientId: string;
}

// Fetch client suspension status
const fetchClientSuspensions = async (clientId: string): Promise<SuspensionStatus | null> => {
  if (!clientId) return null;

  try {
    const { data, error } = await supabase.rpc("get_client_suspension_status", {
      client_id_param: clientId,
    });

    if (error) {
      console.error("Error fetching suspension status:", error);
      throw error;
    }

    return data?.[0] || { is_suspended: false };
  } catch (error) {
    console.error("Failed to fetch client suspension status:", error);
    throw error;
  }
};

// Suspend client
const suspendClient = async ({ clientId, data }: SuspendClientData): Promise<void> => {
  console.log('[suspendClient] Starting suspension process', { clientId, data });
  
  const { error } = await supabase.from("client_status_history").insert({
    client_id: clientId,
    action: "suspend",
    from_status: "Active",
    to_status: "Suspended",
    suspension_type: data.suspension_type,
    reason: data.reason,
    details: data.details,
    effective_from: data.effective_from,
    effective_until: data.effective_until,
    apply_to: data.apply_to,
    notify: data.notify,
    attachments: data.attachments,
    created_by: (await supabase.auth.getUser()).data.user?.id || null,
  });

  if (error) {
    console.error('[suspendClient] Error suspending client:', error);
    throw error;
  }

  // Update client status
  const { error: updateError } = await supabase
    .from("clients")
    .update({ status: "Suspended" })
    .eq("id", clientId);

  if (updateError) {
    console.error('[suspendClient] Error updating client status:', updateError);
    throw updateError;
  }

  // CRITICAL: If "Pay Staff" was checked, mark bookings for payment protection
  if (data.notify.carers) {
    console.log('[suspendClient] "Pay Staff" checked - protecting staff payment for bookings');
    const { success, affectedCount } = await markBookingsForStaffPayment(
      clientId,
      data.effective_from,
      data.effective_until || null
    );
    
    if (success && affectedCount > 0) {
      console.log(`[suspendClient] Protected payment for ${affectedCount} bookings`);
    }
  }
  
  console.log('[suspendClient] Successfully suspended client');
};

// End suspension
const endSuspension = async ({ clientId, suspensionId }: EndSuspensionData): Promise<void> => {
  console.log('[endSuspension] Ending suspension', { clientId, suspensionId });
  
  const { error } = await supabase.from("client_status_history").insert({
    client_id: clientId,
    action: "resume",
    from_status: "Suspended",
    to_status: "Active",
    effective_from: new Date().toISOString(),
    apply_to: {},
    notify: {},
    attachments: [],
    created_by: (await supabase.auth.getUser()).data.user?.id || null,
  });

  if (error) {
    console.error('[endSuspension] Error ending suspension:', error);
    throw error;
  }

  // Update client status back to Active
  const { error: updateError } = await supabase
    .from("clients")
    .update({ status: "Active" })
    .eq("id", clientId);

  if (updateError) {
    console.error('[endSuspension] Error updating client status:', updateError);
    throw updateError;
  }

  // CRITICAL: Remove staff payment protection when suspension ends
  console.log('[endSuspension] Removing staff payment protection from bookings');
  const { success, affectedCount } = await removeBookingsStaffPaymentProtection(clientId);
  
  if (success && affectedCount > 0) {
    console.log(`[endSuspension] Removed payment protection from ${affectedCount} bookings`);
  }
  
  console.log('[endSuspension] Successfully ended suspension');
};

// Update suspension
const updateSuspension = async ({ suspensionId, clientId, data }: UpdateSuspensionData): Promise<void> => {
  const { error } = await supabase
    .from("client_status_history")
    .update({
      suspension_type: data.suspension_type,
      reason: data.reason,
      details: data.details,
      effective_from: data.effective_from,
      effective_until: data.effective_until,
      updated_at: new Date().toISOString(),
    })
    .eq("id", suspensionId);

  if (error) {
    console.error("Error updating suspension:", error);
    throw error;
  }
};

// Delete suspension
const deleteSuspension = async ({ suspensionId, clientId }: DeleteSuspensionData): Promise<void> => {
  const { error } = await supabase
    .from("client_status_history")
    .delete()
    .eq("id", suspensionId);

  if (error) {
    console.error("Error deleting suspension:", error);
    throw error;
  }

  // Update client status back to Active if this was the active suspension
  const { error: updateError } = await supabase
    .from("clients")
    .update({ status: "Active" })
    .eq("id", clientId);

  if (updateError) {
    console.error("Error updating client status after deletion:", updateError);
    throw updateError;
  }
};

// Fetch suspension history
const fetchSuspensionHistory = async (clientId: string): Promise<ClientStatusHistory[]> => {
  if (!clientId) return [];

  const { data, error } = await supabase
    .from("client_status_history")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching suspension history:", error);
    throw error;
  }

  return data || [];
};

// Hooks
export const useClientSuspensions = (clientId: string) => {
  return useQuery({
    queryKey: ["client-suspensions", clientId],
    queryFn: () => fetchClientSuspensions(clientId),
    enabled: !!clientId,
  });
};

export const useSuspendClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: suspendClient,
    onSuccess: (_, variables) => {
      // Invalidate and refetch suspension status
      queryClient.invalidateQueries({
        queryKey: ["client-suspensions", variables.clientId],
      });
      
      // Invalidate client data queries to reflect status change
      queryClient.invalidateQueries({
        queryKey: ["admin-client-detail", variables.clientId],
      });
    },
  });
};

export const useEndSuspension = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: endSuspension,
    onSuccess: (_, variables) => {
      // Invalidate and refetch suspension status
      queryClient.invalidateQueries({
        queryKey: ["client-suspensions", variables.clientId],
      });
      
      // Invalidate client data queries to reflect status change
      queryClient.invalidateQueries({
        queryKey: ["admin-client-detail", variables.clientId],
      });
    },
  });
};

export const useUpdateSuspension = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSuspension,
    onSuccess: (_, variables) => {
      // Invalidate and refetch suspension status
      queryClient.invalidateQueries({
        queryKey: ["client-suspensions", variables.clientId],
      });
      
      // Invalidate suspension history
      queryClient.invalidateQueries({
        queryKey: ["suspension-history", variables.clientId],
      });
    },
    onError: (error, variables) => {
      console.error('[useUpdateSuspension] Error during update:', error);
      // Clear stale queries on error to prevent UI freeze
      queryClient.invalidateQueries({
        queryKey: ["suspension-history", variables.clientId],
      });
    },
    // Add retry with exponential backoff
    retry: 1,
  });
};

export const useDeleteSuspension = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSuspension,
    onSuccess: (_, variables) => {
      // Invalidate and refetch suspension status
      queryClient.invalidateQueries({
        queryKey: ["client-suspensions", variables.clientId],
      });
      
      // Invalidate suspension history
      queryClient.invalidateQueries({
        queryKey: ["suspension-history", variables.clientId],
      });

      // Invalidate client data queries to reflect status change
      queryClient.invalidateQueries({
        queryKey: ["admin-client-detail", variables.clientId],
      });
    },
  });
};

export const useSuspensionHistory = (clientId: string) => {
  return useQuery({
    queryKey: ["suspension-history", clientId],
    queryFn: () => fetchSuspensionHistory(clientId),
    enabled: !!clientId,
  });
};