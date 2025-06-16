
import { useMemo } from "react";
import { Client, Carer, Booking } from "../BookingTimeGrid";
import { useBranchBookings } from "@/data/hooks/useBranchBookings";
import { useBranchClients } from "@/data/hooks/useBranchClients";
import { useBranchCarers } from "@/data/hooks/useBranchCarers";
import { 
  mapDBClientToClient, 
  mapDBCarerToCarer,
  getOrCreatePlaceholderClient,
  getOrCreatePlaceholderCarer
} from "../utils/dataMappers";
import { makeDummyBookings, dummyClients, dummyCarers } from "../utils/dummyDataGenerator";

export function useBookingData(branchId?: string) {
  const { data: bookingsDB = [], isLoading: isLoadingBookings } = useBranchBookings(branchId);
  const {
    data: clientsData,
    isLoading: isLoadingClients
  } = useBranchClients({
    branchId,
    searchTerm: "",
    page: 1,
    itemsPerPage: 100
  });
  const { data: carersData = [], isLoading: isLoadingCarers } = useBranchCarers(branchId);

  const { clients, carers, bookings } = useMemo(() => {
    console.log("[useBookingData] Raw data received:");
    console.log("- clientsData:", clientsData);
    console.log("- carersData:", carersData);
    console.log("- bookingsDB:", bookingsDB);
    console.log("- branchId:", branchId);

    // Extract clients from the response - handle both array and object with clients property
    let clientsRaw = [];
    if (Array.isArray(clientsData)) {
      clientsRaw = clientsData;
    } else if (clientsData && Array.isArray(clientsData.clients)) {
      clientsRaw = clientsData.clients;
    } else if (clientsData && clientsData.data && Array.isArray(clientsData.data)) {
      clientsRaw = clientsData.data;
    }

    // Extract carers - should be a direct array
    const carersRaw = Array.isArray(carersData) ? carersData : [];
    
    console.log("[useBookingData] Extracted raw data:");
    console.log("- clientsRaw length:", clientsRaw.length);
    console.log("- carersRaw length:", carersRaw.length);
    console.log("- clientsRaw sample:", clientsRaw[0]);
    console.log("- carersRaw sample:", carersRaw[0]);

    // Map to our internal format or use dummy data as fallback
    const resolvedClients: Client[] = clientsRaw.length > 0
      ? clientsRaw.map(mapDBClientToClient)
      : (branchId ? [] : dummyClients); // Only use dummy data if no branchId

    const resolvedCarers: Carer[] = carersRaw.length > 0
      ? carersRaw.map(mapDBCarerToCarer)
      : (branchId ? [] : dummyCarers); // Only use dummy data if no branchId

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
        return {
          id: bk.id,
          clientId: bk.client_id,
          clientName: client?.name || "(Unknown Client)",
          clientInitials: client?.initials || "??",
          carerId: bk.staff_id,
          carerName: carer?.name || "(Unknown Carer)",
          carerInitials: carer?.initials || "??",
          startTime: bk.start_time ? bk.start_time.slice(11, 16) : "07:00",
          endTime: bk.end_time ? bk.end_time.slice(11, 16) : "07:30",
          date: bk.start_time ? bk.start_time.slice(0, 10) : "",
          status: bk.status || "assigned",
          notes: "",
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
  }, [bookingsDB, clientsData, carersData, branchId]);

  return {
    clients,
    carers,
    bookings,
    isLoading: isLoadingBookings || isLoadingClients || isLoadingCarers
  };
}
