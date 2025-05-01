
import React, { useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Search, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { format, addDays, subDays, addMonths, subMonths, addWeeks, subWeeks, startOfWeek, endOfWeek, isSameMonth, isSameDay, startOfMonth, endOfMonth, getDay, eachDayOfInterval, isToday } from "date-fns";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import CancelAppointmentDialog from "@/components/carer/CancelAppointmentDialog";
import ReallocateAppointmentDialog from "@/components/bookings/ReallocateAppointmentDialog";

// Mock data for appointments with additional status types
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
    status: "pending_cancellation",
    date: addDays(new Date(), 1),
    type: "Home Care Visit",
    cancellationReason: "scheduling_conflict",
    cancellationNotes: "I have a doctor's appointment at this time"
  }
];

const CarerSchedule: React.FC = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState("day");
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showReallocateDialog, setShowReallocateDialog] = useState(false);
  
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
    const appointment = mockAppointments.find(app => app.id === appointmentId);
    if (appointment) {
      setSelectedAppointment(appointment);
    }
  };

  const handleCancelRequest = (appointmentId: string, reason: string, notes: string) => {
    // In a real app, this would send data to the backend
    toast.success("Cancellation request submitted successfully", {
      description: "An administrator will review your request shortly."
    });
    
    setShowCancelDialog(false);
    setSelectedAppointment(null);
  };
  
  const handleReallocate = (appointmentId: string, newCarerId: string) => {
    // In a real app, this would send data to the backend
    toast.success("Appointment reallocated successfully", {
      description: "The new carer has been assigned to this appointment."
    });
    
    setShowReallocateDialog(false);
    setSelectedAppointment(null);
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-amber-100 text-amber-700";
      case "completed":
        return "bg-blue-100 text-blue-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      case "pending_cancellation":
        return "bg-purple-100 text-purple-700";
      case "admin_rejected":
        return "bg-rose-100 text-rose-700";
      case "needs_reallocation":
        return "bg-indigo-100 text-indigo-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending_cancellation":
        return "Cancellation Pending";
      case "admin_rejected":
        return "Cancellation Rejected";
      case "needs_reallocation":
        return "Pending Reallocation";
      default:
        return status;
    }
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

  // Check if an appointment can be cancelled
  const canCancelAppointment = (appointment: any) => {
    // Can only cancel appointments that are Confirmed or Pending
    return ["confirmed", "pending"].includes(appointment.status.toLowerCase());
  };

  // Get the calendar days for the current month view
  const getMonthCalendarDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Week starts on Monday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: startDate, end: endDate });
  };

  // Get appointment background color based on status
  const getAppointmentColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 border-green-300 text-green-800";
      case "pending":
        return "bg-amber-100 border-amber-300 text-amber-800";
      case "pending_cancellation":
        return "bg-purple-100 border-purple-300 text-purple-800";
      case "completed":
        return "bg-blue-100 border-blue-300 text-blue-800";
      case "cancelled":
        return "bg-red-100 border-red-300 text-red-800";
      default:
        return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  // Format time to shorter display
  const formatShortTime = (timeString: string) => {
    return timeString.replace(/(\d{1,2}:\d{2}) (AM|PM) - (\d{1,2}:\d{2}) (AM|PM)/, "$1$2");
  };

  // Render the enhanced month view
  const renderMonthView = () => {
    const days = getMonthCalendarDays();
    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Month header with current month/year */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">
            {format(currentDate, "MMMM yyyy")}
          </h2>
        </div>
        
        {/* Week day headers */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
          {weekDays.map((day) => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dayAppointments = getAppointmentsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isSelectedDay = isSameDay(day, currentDate);
            const isTodayDate = isToday(day);
            
            return (
              <div
                key={i}
                className={`min-h-[120px] p-1 border-b border-r relative ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                } ${isSelectedDay ? 'ring-2 ring-med-300 ring-inset' : ''}`}
                onClick={() => setCurrentDate(day)}
              >
                {/* Day number */}
                <div className={`text-right p-1 ${
                  isCurrentMonth ? 'text-gray-800' : 'text-gray-400'
                } ${isTodayDate ? 'font-bold' : ''}`}>
                  <span className={`inline-block w-6 h-6 text-center rounded-full ${
                    isTodayDate ? 'bg-med-500 text-white' : ''
                  }`}>
                    {format(day, "d")}
                  </span>
                </div>
                
                {/* Appointments for the day */}
                <div className="mt-1 space-y-1 max-h-[100px] overflow-y-auto hide-scrollbar">
                  {dayAppointments.length > 0 ? (
                    dayAppointments.slice(0, 3).map((appointment) => (
                      <div
                        key={appointment.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(appointment.id);
                        }}
                        className={`p-1 rounded text-xs border cursor-pointer ${getAppointmentColor(appointment.status)}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate" title={appointment.clientName}>
                            {appointment.clientName.length > 15 
                              ? `${appointment.clientName.substring(0, 15)}...` 
                              : appointment.clientName}
                          </span>
                        </div>
                        <div className="text-[10px] mt-0.5 flex items-center">
                          <Clock className="w-3 h-3 inline mr-0.5" />
                          {formatShortTime(appointment.time)}
                        </div>
                      </div>
                    ))
                  ) : null}
                  
                  {/* Show more indicator if there are more than 3 appointments */}
                  {dayAppointments.length > 3 && (
                    <div className="text-center text-xs text-gray-500 bg-gray-100 rounded p-0.5 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentDate(day);
                        setView("day");
                      }}>
                      +{dayAppointments.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Selected day appointments list */}
        <div className="border-t border-gray-200 p-4">
          <h3 className="text-base font-medium mb-4">
            Appointments on {format(currentDate, "MMMM d, yyyy")}
          </h3>
          
          {getAppointmentsForDay(currentDate).length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <CalendarDays className="h-8 w-8 mx-auto opacity-50 mb-2" />
              <p>No appointments scheduled for this day</p>
            </div>
          ) : (
            <div className="space-y-3">
              {getAppointmentsForDay(currentDate).map((appointment) => (
                <Card key={appointment.id} className="overflow-hidden">
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
                          getStatusBadgeStyles(appointment.status)
                        }`}>
                          {getStatusDisplay(appointment.status)}
                        </div>
                        
                        <div className="flex gap-2">
                          {canCancelAppointment(appointment) && (
                            <>
                              <Button 
                                size="sm" 
                                className="w-full"
                                onClick={() => handleStartVisit(appointment.id)}
                                disabled={appointment.status.toLowerCase() !== "confirmed"}
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
                            </>
                          )}
                          
                          {appointment.status.toLowerCase() === "pending_cancellation" && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full"
                              onClick={() => handleViewDetails(appointment.id)}
                            >
                              View Status
                            </Button>
                          )}
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

  // Render the enhanced week view
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
                          appointment.status.toLowerCase() === "confirmed" 
                            ? "bg-green-100 text-green-700 border-l-2 border-green-600" 
                            : appointment.status.toLowerCase() === "pending_cancellation"
                            ? "bg-purple-100 text-purple-700 border-l-2 border-purple-600"
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
                          
                          {canCancelAppointment(appointment) && (
                            <Button 
                              size="sm"
                              variant="ghost"
                              className="h-5 px-1.5 text-[10px]"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartVisit(appointment.id);
                              }}
                              disabled={appointment.status.toLowerCase() !== "confirmed"}
                            >
                              Start
                            </Button>
                          )}
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
                <SelectItem value="pending_cancellation">Cancellation Pending</SelectItem>
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
                          getStatusBadgeStyles(appointment.status)
                        }`}>
                          {getStatusDisplay(appointment.status)}
                        </div>
                        
                        <div className="flex gap-2">
                          {canCancelAppointment(appointment) && (
                            <>
                              <Button 
                                size="sm" 
                                className="w-full"
                                onClick={() => handleStartVisit(appointment.id)}
                                disabled={appointment.status.toLowerCase() !== "confirmed"}
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
                            </>
                          )}
                          
                          {appointment.status.toLowerCase() === "pending_cancellation" && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="w-full"
                              onClick={() => handleViewDetails(appointment.id)}
                            >
                              View Status
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="py-12 text-center bg-white border border-gray-200 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <CalendarDays className="h-6 w-6 text-gray-500" />
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
      
      {/* Appointment Detail Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={(open) => {
        if (!open) setSelectedAppointment(null);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedAppointment && (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-medium">
                    {selectedAppointment.clientName.split(" ").map(name => name[0]).join("")}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedAppointment.clientName}</h3>
                    <Badge variant="outline" className={getStatusBadgeStyles(selectedAppointment.status)}>
                      {getStatusDisplay(selectedAppointment.status)}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    <span>{format(selectedAppointment.date, "EEEE, MMMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{selectedAppointment.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{selectedAppointment.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-gray-500" />
                    <span>Appointment Type: {selectedAppointment.type}</span>
                  </div>
                </div>
                
                {selectedAppointment.status.toLowerCase() === "pending_cancellation" && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
                    <p className="text-sm text-purple-800 font-medium">Cancellation Request Pending</p>
                    <p className="text-xs text-purple-700 mt-1">
                      Your cancellation request is being reviewed by an administrator.
                    </p>
                  </div>
                )}
                
                {selectedAppointment.status.toLowerCase() === "admin_rejected" && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-md">
                    <p className="text-sm text-rose-800 font-medium">Cancellation Request Rejected</p>
                    <p className="text-xs text-rose-700 mt-1">
                      Your cancellation request has been rejected. Please contact your supervisor for more information.
                    </p>
                  </div>
                )}
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setSelectedAppointment(null)}>
                    Close
                  </Button>
                  
                  {canCancelAppointment(selectedAppointment) && (
                    <Button 
                      variant="outline" 
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => setShowCancelDialog(true)}
                    >
                      Request Cancellation
                    </Button>
                  )}
                  
                  {selectedAppointment.status.toLowerCase() === "confirmed" && (
                    <Button onClick={() => handleStartVisit(selectedAppointment.id)}>
                      Start Visit
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Cancel Appointment Dialog */}
      {selectedAppointment && (
        <CancelAppointmentDialog 
          open={showCancelDialog}
          onOpenChange={setShowCancelDialog}
          appointment={selectedAppointment}
          onCancelRequest={handleCancelRequest}
        />
      )}
      
      {/* Reallocate Appointment Dialog */}
      {selectedAppointment && (
        <ReallocateAppointmentDialog 
          open={showReallocateDialog}
          onOpenChange={setShowReallocateDialog}
          appointment={selectedAppointment}
          onReallocate={handleReallocate}
        />
      )}
    </div>
  );
};

export default CarerSchedule;
