import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, RefreshCw } from "lucide-react";
import { DateNavigation } from "./DateNavigation";
import { BookingFilters } from "./BookingFilters";
import { BookingTimeGrid, Client, Carer, Booking } from "./BookingTimeGrid";
import { BookingsList } from "./BookingsList";
import { toast } from "sonner";

const mockClients: Client[] = [{
  id: "CL-001",
  name: "Pender, Eva",
  initials: "EP",
  bookingCount: 3
}, {
  id: "CL-002",
  name: "Fulcher, Patricia",
  initials: "FP",
  bookingCount: 2
}, {
  id: "CL-003",
  name: "Baulch, Ursula",
  initials: "BU",
  bookingCount: 1
}, {
  id: "CL-004",
  name: "Ren, Victoria",
  initials: "RV",
  bookingCount: 2
}, {
  id: "CL-005",
  name: "Iyaniwura, Ifeoluwa",
  initials: "II",
  bookingCount: 1
}, {
  id: "CL-006",
  name: "Careville Ltd",
  initials: "CL",
  bookingCount: 4
}, {
  id: "CL-007",
  name: "Johnson, Andrew",
  initials: "JA",
  bookingCount: 2
}, {
  id: "CL-008",
  name: "Mistry, Sanjay",
  initials: "MS",
  bookingCount: 3
}, {
  id: "CL-009",
  name: "Williams, Olivia",
  initials: "WO",
  bookingCount: 1
}, {
  id: "CL-010",
  name: "Thompson, Emma",
  initials: "TE",
  bookingCount: 2
}];
const mockCarers: Carer[] = [{
  id: "CA-001",
  name: "Charuma, Charmaine",
  initials: "CC",
  bookingCount: 4
}, {
  id: "CA-002",
  name: "Warren, Susan",
  initials: "WS",
  bookingCount: 3
}, {
  id: "CA-003",
  name: "Ayo-Famure, Opeyemi",
  initials: "AF",
  bookingCount: 3
}, {
  id: "CA-004",
  name: "Smith, John",
  initials: "SJ",
  bookingCount: 2
}, {
  id: "CA-005",
  name: "Williams, Mary",
  initials: "WM",
  bookingCount: 1
}, {
  id: "CA-006",
  name: "Davis, Michael",
  initials: "DM",
  bookingCount: 2
}, {
  id: "CA-007",
  name: "Brown, David",
  initials: "BD",
  bookingCount: 3
}, {
  id: "CA-008",
  name: "Miller, Sarah",
  initials: "MS",
  bookingCount: 2
}, {
  id: "CA-009",
  name: "Wilson, Thomas",
  initials: "WT",
  bookingCount: 1
}, {
  id: "CA-010",
  name: "Moore, Jennifer",
  initials: "MJ",
  bookingCount: 2
}];
const mockBookings: Booking[] = [{
  id: "BK-001",
  clientId: "CL-001",
  clientName: "Pender, Eva",
  clientInitials: "EP",
  carerId: "CA-001",
  carerName: "Charuma, Charmaine",
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
  startTime: "20:00",
  endTime: "21:00",
  date: new Date().toISOString().split('T')[0],
  status: "assigned"
}];

interface BookingsTabProps {
  branchId: string;
}

export const BookingsTab: React.FC<BookingsTabProps> = ({
  branchId
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewType, setViewType] = useState<"daily" | "weekly">("weekly"); // Default to weekly view
  const [activeTab, setActiveTab] = useState<string>("planning");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"client" | "group">("client");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["assigned", "in-progress"]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const additionalBookings: Booking[] = [{
      id: "BK-010",
      clientId: "CL-007",
      clientName: "Johnson, Andrew",
      clientInitials: "JA",
      carerId: "CA-006",
      carerName: "Davis, Michael",
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
      startTime: "16:30",
      endTime: "17:30",
      date: today,
      status: "cancelled",
      notes: "Client requested cancellation due to hospital appointment"
    }];
    mockBookings.push(...additionalBookings);
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Bookings refreshed successfully");
    }, 800);
  };

  const handleNewBooking = () => {
    toast.success("New booking function triggered", {
      description: "This feature will be implemented soon"
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white border border-gray-200 p-1 rounded-lg w-full lg:w-auto">
            <TabsTrigger 
              value="planning" 
              className="flex-1 lg:flex-initial data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Planning
            </TabsTrigger>
            <TabsTrigger 
              value="list" 
              className="flex-1 lg:flex-initial data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              List
            </TabsTrigger>
            <TabsTrigger 
              value="report" 
              className="flex-1 lg:flex-initial data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Report
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-3 w-full lg:w-auto justify-between">
          {activeTab === "planning" && (
            <DateNavigation 
              currentDate={currentDate} 
              onDateChange={setCurrentDate} 
              viewType={viewType} 
              onViewTypeChange={setViewType} 
            />
          )}
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} className="h-8 w-8 p-0" disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button className="h-8 bg-blue-600 hover:bg-blue-700" size="sm" onClick={handleNewBooking}>
              <Plus className="h-4 w-4 mr-1" />
              New
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
          />
          
          <BookingTimeGrid 
            date={currentDate} 
            bookings={mockBookings} 
            clients={mockClients} 
            carers={mockCarers} 
            viewType={viewType} 
            viewMode={viewMode} 
          />
        </>
      )}

      {activeTab === "list" && (
        <BookingsList bookings={mockBookings} />
      )}

      {activeTab === "report" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
          <h2 className="text-xl font-medium text-gray-700 mb-2">
            Booking Reports
          </h2>
          <p className="text-gray-500">
            This feature is under development. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
};
