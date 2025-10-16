import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Mark bookings for staff payment protection during suspension period
 * This ensures staff still get paid even if client is suspended
 */
export const markBookingsForStaffPayment = async (
  clientId: string,
  suspensionStartDate: string,
  suspensionEndDate: string | null
): Promise<{ success: boolean; affectedCount: number }> => {
  try {
    console.log("[StaffPaymentProtection] Marking bookings for payment protection", {
      clientId,
      suspensionStartDate,
      suspensionEndDate,
    });

    // Build query to find all bookings during suspension period
    let query = supabase
      .from("bookings")
      .update({ suspension_honor_staff_payment: true })
      .eq("client_id", clientId)
      .gte("start_time", suspensionStartDate);

    // If there's an end date, limit to that period
    if (suspensionEndDate) {
      query = query.lte("start_time", suspensionEndDate);
    }

    const { data, error, count } = await query.select("id");

    if (error) {
      console.error("[StaffPaymentProtection] Error marking bookings:", error);
      toast.error("Failed to protect staff payment", {
        description: "Could not mark bookings for payment protection.",
      });
      return { success: false, affectedCount: 0 };
    }

    const affectedCount = data?.length || 0;
    
    console.log(`[StaffPaymentProtection] Successfully marked ${affectedCount} bookings for payment protection`);
    
    return { success: true, affectedCount };
  } catch (err) {
    console.error("[StaffPaymentProtection] Unexpected error:", err);
    toast.error("Unexpected error protecting staff payment");
    return { success: false, affectedCount: 0 };
  }
};

/**
 * Remove payment protection from bookings when suspension ends or is cancelled
 */
export const removeBookingsStaffPaymentProtection = async (
  clientId: string
): Promise<{ success: boolean; affectedCount: number }> => {
  try {
    console.log("[StaffPaymentProtection] Removing payment protection", { clientId });

    const { data, error } = await supabase
      .from("bookings")
      .update({ suspension_honor_staff_payment: false })
      .eq("client_id", clientId)
      .eq("suspension_honor_staff_payment", true)
      .select("id");

    if (error) {
      console.error("[StaffPaymentProtection] Error removing protection:", error);
      return { success: false, affectedCount: 0 };
    }

    const affectedCount = data?.length || 0;
    console.log(`[StaffPaymentProtection] Removed protection from ${affectedCount} bookings`);
    
    return { success: true, affectedCount };
  } catch (err) {
    console.error("[StaffPaymentProtection] Unexpected error:", err);
    return { success: false, affectedCount: 0 };
  }
};
