import { useMemo, useEffect } from "react";
import { Client, Carer, Booking } from "../BookingTimeGrid";
import { useBranchBookingsInRange } from "@/data/hooks/useBranchBookingsInRange";
import { useBranchClients } from "@/data/hooks/useBranchClients";
import { useBranchCarers } from "@/data/hooks/useBranchCarers";
import { useAuthSafe } from "@/hooks/useAuthSafe";
import { toast } from "sonner";
import { 
  mapDBClientToClient, 
  mapDBCarerToCarer,
  getOrCreatePlaceholderClient,
  getOrCreatePlaceholderCarer,
  safeName,
  safeInitials
} from "../utils/dataMappers";
import { makeDummyBookings, dummyClients, dummyCarers } from "../utils/dummyDataGenerator";
import { formatInUserTimezone, getUserTimezone } from '@/utils/timezoneUtils';
import { toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';
import { getClientDisplayAddress } from '@/utils/addressUtils';

/**
 * Hook to fetch booking data for a specific date range.
 * Uses range-based fetching to ensure we get bookings for the selected date.
 */
export function useBookingData(
  branchId?: string,
  selectedDate?: Date,
  viewType: "daily" | "weekly" | "monthly" = "daily"
) {
  const { user, loading: authLoading, error: authError } = useAuthSafe();
  
  // Use current date as fallback if no selectedDate provided
  const effectiveDate = selectedDate || new Date();
  
  // Debug authentication state for booking data fetch
  console.log("[useBookingData] Auth Debug:", {
    user: !!user,
    userEmail: user?.email,
    authLoading,
    authError,
    branchId,
    selectedDate: effectiveDate.toISOString(),
    viewType,
    timestamp: new Date().toISOString()
  });
  
  // Only fetch data if branchId is provided
  const shouldFetchData = !!branchId;
  
  console.log("[useBookingData] Fetch Decision:", {
    shouldFetchData,
    user: !!user,
    authLoading,
    branchId: !!branchId,
    reason: shouldFetchData ? "branchId provided" : "no branchId"
  });
  
  // Use range-based booking fetch instead of fetching all bookings
  const { 
    data: bookingsDB = [], 
    totalCount: totalBookingsCount, 
    isLoading: isLoadingBookings, 
    error: bookingsError 
  } = useBranchBookingsInRange(
    shouldFetchData ? branchId : undefined,
    effectiveDate,
    viewType
  );
  
  const {
    data: clientsResponse,
    isLoading: isLoadingClients,
    error: clientsError
  } = useBranchClients({
    branchId: shouldFetchData ? branchId : undefined,
    searchTerm: "",
    // Use 'all' to include inactive clients for historical booking display
    statusFilter: 'all',
    page: 1,
    itemsPerPage: 500
  });
  
  const { data: carersData = [], isLoading: isLoadingCarers, error: carersError } = useBranchCarers(
    shouldFetchData ? branchId : undefined
  );

  // Monitor authentication state and show appropriate errors
  useEffect(() => {
    console.log('[useBookingData] Auth Monitor Effect:', {
      authLoading,
      hasUser: !!user,
      userEmail: user?.email,
      shouldFetchData,
      branchId
    });
    
    if (!authLoading && !user) {
      console.warn('[useBookingData] No authenticated user - booking data will be limited');
    }
    
    if (bookingsError || clientsError || carersError) {
      console.error('[useBookingData] Data fetch errors:', {
        bookingsError,
        clientsError, 
        carersError
      });
      
      // Show error toast if there are data fetch issues (only if user is authenticated)
      if (user && (bookingsError || clientsError || carersError)) {
        toast.error('Failed to load booking data', {
          description: 'Please check your connection and try refreshing the page'
        });
      }
    }
  }, [user, authLoading, bookingsError, clientsError, carersError, shouldFetchData, branchId]);

  const { clients, carers, bookings } = useMemo(() => {
    console.log("[useBookingData] ===== PROCESSING RAW DATA =====");
    console.log("- Auth State:", { user: !!user, authLoading, shouldFetchData });
    console.log("- clientsResponse:", clientsResponse);
    console.log("- carersData:", carersData);
    console.log("- bookingsDB count:", bookingsDB?.length || 0);
    console.log("- branchId:", branchId);
    console.log("- selectedDate:", effectiveDate.toISOString());
    console.log("- viewType:", viewType);
    
    // Log first few bookings for debugging
    if (bookingsDB?.length > 0) {
      console.log("- Sample bookings:", bookingsDB.slice(0, 3).map(b => ({
        id: b.id,
        start_time: b.start_time,
        client_id: b.client_id,
        staff_id: b.staff_id
      })));
    }

    // Extract clients from the response
    let clientsRaw = [];
    if (clientsResponse && Array.isArray(clientsResponse.clients)) {
      clientsRaw = clientsResponse.clients;
    }

    // Extract carers
    const carersRaw = Array.isArray(carersData) ? carersData : [];
    
    console.log("[useBookingData] Extracted raw data:");
    console.log("- clientsRaw length:", clientsRaw.length);
    console.log("- carersRaw length:", carersRaw.length);

    // Map to our internal format - only use dummy data if no branchId (demo mode)
    const resolvedClients: Client[] = clientsRaw.length > 0
      ? clientsRaw.map(mapDBClientToClient)
      : (branchId ? [] : dummyClients);

    const resolvedCarers: Carer[] = carersRaw.length > 0
      ? carersRaw.map(mapDBCarerToCarer)
      : (branchId ? [] : dummyCarers);

    console.log("[useBookingData] Resolved entities:");
    console.log("- resolvedClients length:", resolvedClients.length);
    console.log("- resolvedCarers length:", resolvedCarers.length);

    // Create id-to-object maps for easy lookup
    const clientsMap = Object.fromEntries(resolvedClients.map((cl) => [cl.id, cl]));
    const carersMap = Object.fromEntries(resolvedCarers.map((ca) => [ca.id, ca]));

    // Compose Booking[] from DB or dummy
    let bookings: Booking[] = [];
    if ((bookingsDB || []).length > 0) {
      console.log("[useBookingData] ===== PROCESSING BOOKINGS =====");
      console.log("Processing", bookingsDB.length, "bookings from database");
      
      const processedBookings: Booking[] = [];
      let failedProcessingCount = 0;
      
      (bookingsDB || []).forEach((bk: any, index: number) => {
        try {
          let client = clientsMap[bk.client_id];
          
          // If not in clientsMap, use embedded client data from booking
          if (!client && bk.client_id && bk.clients) {
            const embeddedClient = bk.clients;
            client = {
              id: embeddedClient.id || bk.client_id,
              name: safeName(embeddedClient.first_name, embeddedClient.last_name),
              initials: safeInitials(embeddedClient.first_name, embeddedClient.last_name),
              bookingCount: 0,
              bookings: [],
              address: getClientDisplayAddress(
                null,
                embeddedClient.address,
                embeddedClient.client_addresses
              ) || undefined,
            };
          }
          
          // Final fallback for truly missing client data
          if (!client && bk.client_id) {
            client = getOrCreatePlaceholderClient(bk.client_id);
          }
          
          let carer = bk.staff_id ? carersMap[bk.staff_id] : null;
          if (!carer) {
            carer = getOrCreatePlaceholderCarer(bk.staff_id);
          }

          // Enhanced date/time extraction with timezone-aware conversion
          const extractDateSafe = (isoString: string) => {
            if (!isoString) {
              console.warn(`[useBookingData] Missing date for booking ${bk.id}`);
              return "";
            }
            try {
              const utcDate = new Date(isoString);
              const localDate = toZonedTime(utcDate, getUserTimezone());
              const datePart = format(localDate, 'yyyy-MM-dd');
              
              if (!datePart || !/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
                console.warn(`[useBookingData] Invalid date format for booking ${bk.id}:`, isoString);
                return "";
              }
              
              return datePart;
            } catch (error) {
              console.error(`[useBookingData] Error extracting date for booking ${bk.id}:`, error);
              return "";
            }
          };

          const extractTimeSafe = (isoString: string, defaultTime = "07:00") => {
            if (!isoString) {
              console.warn(`[useBookingData] Missing time for booking ${bk.id}`);
              return defaultTime;
            }
            try {
              const localTime = formatInUserTimezone(isoString, 'HH:mm');
              
              if (!localTime || !/^\d{2}:\d{2}$/.test(localTime)) {
                console.warn(`[useBookingData] Invalid time format for booking ${bk.id}:`, isoString);
                return defaultTime;
              }
              
              return localTime;
            } catch (error) {
              console.error(`[useBookingData] Error extracting time for booking ${bk.id}:`, error);
              return defaultTime;
            }
          };

          const startDate = extractDateSafe(bk.start_time);
          const startTime = extractTimeSafe(bk.start_time);
          const endTime = extractTimeSafe(bk.end_time, "08:00");

          // Skip bookings with invalid data
          if (!startDate) {
            console.error(`[useBookingData] Skipping booking ${bk.id} - invalid date`);
            failedProcessingCount++;
            return;
          }

          const processedBooking = {
            id: bk.id,
            clientId: bk.client_id,
            clientName: client?.name || "(Unknown Client)",
            clientInitials: client?.initials || "??",
            carerId: bk.staff_id,
            carerName: carer?.name || "(Unknown Carer)",
            carerInitials: carer?.initials || "??",
            startTime: startTime,
            endTime: endTime,
            date: startDate,
            status: bk.status || "assigned",
            notes: bk.notes || "",
            start_time: bk.start_time,
            end_time: bk.end_time,
            service_id: bk.service_id,
            service_ids: bk.service_ids || (bk.service_id ? [bk.service_id] : []),
            branch_id: bk.branch_id,
            client_id: bk.client_id,
            unavailability_request: bk.booking_unavailability_requests?.[0] || null,
            cancellation_request_status: bk.cancellation_request_status as 'pending' | 'approved' | 'rejected' | null,
            reschedule_request_status: bk.reschedule_request_status as 'pending' | 'approved' | 'rejected' | null,
            visit_records: bk.visit_records || [],
            location_address: bk.location_address,
            clientAddress: getClientDisplayAddress(
              bk.location_address,
              bk.clients?.address,
              bk.clients?.client_addresses
            ),
            is_late_start: bk.is_late_start || false,
            is_missed: bk.is_missed || false,
            late_start_minutes: bk.late_start_minutes || 0,
          };

          processedBookings.push(processedBooking);

          // Log sample bookings for debugging
          if ((index + 1) % 10 === 0 || index < 3) {
            console.log(`[useBookingData] Processed booking ${index + 1}/${bookingsDB.length}:`, {
              id: processedBooking.id,
              date: processedBooking.date,
              time: `${processedBooking.startTime}-${processedBooking.endTime}`,
              client: processedBooking.clientName,
              carer: processedBooking.carerName,
              status: processedBooking.status
            });
          }
        } catch (error) {
          console.error(`[useBookingData] Failed to process booking ${bk.id}:`, error);
          failedProcessingCount++;
        }
      });

      bookings = processedBookings;
      
      console.log("[useBookingData] ===== BOOKING PROCESSING COMPLETE =====");
      console.log("- Successfully processed:", bookings.length);
      console.log("- Failed to process:", failedProcessingCount);
      console.log("- Total raw bookings:", bookingsDB.length);
      
      // Debug: show sample booking dates
      const sampleBookings = bookings.slice(0, 3).map(b => ({
        id: b.id.substring(0, 8),
        date: b.date,
        time: `${b.startTime}-${b.endTime}`,
        client: b.clientName
      }));
      console.log("- Sample processed bookings:", sampleBookings);
      
      if (failedProcessingCount > 0) {
        console.warn(`[useBookingData] WARNING: ${failedProcessingCount} bookings failed processing`);
      }
    } else if (!branchId) {
      // Only use dummy bookings if no branchId (for demo purposes)
      bookings = makeDummyBookings(resolvedClients, resolvedCarers);
      console.log("[useBookingData] Using dummy bookings:", bookings.length);
    }

    // Assign bookings to clients and carers
    const clientsWithBookings: Client[] = resolvedClients.map(client => {
      const clientBookings = bookings.filter(bk => bk.clientId === client.id);
      return {
        ...client,
        bookings: clientBookings,
        bookingCount: clientBookings.length,
      };
    });

    const carersWithBookings: Carer[] = resolvedCarers.map(carer => {
      const carerBookings = bookings.filter(bk => bk.carerId === carer.id);
      return {
        ...carer,
        bookings: carerBookings,
        bookingCount: carerBookings.length,
      };
    });

    console.log("[useBookingData] Final result:");
    console.log("- clients:", clientsWithBookings.length);
    console.log("- carers:", carersWithBookings.length);
    console.log("- bookings:", bookings.length);

    return {
      clients: clientsWithBookings,
      carers: carersWithBookings,
      bookings
    };
  }, [bookingsDB, clientsResponse, carersData, branchId, effectiveDate, viewType]);

  return {
    clients,
    carers,
    bookings,
    totalBookingsCount,
    isLoading: authLoading || isLoadingBookings || isLoadingClients || isLoadingCarers,
    hasAuthError: !authLoading && !user,
    hasDataError: !!(bookingsError || clientsError || carersError)
  };
}
