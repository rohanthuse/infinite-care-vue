import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Search, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, addDays, subDays } from "date-fns";

// Mock data for appointments
const mockAppointments = [
  {
    id: "1",
    clientName: "Emma Thompson",
    clientId: "client1",
    time: "10:30 AM - 11:30 AM",
    address: "15 Oak Street, Milton Keynes",
    status: "Confirmed",
    date: new Date(),
    type: "Home Care Visit"
  },
  {
    id: "2",
    clientName: "James Wilson",
    clientId: "client2",
    time: "1:00 PM - 2:30 PM",
    address: "42 Pine Avenue, Milton Keynes",
    status: "Confirmed",
    date: new Date(),
    type: "Medication Administration"
  },
  {
    id: "3",
    clientName: "Margaret Brown",
    clientId: "client3",
    time: "4:00 PM - 5:00 PM",
    address: "8 Cedar Lane, Milton Keynes",
    status: "Pending",
    date: new Date(),
    type: "Home Care Visit"
  },
  {
    id: "4",
    clientName: "Robert Johnson",
    clientId: "client4",
    time: "9:30 AM - 10:30 AM",
    address: "23 Maple Drive, Milton Keynes",
    status: "Confirmed",
    date: addDays(new Date(), 1),
    type: "Physical Assessment"
  },
  {
    id: "5",
    clientName: "Elizabeth Davis",
    clientId: "client5",
    time: "2:00 PM - 3:00 PM",
    address: "17 Birch Road, Milton Keynes",
    status: "Confirmed",
    date: addDays(new Date(), 1),
    type: "Home Care Visit"
  }
];

const CarerSchedule: React.FC = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState("day");
  
  const formattedDate = format(currentDate, "EEEE, MMMM d, yyyy");
  
  const handlePrevDay = () => {
    setCurrentDate(subDays(currentDate, 1));
  };
  
  const handleNextDay = () => {
    setCurrentDate(addDays(currentDate, 1));
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleStartVisit = (appointmentId: string, clientId: string) => {
    navigate(`/carer-dashboard/active-visit/${clientId}/${appointmentId}`);
  };
  
  const filteredAppointments = mockAppointments.filter(appointment => {
    // Check if date matches
    const appointmentDate = format(appointment.date, "yyyy-MM-dd");
    const selectedDate = format(currentDate, "yyyy-MM-dd");
    const dateMatches = appointmentDate === selectedDate;
    
    // Check if search matches
    const searchMatches = 
      appointment.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Check if status matches
    const statusMatches = 
      statusFilter === "all" || 
      appointment.status.toLowerCase() === statusFilter.toLowerCase();
    
    return dateMatches && searchMatches && statusMatches;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Schedule</h1>
      
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span>{formattedDate}</span>
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-2">
            <Tabs defaultValue={view} onValueChange={(value) => setView(value)} className="w-full md:w-auto">
              <TabsList>
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="relative w-full md:w-[250px]">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input 
                className="pl-8"
                placeholder="Search by client or location" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      
      <Tabs value={view} className="mb-6">
        <TabsContent value="day" className="m-0">
          <div className="space-y-4">
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((appointment) => (
                <Card key={appointment.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium">
                          {appointment.clientName.split(" ").map(name => name[0]).join("")}
                        </div>
                        
                        <div>
                          <h3 className="font-medium">{appointment.clientName}</h3>
                          <div className="text-sm text-gray-500">{appointment.type}</div>
                          
                          <div className="flex flex-col mt-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Clock className="h-3.5 w-3.5 mr-1.5" />
                              <span>{appointment.time}</span>
                            </div>
                            <div className="flex items-center mt-1">
                              <MapPin className="h-3.5 w-3.5 mr-1.5" />
                              <span>{appointment.address}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium text-center ${
                          appointment.status === "Confirmed" 
                            ? "bg-green-100 text-green-700" 
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {appointment.status}
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleStartVisit(appointment.id, appointment.clientId)}
                          >
                            Start Visit
                          </Button>
                          <Button size="sm" variant="outline" className="w-full">Details</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="py-12 text-center bg-white border border-gray-200 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-6 w-6 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No appointments found</h3>
                <p className="text-gray-500 mt-2">There are no appointments scheduled for this day.</p>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="week">
          <div className="py-12 text-center bg-white border border-gray-200 rounded-lg">
            <p className="text-gray-500">Week view will be implemented soon.</p>
          </div>
        </TabsContent>
        <TabsContent value="month">
          <div className="py-12 text-center bg-white border border-gray-200 rounded-lg">
            <p className="text-gray-500">Month view will be implemented soon.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CarerSchedule;
