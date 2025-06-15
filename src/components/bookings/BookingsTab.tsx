import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

// Mock data for clients
const mockClients: Client[] = [{
  id: "CL-001",
  name: "Pender, Eva",
  initials: "EP",
  bookingCount: 3,
  bookings: []  // Will be populated
}, {
  id: "CL-002",
  name: "Fulcher, Patricia",
  initials: "FP",
  bookingCount: 2,
  bookings: []
}, {
  id: "CL-003",
  name: "Baulch, Ursula",
  initials: "BU",
  bookingCount: 1,
  bookings: []
}, {
  id: "CL-004",
  name: "Ren, Victoria",
  initials: "RV",
  bookingCount: 2,
  bookings: []
}, {
  id: "CL-005",
  name: "Iyaniwura, Ifeoluwa",
  initials: "II",
  bookingCount: 1,
  bookings: []
}, {
  id: "CL-006",
  name: "Careville Ltd",
  initials: "CL",
  bookingCount: 4,
  bookings: []
}, {
  id: "CL-007",
  name: "Johnson, Andrew",
  initials: "JA",
  bookingCount: 2,
  bookings: []
}, {
  id: "CL-008",
  name: "Mistry, Sanjay",
  initials: "MS",
  bookingCount: 3,
  bookings: []
}, {
  id: "CL-009",
  name: "Williams, Olivia",
  initials: "WO",
  bookingCount: 1,
  bookings: []
}, {
  id: "CL-010",
  name: "Thompson, Emma",
  initials: "TE",
  bookingCount: 2,
  bookings: []
}];

// Mock data for carers
const mockCarers: Carer[] = [{
  id: "CA-001",
  name: "Charuma, Charmaine",
  initials: "CC",
  bookingCount: 4,
  bookings: []  // Will be populated
}, {
  id: "CA-002",
  name: "Warren, Susan",
  initials: "WS",
  bookingCount: 3,
  bookings: []
}, {
  id: "CA-003",
  name: "Ayo-Famure, Opeyemi",
  initials: "AF",
  bookingCount: 3,
  bookings: []
}, {
  id: "CA-004",
  name: "Smith, John",
  initials: "SJ",
  bookingCount: 2,
  bookings: []
}, {
  id: "CA-005",
  name: "Williams, Mary",
  initials: "WM",
  bookingCount: 1,
  bookings: []
}, {
  id: "CA-006",
  name: "Davis, Michael",
  initials: "DM",
  bookingCount: 2,
  bookings: []
}, {
  id: "CA-007",
  name: "Brown, David",
  initials: "BD",
  bookingCount: 3,
  bookings: []
}, {
  id: "CA-008",
  name: "Miller, Sarah",
  initials: "MS",
  bookingCount: 2,
  bookings: []
}, {
  id: "CA-009",
  name: "Wilson, Thomas",
  initials: "WT",
  bookingCount: 1,
  bookings: []
}, {
  id: "CA-010",
  name: "Moore, Jennifer",
  initials: "MJ",
  bookingCount: 2,
  bookings: []
}];

// Mock bookings data
const mockBookings: Booking[] = [{
  id: "BK-001",
  clientId: "CL-001",
  clientName: "Pender, Eva",
  clientInitials: "EP",
  carerId: "CA-001",
  carerName: "Charuma, Charmaine",
  carerInitials: "CC",
  startTime: "07:30",
  endTime: "08:30",
  date: new Date().toISOString().split('T')[0],
  status: "done",
  notes: "Medication administered as prescribed"
}, {
  id: "BK-002",
  clientId: "CL-001",
  clientName: "Pender, Eva",
  clientInitials: "EP",
  carerId: "CA-002",
  carerName: "Warren, Susan",
  carerInitials: "WS",
  startTime: "12:15",
  endTime: "13:45",
  date: new Date().toISOString().split('T')[0],
  status: "assigned"
}, {
  id: "BK-003",
  clientId: "CL-002",
  clientName: "Fulcher, Patricia",
  clientInitials: "FP",
  carerId: "CA-001",
  carerName: "Charuma, Charmaine",
  carerInitials: "CC",
  startTime: "09:00",
  endTime: "10:00",
  date: new Date().toISOString().split('T')[0],
  status: "done"
}, {
  id: "BK-004",
  clientId: "CL-003",
  clientName: "Baulch, Ursula",
  clientInitials: "BU",
  carerId: "CA-002",
  carerName: "Warren, Susan",
  carerInitials: "WS",
  startTime: "10:30",
  endTime: "11:30",
  date: new Date().toISOString().split('T')[0],
  status: "in-progress"
}, {
  id: "BK-005",
  clientId: "CL-004",
  clientName: "Ren, Victoria",
  clientInitials: "RV",
  carerId: "CA-002",
  carerName: "Warren, Susan",
  carerInitials: "WS",
  startTime: "14:00",
  endTime: "15:30",
  date: new Date().toISOString().split('T')[0],
  status: "assigned"
}, {
  id: "BK-006",
  clientId: "CL-004",
  clientName: "Ren, Victoria",
  clientInitials: "RV",
  carerId: "CA-003",
  carerName: "Ayo-Famure, Opeyemi",
  carerInitials: "AF",
  startTime: "18:00",
  endTime: "19:00",
  date: new Date().toISOString().split('T')[0],
  status: "cancelled"
}, {
  id: "BK-007",
  clientId: "CL-005",
  clientName: "Iyaniwura, Ifeoluwa",
  clientInitials: "II",
  carerId: "CA-001",
  carerName: "Charuma, Charmaine",
  carerInitials: "CC",
  startTime: "16:00",
  endTime: "17:00",
  date: new Date().toISOString().split('T')[0],
  status: "assigned"
}, {
  id: "BK-008",
  clientId: "CL-006",
  clientName: "Careville Ltd",
  clientInitials: "CL",
  carerId: "CA-003",
  carerName: "Ayo-Famure, Opeyemi",
  carerInitials: "AF",
  startTime: "08:30",
  endTime: "09:30",
  date: new Date().toISOString().split('T')[0],
  status: "departed"
}, {
  id: "BK-009",
  clientId: "CL-001",
  clientName: "Pender, Eva",
  clientInitials: "EP",
  carerId: "CA-004",
  carerName: "Smith, John",
  carerInitials: "SJ",
  startTime: "20:00",
  endTime: "21:00",
  date: new Date().toISOString().split('T')[0],
  status: "assigned"
}];

export interface BookingsTabProps {
  branchId?: string;
  branchName?: string;
}

export const BookingsTab: React.FC<BookingsTabProps> = ({
  branchId
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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [carers, setCarers] = useState<Carer[]>([]);
  const { data: bookingsDB = [], isLoading: isLoadingBookings, error: bookingsError } = useBranchBookings(branchId);
  const { data: clientsData = [], isLoading: isLoadingClients } = useBranchClients({
    branchId,
    searchTerm: "",
    page: 1,
    itemsPerPage: 100
  });
  const { data: carersData = [], isLoading: isLoadingCarers } = useBranchCarers(branchId);
  const createBookingMutation = useCreateBooking(branchId);

  // Map DB bookings for display (add client/carer names)
  const clientsMap = Object.fromEntries(
    (clientsData?.clients || []).map((cl: any) => [cl.id, cl])
  );
  const carersMap = Object.fromEntries(
    (carersData || []).map((cr: any) => [cr.id, cr])
  );
  const bookings: Booking[] = (bookingsDB || []).map((bk: any) => ({
    id: bk.id,
    clientId: bk.client_id,
    clientName: clientsMap[bk.client_id]?.first_name
      ? `${clientsMap[bk.client_id]?.first_name} ${clientsMap[bk.client_id]?.last_name || ""}`
      : "Unknown Client",
    clientInitials: clientsMap[bk.client_id]?.avatar_initials || (clientsMap[bk.client_id]?.first_name?.slice(0,1) ?? "?") + (clientsMap[bk.client_id]?.last_name?.slice(0,1) ?? "?"),
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
    status: "assigned", // TODO: use real status if present
    notes: "", // Not present in DB
  }));

  useEffect(() => {
    // Initialize with mock data
    const initialBookings = [...mockBookings];
    
    const today = new Date().toISOString().split('T')[0];
    const additionalBookings: Booking[] = [{
      id: "BK-010",
      clientId: "CL-007",
      clientName: "Johnson, Andrew",
      clientInitials: "JA",
      carerId: "CA-006",
      carerName: "Davis, Michael",
      carerInitials: "DM",
      startTime: "09:30",
      endTime: "10:30",
      date: today,
      status: "assigned"
    }, {
      id: "BK-011",
      clientId: "CL-008",
      clientName: "Mistry, Sanjay",
      clientInitials: "MS",
      carerId: "CA-007",
      carerName: "Brown, David",
      carerInitials: "BD",
      startTime: "11:00",
      endTime: "12:00",
      date: today,
      status: "in-progress"
    }, {
      id: "BK-012",
      clientId: "CL-009",
      clientName: "Williams, Olivia",
      clientInitials: "WO",
      carerId: "CA-008",
      carerName: "Miller, Sarah",
      carerInitials: "MS",
      startTime: "13:30",
      endTime: "14:30",
      date: today,
      status: "assigned"
    }, {
      id: "BK-013",
      clientId: "CL-010",
      clientName: "Thompson, Emma",
      clientInitials: "TE",
      carerId: "CA-009",
      carerName: "Wilson, Thomas",
      carerInitials: "WT",
      startTime: "15:00",
      endTime: "16:00",
      date: today,
      status: "assigned"
    }, {
      id: "BK-014",
      clientId: "CL-004",
      clientName: "Ren, Victoria",
      clientInitials: "RV",
      carerId: "CA-010",
      carerName: "Moore, Jennifer",
      carerInitials: "MJ",
      startTime: "16:30",
      endTime: "17:30",
      date: today,
      status: "cancelled",
      notes: "Client requested cancellation due to hospital appointment"
    }];
    
    const allBookings = [...initialBookings, ...additionalBookings];
    setBookings(allBookings);
    
    // Clone clients and carers to avoid reference issues
    const processedClients = JSON.parse(JSON.stringify(mockClients));
    const processedCarers = JSON.parse(JSON.stringify(mockCarers));
    
    // Add bookings references to clients and carers
    allBookings.forEach(booking => {
      // Find client and add booking reference
      const clientIndex = processedClients.findIndex(c => c.id === booking.clientId);
      if (clientIndex >= 0) {
        if (!processedClients[clientIndex].bookings) {
          processedClients[clientIndex].bookings = [];
        }
        processedClients[clientIndex].bookings.push(booking);
      }
      
      // Find carer and add booking reference
      const carerIndex = processedCarers.findIndex(c => c.id === booking.carerId);
      if (carerIndex >= 0) {
        if (!processedCarers[carerIndex].bookings) {
          processedCarers[carerIndex].bookings = [];
        }
        processedCarers[carerIndex].bookings.push(booking);
      }
    });
    
    // Set the processed data
    setClients(processedClients);
    setCarers(processedCarers);
    
  }, []);

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
      branch_id: branchId, // must provide branchId
      client_id: bookingData.clientId,
      staff_id: bookingData.carerId,
      start_time: toISO(bookingData.date, bookingData.startTime),
      end_time: toISO(bookingData.date, bookingData.endTime),
      service_id: bookingData.serviceId || null,
      revenue: bookingData.revenue || null,
    });
    setNewBookingDialogOpen(false);
  };

  const handleUpdateBooking = (updatedBooking: Booking) => {
    const oldBooking = bookings.find(b => b.id === updatedBooking.id);
    
    setBookings(prevBookings => 
      prevBookings.map(booking => 
        booking.id === updatedBooking.id ? updatedBooking : booking
      )
    );
    
    if (oldBooking && oldBooking.clientId !== updatedBooking.clientId) {
      removeBookingFromEntity("client", oldBooking.clientId, updatedBooking.id);
      updateEntityWithBooking("client", updatedBooking.clientId, updatedBooking);
    }
    
    if (oldBooking && oldBooking.carerId !== updatedBooking.carerId) {
      removeBookingFromEntity("carer", oldBooking.carerId, updatedBooking.id);
      updateEntityWithBooking("carer", updatedBooking.carerId, updatedBooking);
    }
    
    toast.success("Booking updated successfully");
  };

  const updateEntityWithBooking = (type: "client" | "carer", id: string, newBooking: Booking) => {
    if (type === "client") {
      setClients(prevClients => prevClients.map(client => {
        if (client.id === id) {
          return {
            ...client,
            bookings: [...(client.bookings || []).filter(b => b.id !== newBooking.id), newBooking]
          };
        }
        return client;
      }));
    } else {
      setCarers(prevCarers => prevCarers.map(carer => {
        if (carer.id === id) {
          return {
            ...carer,
            bookings: [...(carer.bookings || []).filter(b => b.id !== newBooking.id), newBooking]
          };
        }
        return carer;
      }));
    }
  };

  const removeBookingFromEntity = (type: "client" | "carer", id: string, bookingId: string) => {
    if (type === "client") {
      setClients(prevClients => prevClients.map(client => {
        if (client.id === id && client.bookings) {
          return {
            ...client,
            bookings: client.bookings.filter(b => b.id !== bookingId)
          };
        }
        return client;
      }));
    } else {
      setCarers(prevCarers => prevCarers.map(carer => {
        if (carer.id === id && carer.bookings) {
          return {
            ...carer,
            bookings: carer.bookings.filter(b => b.id !== bookingId)
          };
        }
        return carer;
      }));
    }
  };

  return <div className="space-y-4">
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
            clients={clientsData?.clients || []}
            carers={carersData || []}
            viewType={viewType} 
            viewMode={viewMode}
            onCreateBooking={handleContextMenuBooking}
            onUpdateBooking={handleUpdateBooking}
            onEditBooking={handleEditBooking}
          />
        </>}

      {activeTab === "list" && <BookingsList bookings={bookings} />}

      {activeTab === "report" && <BookingReport bookings={bookings} />}
      
      <NewBookingDialog 
        open={newBookingDialogOpen}
        onOpenChange={setNewBookingDialogOpen}
        clients={clientsData?.clients || []}
        carers={carersData || []}
        onCreateBooking={handleCreateBooking}
        initialData={newBookingData}
        isLoading={createBookingMutation.isPending}
        error={createBookingMutation.error}
      />
      
      <EditBookingDialog
        open={editBookingDialogOpen}
        onOpenChange={setEditBookingDialogOpen}
        booking={selectedBooking}
        clients={clients}
        carers={carers}
        onUpdateBooking={handleUpdateBooking}
      />
    </div>;
};
