import { supabase } from "@/integrations/supabase/client";

export interface SuspensionStatus {
  isSuspended: boolean;
  billingSuspended: boolean;
  visitsSuspended: boolean;
  reason?: string;
  effectiveFrom?: string;
  effectiveUntil?: string;
  suspensionType?: string;
}

/**
 * Check if a client is suspended and whether billing is affected
 */
export const checkClientSuspensionForBilling = async (
  clientId: string
): Promise<SuspensionStatus> => {
  try {
    const { data, error } = await supabase.rpc("get_client_suspension_status", {
      client_id_param: clientId,
    });

    if (error) {
      console.error("[SuspensionService] Error checking suspension:", error);
      return { isSuspended: false, billingSuspended: false, visitsSuspended: false };
    }

    if (!data || data.length === 0 || !data[0]?.is_suspended) {
      return { isSuspended: false, billingSuspended: false, visitsSuspended: false };
    }

    const suspensionData = data[0];
    const applyTo = (suspensionData.apply_to as any) || {};
    
    // billing: false means "Remove from Invoice" was checked
    const billingBlocked = applyTo.billing === false;
    // visits: true means visits are blocked
    const visitsBlocked = applyTo.visits === true;

    return {
      isSuspended: true,
      billingSuspended: billingBlocked,
      visitsSuspended: visitsBlocked,
      reason: suspensionData.reason,
      effectiveFrom: suspensionData.effective_from,
      effectiveUntil: suspensionData.effective_until,
      suspensionType: suspensionData.suspension_type,
    };
  } catch (err) {
    console.error("[SuspensionService] Unexpected error:", err);
    return { isSuspended: false, billingSuspended: false, visitsSuspended: false };
  }
};

/**
 * Get list of suspended client IDs with billing suspended
 * Used to filter invoice queries
 */
export const getSuspendedClientIdsForBilling = async (
  branchId: string
): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from("client_status_history")
      .select("client_id, apply_to")
      .eq("action", "suspend")
      .lte("effective_from", new Date().toISOString())
      .or(`effective_until.is.null,effective_until.gt.${new Date().toISOString()}`);

    if (error) {
      console.error("[SuspensionService] Error fetching suspended clients:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Filter to only clients with billing suspended (apply_to.billing = false)
    const suspendedClientIds = data
      .filter((record) => {
        const applyTo = record.apply_to as { billing?: boolean } | null;
        return applyTo?.billing === false;
      })
      .map((record) => record.client_id);

    return suspendedClientIds;
  } catch (err) {
    console.error("[SuspensionService] Unexpected error:", err);
    return [];
  }
};
