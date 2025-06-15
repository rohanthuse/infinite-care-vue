import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, RefreshCw, UserPlus } from "lucide-react";
import { DateNavigation } from "./DateNavigation";
import { BookingFilters } from "./BookingFilters";
import { BookingTimeGrid, Client, Carer, Booking } from "./BookingTimeGrid";
import { BookingsList } from "./BookingsList";
import { BookingReport } from "./BookingReport";
import { NewBookingDialog } from "./NewBookingDialog";
import { EditBookingDialog } from "./EditBookingDialog";
import { CreateAdminDialog } from "./CreateAdminDialog";
import { AuthDebugInfo } from "./AuthDebugInfo";
import { toast } from "sonner";
import { useBranchBookings } from "@/data/hooks/useBranchBookings";
import { useCreateBooking } from "@/data/hooks/useCreateBooking";
import { useBranchClients } from "@/data/hooks/useBranchClients";
import { useBranchCarers } from "@/data/hooks/useBranchCarers";
import { useAuth } from "@/hooks/useAuth";
import { useCreateMultipleBookings } from "@/data/hooks/useCreateMultipleBookings";
import { useServices } from "@/data/hooks/useServices";
import { useUpdateBooking } from "@/data/hooks/useUpdateBooking";

// Helper for consistent name and initials with fallback
function safeName(first: any, last: any, fallback = "Unknown") {
  const name = [first ?? "", last ?? ""].filter(Boolean).join(" ").trim();
  return name || fallback;
}
function safeInitials(first: any, last: any, fallback = "??") {
  const f = (first && first[0]) || "?";
  const l = (last && last[0]) || "?";
  return `${f}${l}`;
}
function mapDBClientToClient(db: any): Client {
  const firstName = db.first_name ?? "";
  const lastName = db.last_name ?? "";
  const name = db.avatar_initials
    ? db.first_name + " " + db.last_name
    : safeName(firstName, lastName);
  const initials =
    db.avatar_initials ||
    safeInitials(firstName, lastName);
  return {
    id: db.id,
    name,
    initials,
    bookings: [],
    bookingCount: 0,
  };
}
function mapDBCarerToCarer(db: any): Carer {
  const firstName = db.first_name ?? "";
  const lastName = db.last_name ?? "";
  return {
    id: db.id,
    name: safeName(firstName, lastName),
    initials: safeInitials(firstName, lastName),
    bookings: [],
    bookingCount: 0,
  };
}

// --- Dummy booking generator ---
function makeDummyBookings(
  clients: Client[],
  carers: Carer[]
): Booking[] {
  const statuses = [
    "assigned",
    "in-progress",
    "done",
    "departed",
    "cancelled",
    "unassigned",
    "suspended"
  ] as const; // literal type array

  const now = new Date();

  return Array.from({ length: 10 }).map((_, i) => {
    const client = clients[i % clients.length];
    const carer = carers[i % carers.length];
    const startHour = 8 + (i % 4) * 2;
    const endHour = startHour + 1;
    const date = new Date(now);
    date.setDate(now.getDate() + (i % 5));
    return {
      id: `dummy-bk-${i + 1}`,
      clientId: client.id,
      clientName: client.name,
      clientInitials: client.initials,
      carerId: carer.id,
      carerName: carer.name,
      carerInitials: carer.initials,
      startTime: `${String(startHour).padStart(2, "0")}:00`,
      endTime: `${String(endHour).padStart(2, "0")}:00`,
      date: date.toISOString().slice(0, 10),
      status: statuses[i % statuses.length], // now inferred as Booking["status"]
      notes: "",
    };
  });
}

// --- Main component ---

export interface BookingsTabProps {
  branchId?: string;
  branchName?: string;
}

export const BookingsTab: React.FC<BookingsTabProps> = ({
  branchId,
}) => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewType, setViewType] = useState<"daily" | "weekly">("weekly");
  const [activeTab, setActiveTab] = useState<string>("planning");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"client" | "group">("client");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["assigned", "in-progress"]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [newBookingDialogOpen, setNewBookingDialogOpen] = useState<boolean>(false);
  const [editBookingDialogOpen, setEditBookingDialogOpen] = useState<boolean>(false);
  const [createAdminDialogOpen, setCreateAdminDialogOpen] = useState<boolean>(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [newBookingData, setNewBookingData] = useState<{
    date: Date;
    startTime: string;
    clientId?: string;
    carerId?: string;
  } | null>(null);

  // Dummy data
  const dummyClients: Client[] = [
    { id: 'c1', name: 'Alice Lowe', initials: 'AL', bookingCount: 0, bookings: [] },
    { id: 'c2', name: 'Sam James', initials: 'SJ', bookingCount: 0, bookings: [] },
    { id: 'c3', name: 'George Pan', initials: 'GP', bookingCount: 0, bookings: [] },
    { id: 'c4', name: 'Helen Ford', initials: 'HF', bookingCount: 0, bookings: [] },
    { id: 'c5', name: 'Maria Lee', initials: 'ML', bookingCount: 0, bookings: [] },
  ];
  const dummyCarers: Carer[] = [
    { id: 'x1', name: 'John Smith', initials: 'JS', bookingCount: 0, bookings: [] },
    { id: 'x2', name: 'Kay Lum', initials: 'KL', bookingCount: 0, bookings: [] },
    { id: 'x3', name: 'Priya Patel', initials: 'PP', bookingCount: 0, bookings: [] },
    { id: 'x4', name: 'Mohamed Shaheen', initials: 'MS', bookingCount: 0, bookings: [] },
  ];

  // Use real data if available
  const { data: bookingsDB = [], isLoading: isLoadingBookings, error: bookingsError } = useBranchBookings(branchId);
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
  const createBookingMutation = useCreateBooking(branchId);
  const createMultipleBookingsMutation = useCreateMultipleBookings(branchId);
  const updateBookingMutation = useUpdateBooking(branchId);

  // Map DB: get .clients array if available, else fallback to []
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

  // Helper: placeholder client/carer for missing reference
  function getOrCreatePlaceholderClient(id: any): Client {
    return {
      id,
      name: "(Unknown Client)",
      initials: "??",
      bookingCount: 0,
      bookings: [],
    };
  }
  function getOrCreatePlaceholderCarer(id: any): Carer {
    return {
      id,
      name: "(Unknown Carer)",
      initials: "??",
      bookingCount: 0,
      bookings: [],
    };
  }

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
        status: bk.status || "assigned", // <-- from DB
        notes: "",
      };
    });
  }
  if (bookings.length === 0) {
    bookings = makeDummyBookings(resolvedClients, resolvedCarers);
  }

  // === [FIX] Assign bookings and bookingCount to clients ===
  // assign bookings to each client, and count
  const clientsWithBookings: Client[] = resolvedClients.map(client => {
    const clientBookings = bookings.filter(bk => bk.clientId === client.id);
    return {
      ...client,
      bookings: clientBookings,
      bookingCount: clientBookings.length,
    };
  });

  // Optionally you can do the same for carers if needed.
  const carersWithBookings: Carer[] = resolvedCarers.map(carer => {
    const carerBookings = bookings.filter(bk => bk.carerId === carer.id);
    return {
      ...carer,
      bookings: carerBookings,
      bookingCount: carerBookings.length,
    };
  });

  // --- FILTER BOOKINGS BY SEARCH & STATUS ---
  function filterBookings(bookings: Booking[]) {
    return bookings.filter(bk => {
      // Filter by status
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(bk.status);
      // Filter by search
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (bk.clientName && bk.clientName.toLowerCase().includes(q)) ||
        (bk.carerName && bk.carerName.toLowerCase().includes(q)) ||
        (bk.clientInitials && bk.clientInitials.toLowerCase().includes(q)) ||
        (bk.carerInitials && bk.carerInitials.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }

  // --- Helper: Combine date and time to ISO (no change, but exposed here) ---
  function combineDateAndTimeToISO(date: Date, time: string): string {
    // "YYYY-MM-DD" from date
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    let [h, m] = time.split(':');
    h = h.padStart(2, '0');
    m = m.padStart(2, '0');
    // Always use local time in iso format: YYYY-MM-DDTHH:MM
    return `${yyyy}-${mm}-${dd}T${h}:${m}:00.000Z`;
  }

  // --- Updated Handler logic (preview, create/edit event)
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Bookings refreshed successfully");
    }, 800);
  };

  const handleNewBooking = () => {
    setNewBookingData(null);
    setNewBookingDialogOpen(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setEditBookingDialogOpen(true);
  };

  const handleContextMenuBooking = (date: Date, time: string, clientId?: string, carerId?: string) => {
    setNewBookingData({
      date,
      startTime: time,
      clientId,
      carerId
    });
    setNewBookingDialogOpen(true);
  };

  const handleUpdateBooking = (bookingToUpdate: Booking & {notes?: string}) => {
    if (!bookingToUpdate.id) {
      toast.error("Cannot update booking without an ID.");
      return;
    }

    const payload: any = {
      client_id: bookingToUpdate.clientId,
      staff_id: bookingToUpdate.carerId,
      status: bookingToUpdate.status,
    };
    
    if (bookingToUpdate.date && bookingToUpdate.startTime) {
        payload.start_time = combineDateAndTimeToISO(new Date(bookingToUpdate.date), bookingToUpdate.startTime);
    }
    if (bookingToUpdate.date && bookingToUpdate.endTime) {
        payload.end_time = combineDateAndTimeToISO(new Date(bookingToUpdate.date), bookingToUpdate.endTime);
    }

    updateBookingMutation.mutate({ bookingId: bookingToUpdate.id, updatedData: payload }, {
        onSuccess: () => {
            if (editBookingDialogOpen) {
                setEditBookingDialogOpen(false);
            }
        }
    });
  };

  // --- Recurring bookings: New improved handler for multiple bookings ---
  const handleCreateBooking = (bookingData: any) => {
    if (!user) {
      toast.error("You must be logged in to create bookings");
      return;
    }
    if (!branchId) {
      toast.error("Branch ID is required");
      return;
    }
    if (
      !bookingData ||
      !bookingData.schedules ||
      !Array.isArray(bookingData.schedules) ||
      bookingData.schedules.length === 0
    ) {
      toast.error("Invalid booking data. Please select at least one schedule.");
      return;
    }
    // Guard: dates
    const from = bookingData.fromDate instanceof Date
      ? bookingData.fromDate
      : new Date(bookingData.fromDate);
    const until = bookingData.untilDate instanceof Date
      ? bookingData.untilDate
      : new Date(bookingData.untilDate);
    if (!from || !until) {
      toast.error("Please select both a start and end date.");
      return;
    }

    // Generate all booking instances (flat list)
    const bookingsToCreate: any[] = [];
    // For each schedule (can have multiple time slots)
    for (const schedule of bookingData.schedules) {
      // Check for required fields
      const { startTime, endTime, services, days } = schedule;
      if (!startTime || !endTime) continue;

      // Service (first one)
      let serviceId: string | null = null;
      if (
        Array.isArray(services) &&
        services[0] &&
        /^[0-9a-fA-F-]{36}$/.test(services[0])
      ) {
        serviceId = services[0];
      }

      // Figure out which days of the week are checked (object: { mon: true, tue: ... })
      const dayBooleans: Partial<Record<number, boolean>> = {};
      if (days) {
        // Days mapping: Mon=1, ..., Sun=0 (matching JS getDay)
        if (days.mon) dayBooleans[1] = true;
        if (days.tue) dayBooleans[2] = true;
        if (days.wed) dayBooleans[3] = true;
        if (days.thu) dayBooleans[4] = true;
        if (days.fri) dayBooleans[5] = true;
        if (days.sat) dayBooleans[6] = true;
        if (days.sun) dayBooleans[0] = true;
      }

      // If all days or no days are selected, default to all days
      const anyDaysSelected = Object.values(dayBooleans).some(Boolean);
      const daysSelected = anyDaysSelected
        ? dayBooleans
        : { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true };

      // For each day in date range
      let curr = new Date(from);
      curr.setHours(0, 0, 0, 0);
      const end = new Date(until);
      end.setHours(0, 0, 0, 0);

      while (curr <= end) {
        const dayNum = curr.getDay(); // 0=Sun, 1=Mon ...
        if (daysSelected[dayNum]) {
          // booking for this day
          bookingsToCreate.push({
            branch_id: branchId,
            client_id: bookingData.clientId,
            staff_id: bookingData.carerId,
            start_time: combineDateAndTimeToISO(curr, startTime),
            end_time: combineDateAndTimeToISO(curr, endTime),
            service_id: serviceId,
            revenue: null,
            status: "assigned",
          });
        }
        curr.setDate(curr.getDate() + 1);
      }
    }

    if (bookingsToCreate.length === 0) {
      toast.error("No valid days/times selected for recurrence.");
      return;
    }

    // Logging for review
    console.log("[BookingsTab] Creating recurring bookings:", bookingsToCreate);

    createMultipleBookingsMutation.mutate(bookingsToCreate, {
      onError: (error: any) => {
        console.error("[BookingsTab] Booking creation error:", error);
        if (error.message?.includes("row-level security")) {
          toast.error("Access denied. You may not be authorized for this branch.", {
            description: "Contact your administrator or create an admin user for this branch.",
          });
        } else {
          toast.error("Failed to create bookings", {
            description: error?.message || "Unknown error on booking creation. Please check all fields.",
          });
        }
      },
      onSuccess: (data: any) => {
        toast.success("Bookings created!", {
          description: `Created ${data.length || bookingsToCreate.length} bookings for selected range.`,
        });
        setNewBookingDialogOpen(false);
        createMultipleBookingsMutation.reset();
      },
    });
  };

  // --- Logging for filtered bookings ---
  const filteredBookings = filterBookings(bookings);

  console.log("[BookingsTab] FILTERED bookings for display (length):", filteredBookings.length);
  if (filteredBookings.length > 0) {
    console.log("[BookingsTab] First filtered booking:", filteredBookings[0]);
  } else {
    console.log("[BookingsTab] No filtered bookings.");
  }

  // --- Status counts for filters ---
  const statusCounts = bookings.reduce<Record<string, number>>((acc, booking) => {
    acc[booking.status] = (acc[booking.status] || 0) + 1;
    return acc;
  }, {});

  // Add service fetching
  const { data: services = [], isLoading: isLoadingServices, error: servicesError } = useServices();

  return (
    <div className="space-y-4">
      <AuthDebugInfo branchId={branchId} />
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white border border-gray-200 p-1 rounded-lg w-full lg:w-auto">
            <TabsTrigger value="planning" className="flex-1 lg:flex-initial data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Planning
            </TabsTrigger>
            <TabsTrigger value="list" className="flex-1 lg:flex-initial data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              List
            </TabsTrigger>
            <TabsTrigger value="report" className="flex-1 lg:flex-initial data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Report
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-3 w-full lg:w-auto justify-between">
          {activeTab === "planning" && <DateNavigation currentDate={currentDate} onDateChange={setCurrentDate} viewType={viewType} onViewTypeChange={setViewType} />}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} className="h-8 w-8 p-0" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            {!user && (
              <Button
                onClick={() => setCreateAdminDialogOpen(true)}
                variant="outline"
                className="h-9 border-orange-500 text-orange-600 hover:bg-orange-50 rounded-full px-3 shadow-sm"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                <span>Create Admin</span>
              </Button>
            )}
            <Button
              onClick={handleNewBooking}
              variant="default"
              className="h-9 bg-blue-600 hover:bg-blue-700 rounded-full px-3 shadow-sm"
              disabled={!user}
            >
              <Plus className="h-4 w-4 mr-1" />
              <span>New Booking</span>
            </Button>
          </div>
        </div>
      </div>
      {activeTab === "planning" && (
        <>
          <BookingFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            selectedStatuses={selectedStatuses}
            onStatusChange={setSelectedStatuses}
            statusCounts={statusCounts}
          />
          <BookingTimeGrid
            date={currentDate}
            bookings={filteredBookings}
            clients={clientsWithBookings}
            carers={carersWithBookings}
            viewType={viewType}
            viewMode={viewMode}
            onCreateBooking={handleContextMenuBooking}
            onUpdateBooking={handleUpdateBooking}
            onEditBooking={handleEditBooking}
            isUpdatingBooking={updateBookingMutation.isPending}
          />
        </>
      )}
      {activeTab === "list" && <BookingsList bookings={filteredBookings} />}
      {activeTab === "report" && <BookingReport bookings={filteredBookings} />}
      <NewBookingDialog
        open={newBookingDialogOpen}
        onOpenChange={setNewBookingDialogOpen}
        clients={clientsWithBookings}
        carers={carersWithBookings}
        services={services}
        onCreateBooking={handleCreateBooking}
        initialData={newBookingData}
        isLoading={createMultipleBookingsMutation.isPending}
        error={createMultipleBookingsMutation.error}
      />
      <EditBookingDialog
        open={editBookingDialogOpen}
        onOpenChange={setEditBookingDialogOpen}
        booking={selectedBooking}
        clients={clientsWithBookings}
        carers={carersWithBookings}
        onUpdateBooking={handleUpdateBooking}
      />
      <CreateAdminDialog
        open={createAdminDialogOpen}
        onOpenChange={setCreateAdminDialogOpen}
        branchId={branchId || ""}
      />
    </div>
  );
};
