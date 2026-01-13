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

export interface BranchBookingsAllResult {
  bookings: BookingDB[];
  totalCount: number;
}

export interface BookingFilters {
  dateFrom?: string;     // yyyy-MM-dd format
  dateTo?: string;       // yyyy-MM-dd format
  statusFilter?: string; // 'all', 'late', 'missed', 'assigned', etc.
}

/**
 * Fetch bookings for a branch with server-side pagination and filtering.
 * Supports date range and status filters applied at the database level.
 */
export async function fetchBranchBookingsAll(
  branchId: string,
  page: number = 1,
  pageSize: number = 100,
  filters?: BookingFilters
): Promise<BranchBookingsAllResult> {
  console.log("[fetchBranchBookingsAll] Fetching bookings:", { branchId, page, pageSize, filters });
  
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  let query = supabase
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
    .eq("branch_id", branchId);
  
  // Apply date range filters (server-side)
  if (filters?.dateFrom) {
    // Filter bookings where start_time >= dateFrom at midnight
    query = query.gte("start_time", `${filters.dateFrom}T00:00:00`);
  }
  if (filters?.dateTo) {
    // Filter bookings where start_time <= dateTo at end of day
    query = query.lte("start_time", `${filters.dateTo}T23:59:59`);
  }
  
  // Apply status filter (server-side)
  if (filters?.statusFilter && filters.statusFilter !== 'all') {
    if (filters.statusFilter === 'late') {
      // Late arrivals: is_late_start = true AND not missed
      query = query.eq("is_late_start", true).eq("is_missed", false);
    } else if (filters.statusFilter === 'missed') {
      // Missed bookings
      query = query.eq("is_missed", true);
    } else {
      // Standard status filter (assigned, done, cancelled, etc.)
      query = query.eq("status", filters.statusFilter);
    }
  }
  
  // Apply ordering and pagination
  query = query
    .order("start_time", { ascending: true }) // Oldest first for chronological viewing
    .range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("[fetchBranchBookingsAll] Error:", error);
    throw error;
  }
  
  // Map bookings to include service_ids array
  const mappedData = (data || []).map((booking: any) => ({
    ...booking,
    service_ids: booking.booking_services?.map((bs: any) => bs.service_id) || 
                 (booking.service_id ? [booking.service_id] : []),
    clients: booking.clients || null,
  }));
  
  console.log("[fetchBranchBookingsAll] Success:", {
    fetchedCount: mappedData.length,
    totalCount: count,
    page,
    pageSize,
    filters
  });
  
  return { bookings: mappedData, totalCount: count || 0 };
}

/**
 * Hook to fetch bookings for a branch with server-side pagination and filtering.
 * Ideal for the List view where users want to search/filter across all bookings.
 */
export function useBranchBookingsAll(
  branchId?: string,
  options?: {
    enabled?: boolean;
    page?: number;
    pageSize?: number;
    // Server-side filters
    dateFrom?: string;
    dateTo?: string;
    statusFilter?: string;
  }
) {
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 100; // Default to 100 per page for server-side pagination
  const enabled = options?.enabled !== false && !!branchId;
  
  // Build filters object
  const filters: BookingFilters = {
    dateFrom: options?.dateFrom,
    dateTo: options?.dateTo,
    statusFilter: options?.statusFilter,
  };
  
  // Include filters in query key for proper cache invalidation
  const result = useQuery({
    queryKey: ["branch-bookings-all", branchId, page, pageSize, filters.dateFrom, filters.dateTo, filters.statusFilter],
    queryFn: () => fetchBranchBookingsAll(branchId!, page, pageSize, filters),
    enabled,
    staleTime: 1000 * 30, // 30 seconds - shorter for paginated data
  });

  // Log query results
  if (result.data) {
    console.log("[useBranchBookingsAll] Query success:", {
      bookingsCount: result.data?.bookings?.length || 0,
      totalCount: result.data?.totalCount,
      branchId,
      page,
      filters
    });
  }
  if (result.error) {
    console.error("[useBranchBookingsAll] Query error:", result.error);
  }

  return {
    ...result,
    bookings: result.data?.bookings || [],
    totalCount: result.data?.totalCount || 0,
  };
}
