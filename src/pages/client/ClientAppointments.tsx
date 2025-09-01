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
import { usePendingReviews } from "@/hooks/usePendingReviews";
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

  console.log('[ClientAppointments] Client ID:', clientId, 'Is Authenticated:', isAuthenticated);

  const { data: appointments, isLoading, error } = useClientAppointments(clientId || undefined);
  const { data: pendingReviewAppointments } = usePendingReviews(clientId || "");

  console.log('[ClientAppointments] Appointments data:', appointments);
  console.log('[ClientAppointments] Loading:', isLoading, 'Error:', error);

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

  // Improved appointment categorization with better status handling
  const now = new Date();
  const upcomingAppointments = appointments?.filter(app => {
    const appointmentDate = parseISO(app.appointment_date);
    const isFutureOrToday = isAfter(appointmentDate, now) || isSameDay(appointmentDate, now);
    
    // Include confirmed, scheduled, assigned, and pending appointments that are in the future
    const isUpcomingStatus = ['confirmed', 'scheduled', 'assigned', 'pending'].includes(app.status.toLowerCase());
    
    console.log('[ClientAppointments] Checking upcoming:', {
      id: app.id,
      date: app.appointment_date,
      status: app.status,
      isFutureOrToday,
      isUpcomingStatus,
      included: isFutureOrToday && isUpcomingStatus
    });
    
    return isFutureOrToday && isUpcomingStatus;
  }) || [];
  
  const completedAppointments = appointments?.filter(app => {
    const appointmentDate = parseISO(app.appointment_date);
    const isPastDate = !isAfter(appointmentDate, now) && !isSameDay(appointmentDate, now);
    
    // Include completed, done, cancelled appointments, or past confirmed appointments
    const isCompletedStatus = ['completed', 'done', 'cancelled'].includes(app.status.toLowerCase());
    const isPastConfirmed = ['confirmed', 'assigned'].includes(app.status.toLowerCase()) && isPastDate;
    
    console.log('[ClientAppointments] Checking completed:', {
      id: app.id,
      date: app.appointment_date,
      status: app.status,
      isPastDate,
      isCompletedStatus,
      isPastConfirmed,
      included: isCompletedStatus || isPastConfirmed
    });
    
    return isCompletedStatus || isPastConfirmed;
  }) || [];

  console.log('[ClientAppointments] Filtered appointments:', {
    total: appointments?.length || 0,
    upcoming: upcomingAppointments.length,
    completed: completedAppointments.length
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'scheduled':
      case 'assigned':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
      case 'done':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAppointmentStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'done':
        return 'Completed';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
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
    console.error('[ClientAppointments] Error loading appointments:', error);
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading appointments</h3>
        <p className="text-gray-600 mb-4">Unable to load your appointments. Please try refreshing the page.</p>
        {error && (
          <p className="text-sm text-red-600">Error details: {error.message}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug info for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs">
          <strong>Debug Info:</strong> Client ID: {clientId}, Total appointments: {appointments?.length || 0}, 
          Upcoming: {upcomingAppointments.length}, Completed: {completedAppointments.length}
        </div>
      )}

      {/* Review Prompt for completed appointments */}
      <ReviewPrompt completedAppointments={pendingReviewAppointments || []} />

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
                      {formatAppointmentStatus(appointment.status)}
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
            {appointments && appointments.length > 0 && (
              <p className="text-sm text-blue-600 mt-2">
                You have {appointments.length} total appointment(s) in the system.
              </p>
            )}
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
                getStatusColor={getStatusColor}
                formatAppointmentStatus={formatAppointmentStatus}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No past appointments</h3>
            <p className="text-gray-600">Your completed appointments will appear here.</p>
            {appointments && appointments.length > 0 && (
              <p className="text-sm text-blue-600 mt-2">
                You have {appointments.length} total appointment(s) in the system.
              </p>
            )}
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
const AppointmentWithReview = ({ appointment, onLeaveReview, getStatusColor, formatAppointmentStatus }: any) => {
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
            <Badge className={getStatusColor(appointment.status)}>
              {formatAppointmentStatus(appointment.status)}
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
