
import { useMemo, useEffect } from "react";
import { Client, Carer, Booking } from "../BookingTimeGrid";
import { useBranchBookings } from "@/data/hooks/useBranchBookings";
import { useBranchClients } from "@/data/hooks/useBranchClients";
import { useBranchCarers } from "@/data/hooks/useBranchCarers";
import { useAuthSafe } from "@/hooks/useAuthSafe";
import { toast } from "sonner";
import { 
  mapDBClientToClient, 
  mapDBCarerToCarer,
  getOrCreatePlaceholderClient,
  getOrCreatePlaceholderCarer
} from "../utils/dataMappers";
import { makeDummyBookings, dummyClients, dummyCarers } from "../utils/dummyDataGenerator";

export function useBookingData(branchId?: string) {
  const { user, loading: authLoading } = useAuthSafe();
  
  // Only fetch data if user is authenticated
  const shouldFetchData = !authLoading && !!user;
  
  const { data: bookingsDB = [], isLoading: isLoadingBookings, error: bookingsError } = useBranchBookings(
    shouldFetchData ? branchId : undefined
  );
  const {
    data: clientsResponse,
    isLoading: isLoadingClients,
    error: clientsError
  } = useBranchClients({
    branchId: shouldFetchData ? branchId : undefined,
    searchTerm: "",
    page: 1,
    itemsPerPage: 100
  });
  
  const { data: carersData = [], isLoading: isLoadingCarers, error: carersError } = useBranchCarers(
    shouldFetchData ? branchId : undefined
  );

  // Monitor authentication state and show appropriate errors
  useEffect(() => {
    if (!authLoading && !user) {
      console.warn('[useBookingData] No authenticated user - booking data will be limited');
    }
    
    if (bookingsError || clientsError || carersError) {
      console.error('[useBookingData] Data fetch errors:', {
        bookingsError,
        clientsError, 
        carersError
      });
      
      // Show error toast if there are data fetch issues
      if (user && (bookingsError || clientsError || carersError)) {
        toast.error('Failed to load booking data', {
          description: 'Please check your connection and try refreshing the page'
        });
      }
    }
  }, [user, authLoading, bookingsError, clientsError, carersError]);

  const { clients, carers, bookings } = useMemo(() => {
    console.log("[useBookingData] Raw data received:");
    console.log("- clientsResponse:", clientsResponse);
    console.log("- carersData:", carersData);
    console.log("- bookingsDB:", bookingsDB);
    console.log("- branchId:", branchId);

    // Extract clients from the response - the hook returns { clients: [], count: number }
    let clientsRaw = [];
    if (clientsResponse && Array.isArray(clientsResponse.clients)) {
      clientsRaw = clientsResponse.clients;
    }

    // Extract carers - should be a direct array
    const carersRaw = Array.isArray(carersData) ? carersData : [];
    
    console.log("[useBookingData] Extracted raw data:");
    console.log("- clientsRaw length:", clientsRaw.length);
    console.log("- carersRaw length:", carersRaw.length);
    console.log("- clientsRaw sample:", clientsRaw[0]);
    console.log("- carersRaw sample:", carersRaw[0]);

    // Map to our internal format - only use dummy data if no branchId (demo mode)
    const resolvedClients: Client[] = clientsRaw.length > 0
      ? clientsRaw.map(mapDBClientToClient)
      : (branchId ? [] : dummyClients);

    const resolvedCarers: Carer[] = carersRaw.length > 0
      ? carersRaw.map(mapDBCarerToCarer)
      : (branchId ? [] : dummyCarers);

    console.log("[useBookingData] Resolved data:");
    console.log("- resolvedClients length:", resolvedClients.length);
    console.log("- resolvedCarers length:", resolvedCarers.length);
    console.log("- resolvedClients sample:", resolvedClients[0]);
    console.log("- resolvedCarers sample:", resolvedCarers[0]);

    // Create id-to-object maps for easy lookup
    const clientsMap = Object.fromEntries(resolvedClients.map((cl) => [cl.id, cl]));
    const carersMap = Object.fromEntries(resolvedCarers.map((ca) => [ca.id, ca]));

    // Compose Booking[] from DB or dummy
    let bookings: Booking[] = [];
    if ((bookingsDB || []).length > 0) {
      console.log("[useBookingData] Processing bookings from DB:", bookingsDB.length);
      bookings = (bookingsDB || []).map((bk: any) => {
        let client = clientsMap[bk.client_id];
        let carer = carersMap[bk.staff_id];
        if (!client && bk.client_id)
          client = getOrCreatePlaceholderClient(bk.client_id);
        if (!carer && bk.staff_id)
          carer = getOrCreatePlaceholderCarer(bk.staff_id);
        // Parse datetime - preserve user's local time intent
        const parseDateTime = (dateTimeStr: string) => {
          if (!dateTimeStr) return null;
          try {
            // Simple parsing that preserves user's time intent
            // If user stored 11:00, display 11:00
            let cleanStr = dateTimeStr.replace(/[Z]|[+-]\d{2}:?\d{2}$/g, '');
            if (!cleanStr.includes('T')) {
              cleanStr = cleanStr.replace(' ', 'T');
            }
            return new Date(cleanStr + (cleanStr.includes('T') ? '' : 'T00:00:00'));
          } catch (error) {
            console.warn('[useBookingData] Failed to parse datetime:', dateTimeStr, error);
            return null;
          }
        };

        const startDate = parseDateTime(bk.start_time);
        const endDate = parseDateTime(bk.end_time);

        return {
          id: bk.id,
          clientId: bk.client_id,
          clientName: client?.name || "(Unknown Client)",
          clientInitials: client?.initials || "??",
          carerId: bk.staff_id,
          carerName: carer?.name || "(Unknown Carer)",
          carerInitials: carer?.initials || "??",
          startTime: startDate ? startDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : "07:00",
          endTime: endDate ? endDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : "07:30",
          date: startDate ? startDate.toLocaleDateString('en-CA') : "", // YYYY-MM-DD format
          status: bk.status || "assigned",
          notes: bk.notes || "",
        };
      });
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
  }, [bookingsDB, clientsResponse, carersData, branchId]);

  return {
    clients,
    carers,
    bookings,
    isLoading: authLoading || isLoadingBookings || isLoadingClients || isLoadingCarers,
    hasAuthError: !authLoading && !user,
    hasDataError: !!(bookingsError || clientsError || carersError)
  };
}
