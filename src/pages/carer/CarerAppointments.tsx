
import React, { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format, addDays, subDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import CancelAppointmentDialog from "@/components/carer/CancelAppointmentDialog";

// Mock data for appointments with additional status types
const mockAppointments = [
  {
    id: "1",
    clientName: "Emma Thompson",
    time: "10:30 AM - 11:30 AM",
    date: new Date(),
    type: "Initial Assessment",
    location: "15 Oak Street, Milton Keynes",
    status: "Confirmed"
  },
  {
    id: "2",
    clientName: "Robert Johnson",
    time: "2:00 PM - 3:00 PM",
    date: new Date(),
    type: "Follow-up Visit",
    location: "42 Pine Avenue, Milton Keynes",
    status: "Confirmed"
  },
  {
    id: "3",
    clientName: "Sarah Williams",
    time: "4:30 PM - 5:30 PM",
    date: addDays(new Date(), 1),
    type: "Medication Review",
    location: "8 Cedar Lane, Milton Keynes",
    status: "Pending"
  },
  {
    id: "4",
    clientName: "John Miller",
    time: "9:00 AM - 10:00 AM",
    date: addDays(new Date(), 2),
    type: "Home Care Visit",
    location: "56 Elm Street, Milton Keynes",
    status: "pending_cancellation",
    cancellationReason: "illness",
    cancellationNotes: "I'm feeling unwell and don't want to risk spreading infection"
  }
];

const CarerAppointments: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
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

  const handleCancelRequest = (appointmentId: string, reason: string, notes: string) => {
    // In a real app, this would send data to the backend
    const updatedAppointments = mockAppointments.map(appointment => {
      if (appointment.id === appointmentId) {
        return {
          ...appointment,
          status: "pending_cancellation",
          cancellationReason: reason,
          cancellationNotes: notes
        };
      }
      return appointment;
    });
    
    // In a real implementation, we would update the state with the new appointments
    // For now, just show a success toast
    toast.success("Cancellation request submitted successfully", {
      description: "An administrator will review your request shortly."
    });
  };
  
  const getStatusBadgeStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "pending_cancellation":
        return "bg-purple-100 text-purple-800";
      case "admin_rejected":
        return "bg-rose-100 text-rose-800";
      case "needs_reallocation":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
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
  
  const filteredAppointments = mockAppointments.filter(appointment => {
    const appointmentDate = format(appointment.date, "yyyy-MM-dd");
    const selectedDate = format(currentDate, "yyyy-MM-dd");
    const dateMatches = appointmentDate === selectedDate;
    
    const searchMatches = 
      appointment.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const statusMatches = 
      statusFilter === "all" || 
      appointment.status.toLowerCase() === statusFilter.toLowerCase();
    
    return dateMatches && searchMatches && statusMatches;
  });

  const canCancelAppointment = (appointment: any) => {
    // Can only cancel appointments that are Confirmed or Pending
    return ["confirmed", "pending"].includes(appointment.status.toLowerCase());
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Appointments</h1>
      
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formattedDate}</span>
            </Button>
            <Button variant="outline" size="icon" onClick={handleNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="pending_cancellation">Cancellation Pending</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="relative w-full sm:w-[250px]">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input 
                className="pl-8"
                placeholder="Search by client or type" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((appointment) => (
            <Card key={appointment.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedAppointment(appointment)}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3 mb-3 sm:mb-0">
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
                          <span>{appointment.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <Badge variant="outline" className={getStatusBadgeStyles(appointment.status)}>
                      {getStatusDisplay(appointment.status)}
                    </Badge>
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
      
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
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
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{format(selectedAppointment.date, "EEEE, MMMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{selectedAppointment.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{selectedAppointment.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>Appointment Type: {selectedAppointment.type}</span>
                </div>
              </div>
              
              {selectedAppointment.status === "pending_cancellation" && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
                  <p className="text-sm text-purple-800 font-medium">Cancellation Request Pending</p>
                  <p className="text-xs text-purple-700 mt-1">
                    Your cancellation request is being reviewed by an administrator.
                  </p>
                </div>
              )}
              
              {selectedAppointment.status === "admin_rejected" && (
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
                
                {selectedAppointment.status === "Confirmed" && (
                  <Button>Start Appointment</Button>
                )}
                
                {canCancelAppointment(selectedAppointment) && (
                  <Button 
                    variant="outline" 
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCancelDialog(true);
                    }}
                  >
                    Request Cancellation
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedAppointment && (
        <CancelAppointmentDialog 
          open={showCancelDialog}
          onOpenChange={setShowCancelDialog}
          appointment={selectedAppointment}
          onCancelRequest={handleCancelRequest}
        />
      )}
    </div>
  );
};

export default CarerAppointments;
