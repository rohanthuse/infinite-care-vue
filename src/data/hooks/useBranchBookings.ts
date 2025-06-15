
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
}

export async function fetchBranchBookings(branchId?: string) {
  if (!branchId) return [];
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, client_id, staff_id, branch_id, start_time, end_time, revenue, service_id, created_at"
    )
    .eq("branch_id", branchId)
    .order("start_time", { ascending: true });

  if (error) throw error;
  return data || [];
}

export function useBranchBookings(branchId?: string) {
  return useQuery({
    queryKey: ["branch-bookings", branchId],
    queryFn: () => fetchBranchBookings(branchId),
    enabled: !!branchId,
  });
}
