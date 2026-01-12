import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { getUserTimezone } from "@/utils/timezoneUtils";

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
  service_ids?: string[];
  created_at: string | null;
  status: string | null;
  notes: string | null;
  location_address: string | null;
  cancellation_request_status: 'pending' | 'approved' | 'rejected' | null;
  reschedule_request_status: 'pending' | 'approved' | 'rejected' | null;
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

export interface BranchBookingsRangeResult {
  bookings: BookingDB[];
  totalCount: number;
}

/**
 * Compute date range (start/end UTC ISO strings) based on viewType and selectedDate
 */
export function computeDateRange(
  selectedDate: Date,
  viewType: "daily" | "weekly" | "monthly"
): { startUtc: string; endUtc: string } {
  const timezone = getUserTimezone();
  
  let localStart: Date;
  let localEnd: Date;
  
  switch (viewType) {
    case "weekly":
      localStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
      localEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      break;
    case "monthly":
      localStart = startOfMonth(selectedDate);
      localEnd = endOfMonth(selectedDate);
      break;
    case "daily":
    default:
      localStart = startOfDay(selectedDate);
      localEnd = endOfDay(selectedDate);
      break;
  }
  
  // Convert local times to UTC for database query
  const startUtc = fromZonedTime(localStart, timezone).toISOString();
  const endUtc = fromZonedTime(localEnd, timezone).toISOString();
  
  console.log("[computeDateRange]", {
    viewType,
    selectedDate: selectedDate.toISOString(),
    timezone,
    localStart: localStart.toISOString(),
    localEnd: localEnd.toISOString(),
    startUtc,
    endUtc
  });
  
  return { startUtc, endUtc };
}

export async function fetchBranchBookingsInRange(
  branchId: string,
  startUtc: string,
  endUtc: string
): Promise<BranchBookingsRangeResult> {
  console.log("[fetchBranchBookingsInRange] Fetching bookings:", { branchId, startUtc, endUtc });
  
  const { data, error, count } = await supabase
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
    `, { count: 'exact' })
    .eq("branch_id", branchId)
    .gte("start_time", startUtc)
    .lt("start_time", endUtc)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("[fetchBranchBookingsInRange] Error:", error);
    throw error;
  }
  
  // Map bookings to include service_ids array
  const mappedData = (data || []).map((booking: any) => ({
    ...booking,
    service_ids: booking.booking_services?.map((bs: any) => bs.service_id) || 
                 (booking.service_id ? [booking.service_id] : []),
    clients: booking.clients || null,
  }));
  
  console.log("[fetchBranchBookingsInRange] Success:", {
    count: mappedData.length,
    totalCount: count,
    dateRange: `${startUtc} to ${endUtc}`
  });
  
  return { bookings: mappedData, totalCount: count || 0 };
}

/**
 * Hook to fetch bookings for a specific date range based on view type.
 * This replaces the old "fetch first 1000" approach to ensure we get the correct bookings.
 */
export function useBranchBookingsInRange(
  branchId?: string,
  selectedDate?: Date,
  viewType: "daily" | "weekly" | "monthly" = "daily"
) {
  // Compute date range
  const { startUtc, endUtc } = selectedDate 
    ? computeDateRange(selectedDate, viewType)
    : { startUtc: "", endUtc: "" };
  
  const result = useQuery({
    queryKey: ["branch-bookings-range", branchId, startUtc, endUtc],
    queryFn: () => fetchBranchBookingsInRange(branchId!, startUtc, endUtc),
    enabled: !!branchId && !!startUtc && !!endUtc,
    staleTime: 1000 * 30, // 30 seconds
  });

  // Log query results
  if (result.data) {
    console.log("[useBranchBookingsInRange] Query success:", {
      bookingsCount: result.data?.bookings?.length || 0,
      totalCount: result.data?.totalCount,
      branchId,
      dateRange: `${startUtc} to ${endUtc}`
    });
  }
  if (result.error) {
    console.error("[useBranchBookingsInRange] Query error:", result.error);
  }

  return {
    ...result,
    data: result.data?.bookings || [],
    totalCount: result.data?.totalCount || 0,
  };
}
