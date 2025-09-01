
import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import { Calendar, Clock, MapPin, Plus, User, Edit } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NewBookingDialog } from "@/components/bookings/dialogs/NewBookingDialog";
import { EditBookingDialog } from "@/components/bookings/dialogs/EditBookingDialog";
import { useClientBookings } from "@/hooks/useClientBookings";
import { useBranchCarers } from "@/data/hooks/useBranchCarers";
import { useBranchServices } from "@/data/hooks/useBranchServices";
import { useCreateBooking } from "@/data/hooks/useCreateBooking";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

interface AppointmentsTabProps {
  clientId: string;
}

export const AppointmentsTab: React.FC<AppointmentsTabProps> = ({ clientId }) => {
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  
  const { data: bookings = [], isLoading, refetch } = useClientBookings(clientId);
  const params = useParams();
  const branchId = params.id;
  
  // Get carers and services for the booking dialog
  const { data: carers = [] } = useBranchCarers(branchId);
  const { data: services = [] } = useBranchServices(branchId);
  
  // Create booking mutation
  const createBookingMutation = useCreateBooking(branchId);

  const handleScheduleAppointment = () => {
    setIsScheduleDialogOpen(true);
  };

  const handleEditAppointment = (booking: any) => {
    setSelectedBooking(booking);
    setIsEditDialogOpen(true);
  };

  const handleCreateBooking = async (bookingData: any, selectedCarers: any[]) => {
    if (!branchId) {
      toast.error("Branch ID is required");
      return;
    }

    try {
      // Create a booking for each schedule and each day
      for (const schedule of bookingData.schedules) {
        const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        const selectedDays = days.filter(day => schedule[day]);
        
        for (const day of selectedDays) {
          const startTime = new Date(bookingData.fromDate);
          const endTime = new Date(bookingData.fromDate);
          
          // Set the time based on schedule
          const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
          const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
          
          startTime.setHours(startHour, startMinute, 0, 0);
          endTime.setHours(endHour, endMinute, 0, 0);

          const bookingInput = {
            branch_id: branchId,
            client_id: bookingData.clientId,
            staff_id: bookingData.carerId, // Individual carer ID passed from dialog
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            service_id: schedule.services?.[0] || null,
            status: "assigned",
            notes: bookingData.notes || null,
          };

          await createBookingMutation.mutateAsync(bookingInput);
        }
      }

      toast.success("Booking created successfully!");
      refetch(); // Refresh the bookings list
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error("Failed to create booking");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'assigned':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getAppointmentStatus = (booking: any) => {
    const now = new Date();
    const startTime = parseISO(booking.start_time);
    const endTime = parseISO(booking.end_time);

    if (now > endTime) {
      return 'completed';
    } else if (now >= startTime) {
      return 'in-progress';
    } else {
      return booking.status || 'confirmed';
    }
  };

  const canEditAppointment = (booking: any) => {
    const now = new Date();
    const startTime = parseISO(booking.start_time);
    return now < startTime; // Can only edit if appointment hasn't started
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Appointments</CardTitle>
            </div>
            <Button size="sm" className="gap-1" onClick={handleScheduleAppointment}>
              <Plus className="h-4 w-4" />
              <span>Schedule</span>
            </Button>
          </div>
          <CardDescription>Scheduled appointments for client {clientId}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No appointments scheduled for this client</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const startDate = parseISO(booking.start_time);
                const endDate = parseISO(booking.end_time);
                const currentStatus = getAppointmentStatus(booking);
                const canEdit = canEditAppointment(booking);
                
                return (
                  <div 
                    key={booking.id} 
                    className={`border rounded-lg p-4 transition-all ${
                      canEdit ? 'hover:shadow-md cursor-pointer hover:bg-gray-50' : 'hover:shadow-sm'
                    }`}
                    onClick={() => canEdit && handleEditAppointment(booking)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium">{booking.service_name || 'Service Not Selected'}</h3>
                          <Badge variant="outline" className={getStatusColor(currentStatus)}>
                            {currentStatus === 'in-progress' ? 'In Progress' : 
                             currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                          </Badge>
                          {canEdit && (
                            <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-200">
                              Click to Edit
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(startDate, 'MMM dd, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{booking.staff_name || 'Staff Not Assigned'}</span>
                          </div>
                          {booking.revenue && (
                            <div className="flex items-center gap-1">
                              <span>Revenue: £{booking.revenue}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditAppointment(booking);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <NewBookingDialog
        open={isScheduleDialogOpen}
        onOpenChange={setIsScheduleDialogOpen}
        onCreateBooking={handleCreateBooking}
        carers={carers}
        services={services}
        branchId={branchId}
        preSelectedClientId={clientId}
      />

      <EditBookingDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        booking={selectedBooking}
        services={services}
        branchId={branchId}
      />
    </div>
  );
};
