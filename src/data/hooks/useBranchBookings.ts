
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClientAddressDB {
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  state_county?: string | null;
  postcode: string;
  country?: string | null;
  is_default: boolean | null;
}

export interface BookingDB {
  id: string;
  client_id: string | null;
  staff_id: string | null;
  branch_id: string | null;
  start_time: string;
  end_time: string;
  revenue: number | null;
  service_id: string | null;
  service_ids?: string[]; // New: array of service IDs from junction table
  created_at: string | null;
  status: string | null;
  notes: string | null;
  location_address: string | null;
  cancellation_request_status: 'pending' | 'approved' | 'rejected' | null;
  reschedule_request_status: 'pending' | 'approved' | 'rejected' | null;
  // Late/missed booking fields
  is_late_start: boolean | null;
  is_missed: boolean | null;
  late_start_minutes: number | null;
  late_start_notified_at: string | null;
  missed_notified_at: string | null;
  booking_unavailability_requests?: Array<{
    id: string;
    status: 'pending' | 'approved' | 'rejected' | 'reassigned';
    reason: string;
    notes?: string;
    requested_at: string;
    reviewed_at?: string;
    admin_notes?: string;
  }>;
  booking_services?: Array<{
    service_id: string;
    services: { id: string; title: string } | null;
  }>;
  visit_records?: Array<{
    id: string;
    visit_start_time: string | null;
    visit_end_time: string | null;
    status: string;
  }>;
  clients?: {
    id: string;
    first_name: string;
    last_name: string;
    address: string | null;
    client_addresses: ClientAddressDB[];
  } | null;
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
      revenue, service_id, created_at, status, notes, location_address,
      cancellation_request_status,
      reschedule_request_status,
      is_late_start,
      is_missed,
      late_start_minutes,
      late_start_notified_at,
      missed_notified_at,
      clients!client_id (
        id,
        first_name,
        last_name,
        address,
        client_addresses (
          address_line_1,
          address_line_2,
          city,
          state_county,
          postcode,
          country,
          is_default
        )
      ),
      booking_unavailability_requests!booking_id (
        id,
        status,
        reason,
        notes,
        requested_at,
        reviewed_at,
        admin_notes
      ),
      booking_services (
        service_id,
        services (
          id,
          title
        )
      ),
      visit_records (
        id,
        visit_start_time,
        visit_end_time,
        status
      )
    `)
    .eq("branch_id", branchId)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("[fetchBranchBookings] Error fetching bookings:", error);
    throw error;
  }
  
  // Map bookings to include service_ids array and client data
  const mappedData = (data || []).map((booking: any) => ({
    ...booking,
    service_ids: booking.booking_services?.map((bs: any) => bs.service_id) || 
                 (booking.service_id ? [booking.service_id] : []),
    clients: booking.clients || null,
  }));
  
  console.log("[fetchBranchBookings] Successfully fetched", mappedData.length, "bookings");
  return mappedData;
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
