
import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Search, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, addDays, subDays, addMonths, subMonths, addWeeks, subWeeks, startOfWeek, endOfWeek, isSameMonth, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";

// Mock data for appointments
const mockAppointments = [
  {
    id: "1",
    clientName: "Emma Thompson",
    time: "10:30 AM - 11:30 AM",
    address: "15 Oak Street, Milton Keynes",
    status: "Confirmed",
    date: new Date(),
    type: "Home Care Visit"
  },
  {
    id: "2",
    clientName: "James Wilson",
    time: "1:00 PM - 2:30 PM",
    address: "42 Pine Avenue, Milton Keynes",
    status: "Confirmed",
    date: new Date(),
    type: "Medication Administration"
  },
  {
    id: "3",
    clientName: "Margaret Brown",
    time: "4:00 PM - 5:00 PM",
    address: "8 Cedar Lane, Milton Keynes",
    status: "Pending",
    date: new Date(),
    type: "Home Care Visit"
  },
  {
    id: "4",
    clientName: "Robert Johnson",
    time: "9:30 AM - 10:30 AM",
    address: "23 Maple Drive, Milton Keynes",
    status: "Confirmed",
    date: addDays(new Date(), 1),
    type: "Physical Assessment"
  },
  {
    id: "5",
    clientName: "Elizabeth Davis",
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
    if (view === "day") {
      setCurrentDate(subDays(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (view === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };
  
  const handleNextDay = () => {
    if (view === "day") {
      setCurrentDate(addDays(currentDate, 1));
    } else if (view === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (view === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
  };
  
  const handleStartVisit = (appointmentId: string) => {
    navigate(`/carer-dashboard/visit/${appointmentId}`);
  };
  
  const handleViewDetails = (appointmentId: string) => {
    toast.info(`Viewing details for appointment ${appointmentId}`);
  };

  // Get week dates for the week view
  const getWeekDates = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Week starts on Monday
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  };
  
  // Filter appointments based on date range and other filters
  const getFilteredAppointments = (start: Date, end: Date) => {
    return mockAppointments.filter(appointment => {
      // Check if date is within range
      const appointmentDate = new Date(appointment.date);
      const isInRange = appointmentDate >= start && appointmentDate <= end;
      
      // Check if search matches
      const searchMatches = 
        appointment.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appointment.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appointment.type.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Check if status matches
      const statusMatches = 
        statusFilter === "all" || 
        appointment.status.toLowerCase() === statusFilter.toLowerCase();
      
      return isInRange && searchMatches && statusMatches;
    });
  };

  const filteredDayAppointments = mockAppointments.filter(appointment => {
    // Check if date matches current day
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

  // Helper function to get appointments for a specific day
  const getAppointmentsForDay = (day: Date) => {
    return mockAppointments.filter(appointment => {
      const appointmentDate = format(appointment.date, "yyyy-MM-dd");
      const targetDate = format(day, "yyyy-MM-dd");
      return appointmentDate === targetDate && 
        (statusFilter === "all" || appointment.status.toLowerCase() === statusFilter.toLowerCase()) &&
        (
          appointment.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          appointment.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
          appointment.type.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });
  };

  // Get the first day of the current month
  const renderMonthView = () => {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <Calendar
          mode="single"
          selected={currentDate}
          onSelect={(date) => date && setCurrentDate(date)}
          className="mx-auto"
          classNames={{
            cell: "relative p-0 h-10 w-10",
            day: "h-10 w-10 p-0",
            day_selected: "bg-blue-100 text-blue-600 hover:bg-blue-100 hover:text-blue-600",
            day_today: "border border-blue-600"
          }}
          components={{
            DayContent: (props) => {
              const date = props.date;
              const appointments = getAppointmentsForDay(date);
              const isCurrentMonth = isSameMonth(date, currentDate);
              
              return (
                <div className={`h-full w-full flex flex-col items-center justify-start pt-1.5 
                  ${!isCurrentMonth ? 'opacity-40' : ''}`}
                >
                  <span className={`text-xs leading-none ${isSameDay(date, new Date()) ? 'font-bold' : ''}`}>
                    {format(date, "d")}
                  </span>
                  
                  {appointments.length > 0 && (
                    <div className="mt-1 flex flex-col items-center">
                      <div className={`h-1.5 w-1.5 rounded-full ${
                        appointments.some(a => a.status === "Confirmed") 
                          ? "bg-green-500" 
                          : "bg-amber-500"
                      }`} />
                      
                      {appointments.length > 1 && (
                        <span className="text-[10px] text-gray-600 mt-0.5">
                          +{appointments.length - 1}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            }
          }}
        />
        
        <div className="mt-6 space-y-2">
          <h3 className="text-base font-medium mb-2">Appointments on {format(currentDate, "MMMM d, yyyy")}</h3>
          {getAppointmentsForDay(currentDate).length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Calendar className="h-8 w-8 mx-auto opacity-50 mb-2" />
              <p>No appointments scheduled for this day</p>
            </div>
          ) : (
            <div className="space-y-2">
              {getAppointmentsForDay(currentDate).map((appointment) => (
                <Card key={appointment.id} className="mb-2">
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
                            onClick={() => handleStartVisit(appointment.id)}
                            disabled={appointment.status !== "Confirmed"}
                          >
                            Start Visit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full"
                            onClick={() => handleViewDetails(appointment.id)}
                          >
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDates();
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="grid grid-cols-7 gap-0 border-b">
          {weekDays.map((day, i) => (
            <div 
              key={i} 
              className={`p-2 text-center cursor-pointer ${
                isSameDay(day, new Date()) ? "bg-blue-50" : ""
              } ${isSameDay(day, currentDate) ? "border-b-2 border-blue-600" : ""}`}
              onClick={() => setCurrentDate(day)}
            >
              <div className="text-xs text-gray-600">{format(day, "EEE")}</div>
              <div className="text-sm font-medium">{format(day, "d")}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0 min-h-[400px]">
          {weekDays.map((day, i) => {
            const dayAppointments = getAppointmentsForDay(day);
            return (
              <div 
                key={i} 
                className={`p-2 border-r flex flex-col ${
                  isSameDay(day, new Date()) ? "bg-blue-50" : ""
                } ${i === 6 ? "border-r-0" : ""}`}
              >
                {dayAppointments.length === 0 ? (
                  <div className="text-center py-4 text-xs text-gray-400">
                    No appointments
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dayAppointments.map(appointment => (
                      <div 
                        key={appointment.id}
                        className={`p-2 rounded text-xs ${
                          appointment.status === "Confirmed" 
                            ? "bg-green-100 text-green-700 border-l-2 border-green-600" 
                            : "bg-amber-100 text-amber-700 border-l-2 border-amber-600"
                        } cursor-pointer hover:shadow-sm transition-shadow`}
                        onClick={() => handleViewDetails(appointment.id)}
                      >
                        <div className="font-medium">{appointment.clientName}</div>
                        <div className="mt-1">{appointment.time}</div>
                        <div className="mt-1 truncate" title={appointment.address}>
                          {appointment.address.length > 20 
                            ? `${appointment.address.substring(0, 20)}...` 
                            : appointment.address
                          }
                        </div>
                        <div className="mt-2 flex justify-between">
                          <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                            {appointment.type}
                          </Badge>
                          
                          <Button 
                            size="sm"
                            variant="ghost"
                            className="h-5 px-1.5 text-[10px]"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartVisit(appointment.id);
                            }}
                            disabled={appointment.status !== "Confirmed"}
                          >
                            Start
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

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
              <span>
                {view === "day" && formattedDate}
                {view === "week" && `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d")} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), "MMM d, yyyy")}`}
                {view === "month" && format(currentDate, "MMMM yyyy")}
              </span>
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
            {filteredDayAppointments.length > 0 ? (
              filteredDayAppointments.map((appointment) => (
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
                            onClick={() => handleStartVisit(appointment.id)}
                            disabled={appointment.status !== "Confirmed"}
                          >
                            Start Visit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full"
                            onClick={() => handleViewDetails(appointment.id)}
                          >
                            Details
                          </Button>
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
        <TabsContent value="week" className="m-0">
          {renderWeekView()}
        </TabsContent>
        <TabsContent value="month" className="m-0">
          {renderMonthView()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CarerSchedule;
