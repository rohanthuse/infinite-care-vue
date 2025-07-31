import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useBookingDebug(branchId?: string, bookings?: any[]) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!branchId) return;

    console.log("[BookingDebug] Branch ID:", branchId);
    console.log("[BookingDebug] Bookings count:", bookings?.length || 0);
    
    // Log query cache state
    const queryData = queryClient.getQueryData(["branch-bookings", branchId]);
    console.log("[BookingDebug] Query cache data:", queryData);
    
    // Log some sample bookings
    if (bookings && bookings.length > 0) {
      console.log("[BookingDebug] Sample bookings:", bookings.slice(0, 3).map(b => ({
        id: b.id,
        client_id: b.client_id,
        staff_id: b.staff_id,
        start_time: b.start_time,
        status: b.status
      })));
    }
  }, [branchId, bookings?.length, queryClient]);

  // Manual cache inspection
  const inspectCache = () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    const bookingQueries = queries.filter(q => 
      q.queryKey[0] === "branch-bookings" || 
      q.queryKey[0] === "client-bookings"
    );
    
    console.log("[BookingDebug] All booking-related queries:", bookingQueries.map(q => ({
      key: q.queryKey,
      state: q.state.status,
      dataLength: Array.isArray(q.state.data) ? q.state.data.length : 'N/A'
    })));
  };

  return { inspectCache };
}