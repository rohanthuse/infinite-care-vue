
import React, { useState } from "react";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, Plus, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NewBookingDialog } from "@/components/bookings/dialogs/NewBookingDialog";
import { useClientBookings } from "@/hooks/useClientBookings";
import { useBranchCarers } from "@/data/hooks/useBranchCarers";
import { useBranchServices } from "@/data/hooks/useBranchServices";
import { useParams } from "react-router-dom";

interface AppointmentsTabProps {
  clientId: string;
}

export const AppointmentsTab: React.FC<AppointmentsTabProps> = ({ clientId }) => {
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const { data: bookings = [], isLoading } = useClientBookings(clientId);
  const params = useParams();
  const branchId = params.id;
  
  // Get carers and services for the booking dialog
  const { data: carers = [] } = useBranchCarers(branchId);
  const { data: services = [] } = useBranchServices(branchId);

  const handleScheduleAppointment = () => {
    setIsScheduleDialogOpen(true);
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
                const startDate = new Date(booking.start_time);
                const endDate = new Date(booking.end_time);
                
                return (
                  <div key={booking.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{booking.service_name}</h3>
                          <Badge variant="outline" className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{format(startDate, 'MMM dd, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{booking.staff_name}</span>
                          </div>
                          {booking.revenue && (
                            <div className="flex items-center gap-1">
                              <span>Revenue: £{booking.revenue}</span>
                            </div>
                          )}
                        </div>
                      </div>
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
        onCreateBooking={() => {}}
        carers={carers}
        services={services}
        branchId={branchId}
        preSelectedClientId={clientId}
      />
    </div>
  );
};
