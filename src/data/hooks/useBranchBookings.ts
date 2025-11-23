
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BookingDB {
  id: string;
  client_id: string | null;
  staff_id: string | null;
  branch_id: string | null;
  start_time: string;
  end_time: string;
  revenue: number | null;
  service_id: string | null;
  created_at: string | null;
  status: string | null;
  notes: string | null;
  cancellation_request_status: 'pending' | 'approved' | 'rejected' | null;
  reschedule_request_status: 'pending' | 'approved' | 'rejected' | null;
  booking_unavailability_requests?: Array<{
    id: string;
    status: 'pending' | 'approved' | 'rejected' | 'reassigned';
    reason: string;
    notes?: string;
    requested_at: string;
    reviewed_at?: string;
    admin_notes?: string;
  }>;
}

export async function fetchBranchBookings(branchId?: string) {
  console.log("[fetchBranchBookings] Fetching bookings for branch:", branchId);
  
  if (!branchId) {
    console.log("[fetchBranchBookings] No branch ID provided");
    return [];
  }
  
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id, client_id, staff_id, branch_id, start_time, end_time, 
      revenue, service_id, created_at, status, notes,
      cancellation_request_status,
      reschedule_request_status,
      booking_unavailability_requests!booking_id (
        id,
        status,
        reason,
        notes,
        requested_at,
        reviewed_at,
        admin_notes
      )
    `)
    .eq("branch_id", branchId)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("[fetchBranchBookings] Error fetching bookings:", error);
    throw error;
  }
  
  console.log("[fetchBranchBookings] Successfully fetched", data?.length || 0, "bookings");
  return data || [];
}

export function useBranchBookings(branchId?: string) {
  const result = useQuery({
    queryKey: ["branch-bookings", branchId],
    queryFn: () => fetchBranchBookings(branchId),
    enabled: !!branchId,
    staleTime: 1000 * 30, // 30 seconds - keeps data fresh
  });

  // Log query results
  if (result.data) {
    console.log("[useBranchBookings] Query success - fetched", result.data?.length || 0, "bookings for branch:", branchId);
  }
  if (result.error) {
    console.error("[useBranchBookings] Query error for branch", branchId, ":", result.error);
  }

  return result;
}
