
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, MapPin, User, Star, BarChart } from "lucide-react";
import { RescheduleAppointmentDialog } from "@/components/client/RescheduleAppointmentDialog";
import { RequestAppointmentDialog } from "@/components/client/RequestAppointmentDialog";
import { SubmitReviewDialog } from "@/components/client/SubmitReviewDialog";
import { ViewReviewDialog } from "@/components/client/ViewReviewDialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useClientAppointments } from "@/hooks/useClientAppointments";

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
  const { upcomingAppointments, pastAppointments, loading } = useClientAppointments();

  // Mock reviews data - in a real app, this would come from the database
  const mockReviews = [
    {
      id: "review-101",
      appointmentId: 101,
      carerName: "Dr. Smith, Physical Therapist",
      date: "April 19, 2025",
      rating: 4,
      comment: "Very professional and thorough. Explained everything clearly and gave me helpful exercises to do at home.",
      submittedAt: "April 20, 2025"
    }
  ];

  const getReviewById = (reviewId: string) => {
    return mockReviews.find(review => review.id === reviewId);
  };

  const handleReschedule = (appointment: any) => {
    setSelectedAppointment({
      id: appointment.id,
      type: appointment.appointment_type,
      provider: appointment.provider_name,
      date: appointment.appointment_date,
      time: appointment.appointment_time,
      location: appointment.location,
      status: appointment.status
    });
    setIsRescheduling(true);
  };

  const handleRequestAppointment = () => {
    setIsRequesting(true);
  };

  const handleReview = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsReviewing(true);
  };

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

  const handleViewServiceReport = (appointment: any) => {
    navigate("/client-dashboard/service-reports");
    toast({
      title: "Service Report Loaded",
      description: `Viewing service report for ${appointment.appointment_type} on ${appointment.appointment_date}`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
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

  const renderAppointmentCard = (appointment: any) => (
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
              {appointment.appointment_date} • <Clock className="h-4 w-4 mx-2" /> {appointment.appointment_time}
            </div>
            
            <div className="text-sm text-gray-600 flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              {appointment.location}
            </div>
          </div>
          
          <div className="flex gap-2 mt-4 md:mt-0">
            {activeTab === "upcoming" && (appointment.status === "confirmed" || appointment.status === "pending") ? (
              <>
                <Button variant="outline" size="sm" onClick={() => handleReschedule(appointment)}>
                  Reschedule
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
                  Cancel
                </Button>
              </>
            ) : activeTab === "past" && appointment.status === "completed" ? (
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-xl font-bold mb-6">Your Appointments</h2>
        
        <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-6">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>
            <Button onClick={handleRequestAppointment}>Request Appointment</Button>
          </div>
          
          <TabsContent value="upcoming" className="space-y-4">
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map(renderAppointmentCard)
            ) : (
              <div className="text-center p-8">
                <p className="text-gray-500">No upcoming appointments.</p>
                <Button className="mt-4" onClick={handleRequestAppointment}>
                  Schedule New Appointment
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="past" className="space-y-4">
            {pastAppointments.length > 0 ? (
              pastAppointments.map(renderAppointmentCard)
            ) : (
              <div className="text-center p-8">
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
