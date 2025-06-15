
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, RefreshCw } from "lucide-react";
import { DateNavigation } from "./DateNavigation";
import { BookingFilters } from "./BookingFilters";
import { BookingTimeGrid, Client, Carer, Booking } from "./BookingTimeGrid";
import { BookingsList } from "./BookingsList";
import { BookingReport } from "./BookingReport";
import { NewBookingDialog } from "./NewBookingDialog";
import { EditBookingDialog } from "./EditBookingDialog";
import { toast } from "sonner";
import { useBranchBookings } from "@/data/hooks/useBranchBookings";
import { useCreateBooking } from "@/data/hooks/useCreateBooking";
import { useBranchClients } from "@/data/hooks/useBranchClients";
import { useBranchCarers } from "@/data/hooks/useBranchCarers";

// -- Helper Mappers to UI Types --

function mapDBClientToClient(db: any): Client {
  const firstName = db.first_name ?? "";
  const lastName = db.last_name ?? "";
  const name = [firstName, lastName].filter(Boolean).join(" ").trim() || "Unknown";
  const initials =
    db.avatar_initials ||
    (firstName[0] ?? "?") + (lastName[0] ?? "?");
  return {
    id: db.id,
    name,
    initials,
    bookings: [], // optional: populate if needed
    bookingCount: 0, // If you want, calculate later from bookings
  };
}

function mapDBCarerToCarer(db: any): Carer {
  const firstName = db.first_name ?? "";
  const lastName = db.last_name ?? "";
  const name = [firstName, lastName].filter(Boolean).join(" ").trim() || "Unknown";
  const initials = (firstName[0] ?? "?") + (lastName[0] ?? "?");
  return {
    id: db.id,
    name,
    initials,
    bookings: [], // optional: populate if needed
    bookingCount: 0,
  };
}

// --- Main component ---

export interface BookingsTabProps {
  branchId?: string;
  branchName?: string;
}

export const BookingsTab: React.FC<BookingsTabProps> = ({
  branchId,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewType, setViewType] = useState<"daily" | "weekly">("weekly");
  const [activeTab, setActiveTab] = useState<string>("planning");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"client" | "group">("client");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["assigned", "in-progress"]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [newBookingDialogOpen, setNewBookingDialogOpen] = useState<boolean>(false);
  const [editBookingDialogOpen, setEditBookingDialogOpen] = useState<boolean>(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [newBookingData, setNewBookingData] = useState<{
    date: Date;
    startTime: string;
    clientId?: string;
    carerId?: string;
  } | null>(null);

  // -- Fetch from DB
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

  // -- Map DB: get .clients array if available, else fallback to []
  const clientsRaw = Array.isArray(clientsData)
    ? clientsData
    : clientsData?.clients ?? [];
  const carersRaw = carersData || [];
  const resolvedClients: Client[] = clientsRaw.map(mapDBClientToClient);
  const resolvedCarers: Carer[] = carersRaw.map(mapDBCarerToCarer);

  // Map ID->object for quick lookup
  const clientsMap = Object.fromEntries(
    clientsRaw.map((cl: any) => [cl.id, cl])
  );
  const carersMap = Object.fromEntries(
    carersRaw.map((cr: any) => [cr.id, cr])
  );
  // Compose Booking[]
  const bookings: Booking[] = (bookingsDB || []).map((bk: any) => ({
    id: bk.id,
    clientId: bk.client_id,
    clientName: clientsMap[bk.client_id]?.first_name
      ? `${clientsMap[bk.client_id]?.first_name} ${clientsMap[bk.client_id]?.last_name || ""}`
      : "Unknown Client",
    clientInitials: clientsMap[bk.client_id]?.avatar_initials ||
      ((clientsMap[bk.client_id]?.first_name?.slice(0, 1) ?? "?") +
        (clientsMap[bk.client_id]?.last_name?.slice(0, 1) ?? "?")),
    carerId: bk.staff_id,
    carerName: carersMap[bk.staff_id]?.first_name
      ? `${carersMap[bk.staff_id]?.first_name} ${carersMap[bk.staff_id]?.last_name || ""}`
      : "Unknown Carer",
    carerInitials: carersMap[bk.staff_id]?.first_name
      ? `${carersMap[bk.staff_id]?.first_name?.[0] || ""}${carersMap[bk.staff_id]?.last_name?.[0] || ""}`
      : "??",
    startTime: bk.start_time ? bk.start_time.slice(11, 16) : "00:00",
    endTime: bk.end_time ? bk.end_time.slice(11, 16) : "00:00",
    date: bk.start_time ? bk.start_time.slice(0, 10) : "",
    status: "assigned", // TODO: use real status if present in db
    notes: "", // Not present in DB
  }));

  // -- Handler logic (preview, create/edit event)

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

  const handleCreateBooking = (bookingData: any) => {
    if (!branchId) return;
    const toISO = (date: Date, time: string) => {
      const [hours, mins] = time.split(":").map(Number);
      const d = new Date(date);
      d.setHours(hours, mins, 0, 0);
      return d.toISOString();
    };
    createBookingMutation.mutate({
      branch_id: branchId,
      client_id: bookingData.clientId,
      staff_id: bookingData.carerId,
      start_time: toISO(bookingData.date, bookingData.startTime),
      end_time: toISO(bookingData.date, bookingData.endTime),
      service_id: bookingData.serviceId || null,
      revenue: bookingData.revenue || null,
    });
    setNewBookingDialogOpen(false);
  };

  // --- You may want to implement these in the future, but for now, comment/uncomment if required.
  // const handleUpdateBooking = (updatedBooking: Booking) => {};
  // const updateEntityWithBooking = ...;
  // const removeBookingFromEntity = ...;

  return (
    <div className="space-y-4">
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
            <Button
              onClick={handleNewBooking}
              variant="default"
              className="h-9 bg-blue-600 hover:bg-blue-700 rounded-full px-3 shadow-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              <span>New Booking</span>
            </Button>
          </div>
        </div>
      </div>
      {activeTab === "planning" && <>
        <BookingFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedStatuses={selectedStatuses}
          onStatusChange={setSelectedStatuses}
        />
        <BookingTimeGrid
          date={currentDate}
          bookings={bookings}
          clients={resolvedClients}
          carers={resolvedCarers}
          viewType={viewType}
          viewMode={viewMode}
          onCreateBooking={handleContextMenuBooking}
          onUpdateBooking={handleEditBooking}
          onEditBooking={handleEditBooking}
        />
      </>}
      {activeTab === "list" && <BookingsList bookings={bookings} />}
      {activeTab === "report" && <BookingReport bookings={bookings} />}
      <NewBookingDialog
        open={newBookingDialogOpen}
        onOpenChange={setNewBookingDialogOpen}
        clients={resolvedClients}
        carers={resolvedCarers}
        onCreateBooking={handleCreateBooking}
        initialData={newBookingData}
        isLoading={createBookingMutation.isPending}
        error={createBookingMutation.error}
      />
      <EditBookingDialog
        open={editBookingDialogOpen}
        onOpenChange={setEditBookingDialogOpen}
        booking={selectedBooking}
        clients={resolvedClients}
        carers={resolvedCarers}
        onUpdateBooking={() => {}}
      />
    </div>
  );
};

