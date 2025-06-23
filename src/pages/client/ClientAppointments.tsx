
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, User, Star, BarChart, AlertCircle } from "lucide-react";
import { RescheduleAppointmentDialog } from "@/components/client/RescheduleAppointmentDialog";
import { RequestAppointmentDialog } from "@/components/client/RequestAppointmentDialog";
import { SubmitReviewDialog } from "@/components/client/SubmitReviewDialog";
import { ViewReviewDialog } from "@/components/client/ViewReviewDialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useClientAppointments } from "@/hooks/useClientData";
import { format, parseISO, isValid, isPast, isToday, isFuture } from "date-fns";

const ClientAppointments = () => {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isViewingReview, setIsViewingReview] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch real appointment data
  const { data: appointments, isLoading, error } = useClientAppointments();

  // Helper function to safely parse dates
  const safeParseDateString = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    try {
      const parsed = parseISO(dateString);
      return isValid(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  // Separate appointments into upcoming and past
  const upcomingAppointments = appointments?.filter(apt => {
    const appointmentDate = safeParseDateString(apt.appointment_date);
    return appointmentDate && (isFuture(appointmentDate) || isToday(appointmentDate));
  }) || [];

  const pastAppointments = appointments?.filter(apt => {
    const appointmentDate = safeParseDateString(apt.appointment_date);
    return appointmentDate && isPast(appointmentDate) && !isToday(appointmentDate);
  }) || [];

  // Mock review data (would be fetched from database in real implementation)
  const mockReviews = [
    {
      id: "review-101",
      appointmentId: 101,
      carerName: "Dr. Smith, Physical Therapist",
      date: "April 19, 2025",
      rating: 4,
      comment: "Very professional and thorough. Explained everything clearly and gave me helpful exercises to do at home.",
      submittedAt: "April 20, 2025"
    },
    {
      id: "review-102",
      appointmentId: 102,
      carerName: "Nurse Johnson",
      date: "April 12, 2025",
      rating: 5,
      comment: "Excellent service! Very caring and attentive to all my concerns.",
      submittedAt: "April 13, 2025"
    }
  ];

  // Function to find review by ID
  const getReviewById = (reviewId: string) => {
    return mockReviews.find(review => review.id === reviewId);
  };

  // Open reschedule dialog
  const handleReschedule = (appointment: any) => {
    const appointmentDate = safeParseDateString(appointment.appointment_date);
    setSelectedAppointment({
      id: appointment.id,
      type: appointment.appointment_type,
      provider: appointment.provider_name,
      date: appointmentDate ? format(appointmentDate, 'MMM d, yyyy') : 'Date pending',
      time: appointment.appointment_time,
      location: appointment.location,
      status: appointment.status
    });
    setIsRescheduling(true);
  };

  // Cancel appointment
  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      // In a real implementation, this would call a mutation to update the appointment status
      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been cancelled successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Open request appointment dialog
  const handleRequestAppointment = () => {
    setIsRequesting(true);
  };

  // Open submit review dialog
  const handleReview = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsReviewing(true);
  };

  // Open view review dialog
  const handleViewReview = (appointment: any) => {
    const review = getReviewById(appointment.reviewId);
    if (review) {
      setSelectedReview(review);
      setIsViewingReview(true);
    } else {
      toast({
        title: "Review not found",
        description: "Unable to load review details. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle view service report
  const handleViewServiceReport = (appointment: any) => {
    navigate("/client-dashboard/service-reports");
    
    toast({
      title: "Service Report Loaded",
      description: `Viewing service report for ${appointment.appointment_type} on ${format(safeParseDateString(appointment.appointment_date) || new Date(), 'MMM d, yyyy')}`,
    });
  };

  // Get status badge style
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load appointments</h3>
          <p className="text-gray-500">Please try refreshing the page or contact support if the problem persists.</p>
        </div>
      </div>
    );
  }

  // Render appointment card
  const renderAppointmentCard = (appointment: any, isPastAppointment: boolean = false) => {
    const appointmentDate = safeParseDateString(appointment.appointment_date);
    
    return (
      <Card key={appointment.id} className="mb-4">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start">
            <div className="space-y-3">
              <div className="flex items-center justify-between md:justify-start">
                <h3 className="text-lg font-bold">{appointment.appointment_type}</h3>
                <span className={`text-xs font-medium px-2 py-1 rounded-full md:ml-3 ${getStatusBadge(appointment.status)}`}>
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 flex items-center">
                <User className="h-4 w-4 mr-2" />
                {appointment.provider_name}
              </div>
              
              <div className="text-sm text-gray-600 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {appointmentDate ? format(appointmentDate, 'MMM d, yyyy') : 'Date pending'} • 
                <Clock className="h-4 w-4 mx-2" /> 
                {appointment.appointment_time || 'Time pending'}
              </div>
              
              {appointment.location && (
                <div className="text-sm text-gray-600 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {appointment.location}
                </div>
              )}

              {appointment.notes && (
                <div className="text-sm text-gray-600">
                  <strong>Notes:</strong> {appointment.notes}
                </div>
              )}
            </div>
            
            <div className="flex gap-2 mt-4 md:mt-0">
              {!isPastAppointment && (appointment.status === "confirmed" || appointment.status === "pending") ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => handleReschedule(appointment)}>
                    Reschedule
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleCancelAppointment(appointment.id)}
                  >
                    Cancel
                  </Button>
                </>
              ) : isPastAppointment && appointment.status === "completed" ? (
                <>
                  <Button size="sm" onClick={() => handleReview(appointment)} className="gap-1">
                    <Star className="h-4 w-4 mr-1" />
                    Leave Feedback
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleViewServiceReport(appointment)} className="gap-1">
                    <BarChart className="h-4 w-4 mr-1" />
                    View Service Report
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-xl font-bold mb-6">Your Appointments</h2>
        
        <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past ({pastAppointments.length})
              </TabsTrigger>
            </TabsList>
            <Button onClick={handleRequestAppointment}>Request Appointment</Button>
          </div>
          
          <TabsContent value="upcoming" className="space-y-4">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map(appointment => renderAppointmentCard(appointment, false))
            ) : (
              <div className="text-center p-8">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No upcoming appointments.</p>
                <Button className="mt-4" onClick={handleRequestAppointment}>Schedule New Appointment</Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="past" className="space-y-4">
            {pastAppointments.length > 0 ? (
              pastAppointments.map(appointment => renderAppointmentCard(appointment, true))
            ) : (
              <div className="text-center p-8">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No past appointment records.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      {selectedAppointment && (
        <RescheduleAppointmentDialog
          open={isRescheduling}
          onOpenChange={setIsRescheduling}
          appointment={selectedAppointment}
        />
      )}

      <RequestAppointmentDialog
        open={isRequesting}
        onOpenChange={setIsRequesting}
      />
      
      {selectedAppointment && (
        <SubmitReviewDialog
          open={isReviewing}
          onOpenChange={setIsReviewing}
          appointment={selectedAppointment}
        />
      )}
      
      {selectedReview && (
        <ViewReviewDialog
          open={isViewingReview}
          onOpenChange={setIsViewingReview}
          review={selectedReview}
        />
      )}
    </div>
  );
};

export default ClientAppointments;
