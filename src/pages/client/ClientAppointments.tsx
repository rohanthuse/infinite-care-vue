
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, User, Star, MessageSquare, RotateCcw } from "lucide-react";
import { useClientAppointments } from "@/hooks/useClientAppointments";
import { SubmitReviewDialog } from "@/components/client/SubmitReviewDialog";
import { ViewReviewDialog } from "@/components/client/ViewReviewDialog";
import { RescheduleAppointmentDialog } from "@/components/client/RescheduleAppointmentDialog";
import { useCheckExistingReview } from "@/hooks/useClientReviews";
import { ReviewPrompt } from "@/components/client/ReviewPrompt";
import { format, parseISO, isAfter, isSameDay } from "date-fns";
import { useClientAuth } from "@/hooks/useClientAuth";

interface AppointmentData {
  id: string;
  type: string;
  provider: string;
  date: string;
  time: string;
  client_id: string;
  staff_id?: string;
}

interface RescheduleAppointmentData {
  id: string;
  appointment_type: string;
  provider_name: string;
  appointment_date: string;
  appointment_time: string;
  location: string;
}

const ClientAppointments = () => {
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [viewReviewDialogOpen, setViewReviewDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentData | null>(null);
  const [selectedRescheduleAppointment, setSelectedRescheduleAppointment] = useState<RescheduleAppointmentData | null>(null);
  const [selectedReview, setSelectedReview] = useState(null);

  // Get authenticated client ID using centralized auth
  const { clientId, isAuthenticated } = useClientAuth();

  const { data: appointments, isLoading, error } = useClientAppointments(clientId || undefined);

  if (!isAuthenticated || !clientId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-500">Please log in to view your appointments.</p>
        </div>
      </div>
    );
  }

  // Filter appointments by status and date
  const now = new Date();
  const upcomingAppointments = appointments?.filter(app => {
    const appointmentDate = parseISO(app.appointment_date);
    const isFutureOrToday = isAfter(appointmentDate, now) || isSameDay(appointmentDate, now);
    return (app.status === 'confirmed' || app.status === 'scheduled') && isFutureOrToday;
  }) || [];
  
  const completedAppointments = appointments?.filter(app => {
    const appointmentDate = parseISO(app.appointment_date);
    const isPastDate = !isAfter(appointmentDate, now) && !isSameDay(appointmentDate, now);
    return app.status === 'completed' || (isPastDate && app.status === 'confirmed');
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'scheduled':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'rescheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleLeaveReview = (appointment: any) => {
    const appointmentData: AppointmentData = {
      id: appointment.id,
      type: appointment.appointment_type,
      provider: appointment.provider_name,
      date: appointment.appointment_date,
      time: appointment.appointment_time,
      client_id: appointment.client_id,
      staff_id: appointment.staff_id
    };
    setSelectedAppointment(appointmentData);
    setReviewDialogOpen(true);
  };

  const handleRescheduleAppointment = (appointment: any) => {
    const rescheduleData: RescheduleAppointmentData = {
      id: appointment.id,
      appointment_type: appointment.appointment_type,
      provider_name: appointment.provider_name,
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      location: appointment.location
    };
    setSelectedRescheduleAppointment(rescheduleData);
    setRescheduleDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your appointments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading appointments</h3>
        <p className="text-gray-600">Unable to load your appointments. Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Prompt for completed appointments */}
      <ReviewPrompt completedAppointments={completedAppointments.map(app => ({
        id: app.id,
        type: app.appointment_type,
        provider: app.provider_name,
        date: app.appointment_date,
        time: app.appointment_time,
        client_id: app.client_id,
        completed_at: app.updated_at
      }))} />

      {/* Upcoming Appointments */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-xl font-bold mb-6">Upcoming Appointments</h2>
        
        {upcomingAppointments.length > 0 ? (
          <div className="grid gap-4">
            {upcomingAppointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{appointment.appointment_type}</CardTitle>
                      <div className="flex items-center text-gray-600 mt-1">
                        <User className="h-4 w-4 mr-1" />
                        <span className="text-sm">{appointment.provider_name}</span>
                      </div>
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{format(parseISO(appointment.appointment_date), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{appointment.appointment_time}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{appointment.location}</span>
                    </div>
                  </div>
                  
                  {appointment.notes && (
                    <div className="mb-4 p-3 bg-gray-50 rounded border-l-4 border-blue-200">
                      <p className="text-sm text-gray-700">{appointment.notes}</p>
                    </div>
                  )}

                  {/* Reschedule Button */}
                  <div className="pt-3 border-t border-gray-100">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleRescheduleAppointment(appointment)}
                      className="w-full"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reschedule Appointment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming appointments</h3>
            <p className="text-gray-600">Your scheduled appointments will appear here.</p>
          </div>
        )}
      </div>

      {/* Past Appointments */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-xl font-bold mb-6">Past Appointments</h2>
        
        {completedAppointments.length > 0 ? (
          <div className="grid gap-4">
            {completedAppointments.map((appointment) => (
              <AppointmentWithReview 
                key={appointment.id} 
                appointment={appointment}
                onLeaveReview={handleLeaveReview}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No past appointments</h3>
            <p className="text-gray-600">Your completed appointments will appear here.</p>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <SubmitReviewDialog
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
        appointment={selectedAppointment}
      />

      <ViewReviewDialog
        open={viewReviewDialogOpen}
        onOpenChange={setViewReviewDialogOpen}
        review={selectedReview}
      />

      <RescheduleAppointmentDialog
        open={rescheduleDialogOpen}
        onOpenChange={setRescheduleDialogOpen}
        appointment={selectedRescheduleAppointment}
      />
    </div>
  );
};

// Component to handle individual appointment with review functionality
const AppointmentWithReview = ({ appointment, onLeaveReview }: any) => {
  const { clientId } = useClientAuth();
  const { data: existingReview } = useCheckExistingReview(clientId || '', appointment.id);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{appointment.appointment_type}</CardTitle>
            <div className="flex items-center text-gray-600 mt-1">
              <User className="h-4 w-4 mr-1" />
              <span className="text-sm">{appointment.provider_name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-800">
              {appointment.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
          <div className="flex items-center text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{format(parseISO(appointment.appointment_date), 'MMM d, yyyy')}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            <span>{appointment.appointment_time}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{appointment.location}</span>
          </div>
        </div>
        
        {appointment.notes && (
          <div className="mb-4 p-3 bg-gray-50 rounded border-l-4 border-blue-200">
            <p className="text-sm text-gray-700">{appointment.notes}</p>
          </div>
        )}

        {/* Review Section */}
        <div className="pt-3 border-t border-gray-100">
          {existingReview ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center text-green-600">
                <Star className="h-4 w-4 mr-1 fill-current" />
                <span className="text-sm">Review submitted ({existingReview.rating}/5 stars)</span>
              </div>
              <Button variant="outline" size="sm" disabled>
                <MessageSquare className="h-4 w-4 mr-1" />
                View Review
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onLeaveReview(appointment)}
              className="w-full"
            >
              <Star className="h-4 w-4 mr-1" />
              Leave a Review
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientAppointments;
