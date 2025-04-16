
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

// Utility to get today's date in ISO format
const getTodayISODate = () => new Date().toISOString().split('T')[0];

// Generate mock bookings data
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
  date: getTodayISODate(),
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
  date: getTodayISODate(),
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
  date: getTodayISODate(),
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
  date: getTodayISODate(),
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
  date: getTodayISODate(),
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
  date: getTodayISODate(),
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
  date: getTodayISODate(),
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
  date: getTodayISODate(),
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
  date: getTodayISODate(),
  status: "assigned"
}];

// Create mock clients with booking references
const mockClients: Client[] = [{
  id: "CL-001",
  name: "Pender, Eva",
  initials: "EP",
  bookingCount: 3,
  bookings: mockBookings.filter(b => b.clientId === "CL-001")
}, {
  id: "CL-002",
  name: "Fulcher, Patricia",
  initials: "FP",
  bookingCount: 2,
  bookings: mockBookings.filter(b => b.clientId === "CL-002")
}, {
  id: "CL-003",
  name: "Baulch, Ursula",
  initials: "BU",
  bookingCount: 1,
  bookings: mockBookings.filter(b => b.clientId === "CL-003")
}, {
  id: "CL-004",
  name: "Ren, Victoria",
  initials: "RV",
  bookingCount: 2,
  bookings: mockBookings.filter(b => b.clientId === "CL-004")
}, {
  id: "CL-005",
  name: "Iyaniwura, Ifeoluwa",
  initials: "II",
  bookingCount: 1,
  bookings: mockBookings.filter(b => b.clientId === "CL-005")
}, {
  id: "CL-006",
  name: "Careville Ltd",
  initials: "CL",
  bookingCount: 4,
  bookings: mockBookings.filter(b => b.clientId === "CL-006")
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

// Create mock carers with booking references
const mockCarers: Carer[] = [{
  id: "CA-001",
  name: "Charuma, Charmaine",
  initials: "CC",
  bookingCount: 4,
  bookings: mockBookings.filter(b => b.carerId === "CA-001")
}, {
  id: "CA-002",
  name: "Warren, Susan",
  initials: "WS",
  bookingCount: 3,
  bookings: mockBookings.filter(b => b.carerId === "CA-002")
}, {
  id: "CA-003",
  name: "Ayo-Famure, Opeyemi",
  initials: "AF",
  bookingCount: 3,
  bookings: mockBookings.filter(b => b.carerId === "CA-003")
}, {
  id: "CA-004",
  name: "Smith, John",
  initials: "SJ",
  bookingCount: 2,
  bookings: mockBookings.filter(b => b.carerId === "CA-004")
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
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);

  useEffect(() => {
    const today = getTodayISODate();
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
    
    // Add additional bookings and update client and carer booking references
    const newBookings = [...bookings, ...additionalBookings];
    setBookings(newBookings);
    
    // Update client and carer bookings
    additionalBookings.forEach(booking => {
      const clientIndex = mockClients.findIndex(c => c.id === booking.clientId);
      if (clientIndex >= 0) {
        mockClients[clientIndex].bookings = mockClients[clientIndex].bookings || [];
        mockClients[clientIndex].bookings.push(booking);
      }
      
      const carerIndex = mockCarers.findIndex(c => c.id === booking.carerId);
      if (carerIndex >= 0) {
        mockCarers[carerIndex].bookings = mockCarers[carerIndex].bookings || [];
        mockCarers[carerIndex].bookings.push(booking);
      }
    });
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
    console.log("Creating new booking:", bookingData);
    
    const newId = `BK-${Math.floor(Math.random() * 9000) + 1000}`;
    
    const selectedClient = mockClients.find(c => c.id === bookingData.clientId);
    const selectedCarer = mockCarers.find(c => c.id === bookingData.carerId);
    
    if (selectedClient && selectedCarer) {
      const newBooking: Booking = {
        id: newId,
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        clientInitials: selectedClient.initials,
        carerId: selectedCarer.id,
        carerName: selectedCarer.name,
        carerInitials: selectedCarer.initials,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        date: bookingData.date.toISOString().split('T')[0],
        status: "assigned",
        notes: bookingData.notes || undefined
      };
      
      console.log("Selected services:", bookingData.services);
      console.log("Selected days:", bookingData.days);
      
      // Update client and carer booking references
      if (selectedClient.bookings) {
        selectedClient.bookings.push(newBooking);
      } else {
        selectedClient.bookings = [newBooking];
      }
      
      if (selectedCarer.bookings) {
        selectedCarer.bookings.push(newBooking);
      } else {
        selectedCarer.bookings = [newBooking];
      }
      
      setBookings([...bookings, newBooking]);
      toast.success("Booking created successfully");
    }
  };

  const handleUpdateBooking = (updatedBooking: Booking) => {
    console.log("Updating booking:", updatedBooking);
    
    // Update the bookings state
    setBookings(prevBookings => 
      prevBookings.map(booking => 
        booking.id === updatedBooking.id ? updatedBooking : booking
      )
    );
    
    // Update client booking references
    const oldClientId = selectedBooking?.clientId;
    const newClientId = updatedBooking.clientId;
    
    if (oldClientId !== newClientId) {
      // Remove from old client
      if (oldClientId) {
        const oldClientIndex = mockClients.findIndex(c => c.id === oldClientId);
        if (oldClientIndex >= 0 && mockClients[oldClientIndex].bookings) {
          mockClients[oldClientIndex].bookings = mockClients[oldClientIndex].bookings!.filter(b => b.id !== updatedBooking.id);
        }
      }
      
      // Add to new client
      const newClientIndex = mockClients.findIndex(c => c.id === newClientId);
      if (newClientIndex >= 0) {
        if (!mockClients[newClientIndex].bookings) {
          mockClients[newClientIndex].bookings = [];
        }
        mockClients[newClientIndex].bookings!.push(updatedBooking);
      }
    } else if (oldClientId) {
      // Update existing client booking
      const clientIndex = mockClients.findIndex(c => c.id === oldClientId);
      if (clientIndex >= 0 && mockClients[clientIndex].bookings) {
        mockClients[clientIndex].bookings = mockClients[clientIndex].bookings!.map(b => 
          b.id === updatedBooking.id ? updatedBooking : b
        );
      }
    }
    
    // Update carer booking references
    const oldCarerId = selectedBooking?.carerId;
    const newCarerId = updatedBooking.carerId;
    
    if (oldCarerId !== newCarerId) {
      // Remove from old carer
      if (oldCarerId) {
        const oldCarerIndex = mockCarers.findIndex(c => c.id === oldCarerId);
        if (oldCarerIndex >= 0 && mockCarers[oldCarerIndex].bookings) {
          mockCarers[oldCarerIndex].bookings = mockCarers[oldCarerIndex].bookings!.filter(b => b.id !== updatedBooking.id);
        }
      }
      
      // Add to new carer
      const newCarerIndex = mockCarers.findIndex(c => c.id === newCarerId);
      if (newCarerIndex >= 0) {
        if (!mockCarers[newCarerIndex].bookings) {
          mockCarers[newCarerIndex].bookings = [];
        }
        mockCarers[newCarerIndex].bookings!.push(updatedBooking);
      }
    } else if (oldCarerId) {
      // Update existing carer booking
      const carerIndex = mockCarers.findIndex(c => c.id === oldCarerId);
      if (carerIndex >= 0 && mockCarers[carerIndex].bookings) {
        mockCarers[carerIndex].bookings = mockCarers[carerIndex].bookings!.map(b => 
          b.id === updatedBooking.id ? updatedBooking : b
        );
      }
    }
  };

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setEditBookingDialogOpen(true);
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
            clients={mockClients} 
            carers={mockCarers} 
            viewType={viewType} 
            viewMode={viewMode}
            onCreateBooking={handleContextMenuBooking}
            onUpdateBooking={handleUpdateBooking}
            onBookingClick={handleBookingClick}
          />
        </>}

      {activeTab === "list" && <BookingsList bookings={bookings} onBookingClick={handleBookingClick} />}

      {activeTab === "report" && <BookingReport bookings={bookings} />}
      
      <NewBookingDialog 
        open={newBookingDialogOpen}
        onOpenChange={setNewBookingDialogOpen}
        clients={mockClients}
        carers={mockCarers}
        onCreateBooking={handleCreateBooking}
        initialData={newBookingData}
      />
      
      <EditBookingDialog
        open={editBookingDialogOpen}
        onOpenChange={setEditBookingDialogOpen}
        booking={selectedBooking}
        clients={mockClients}
        carers={mockCarers}
        onUpdateBooking={handleUpdateBooking}
      />
    </div>;
};
