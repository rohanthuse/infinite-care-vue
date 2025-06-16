
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
    // Map DB data or use dummy data
    const clientsRaw = Array.isArray(clientsData)
      ? clientsData
      : clientsData?.clients ?? [];
    const carersRaw = carersData || [];
    
    const resolvedClients: Client[] = clientsRaw.length > 0
      ? clientsRaw.map(mapDBClientToClient)
      : dummyClients;
    const resolvedCarers: Carer[] = carersRaw.length > 0
      ? carersRaw.map(mapDBCarerToCarer)
      : dummyCarers;

    // Create id-to-object maps for easy lookup
    const clientsMap = Object.fromEntries(resolvedClients.map((cl) => [cl.id, cl]));
    const carersMap = Object.fromEntries(resolvedCarers.map((ca) => [ca.id, ca]));

    // Compose Booking[] from DB or dummy
    let bookings: Booking[] = [];
    if ((bookingsDB || []).length > 0) {
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
    }
    if (bookings.length === 0) {
      bookings = makeDummyBookings(resolvedClients, resolvedCarers);
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

    return {
      clients: clientsWithBookings,
      carers: carersWithBookings,
      bookings
    };
  }, [bookingsDB, clientsData, carersData]);

  return {
    clients,
    carers,
    bookings,
    isLoading: isLoadingBookings || isLoadingClients || isLoadingCarers
  };
}
