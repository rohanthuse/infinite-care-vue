import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText, CreditCard, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientCarePlanDetailDialog } from "@/components/client/ClientCarePlanDetailDialog";
import { RescheduleAppointmentDialog } from "@/components/client/RescheduleAppointmentDialog";
import { useClientProfile, useClientCarePlans, useClientAppointments, useClientBilling } from "@/hooks/useClientData";
import { useClientCarePlansWithDetails } from "@/hooks/useCarePlanData";
import { format, parseISO, differenceInDays, isValid } from "date-fns";

const ClientOverview = () => {
  // Get authenticated client ID from localStorage
  const getClientId = () => {
    const clientId = localStorage.getItem("clientId");
    if (!clientId) {
      console.error("No authenticated client ID found");
      return null;
    }
    return clientId;
  };

  const clientId = getClientId();
  const { data: clientProfile, isLoading: profileLoading, error: profileError } = useClientProfile(clientId);
  const { data: carePlans, isLoading: carePlansLoading, error: carePlansError } = useClientCarePlans(clientId);
  const { data: carePlansWithDetails, isLoading: carePlansDetailsLoading } = useClientCarePlansWithDetails(clientId || '');
  const { data: appointments, isLoading: appointmentsLoading, error: appointmentsError } = useClientAppointments(clientId);
  const { data: billing, isLoading: billingLoading, error: billingError } = useClientBilling(clientId);
  
  const [carePlanDialogOpen, setCarePlanDialogOpen] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  // Handle reschedule button click
  const handleReschedule = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsRescheduling(true);
  };

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

  // Show authentication error if no client ID
  if (!clientId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-500">Please log in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (profileLoading || carePlansLoading || appointmentsLoading || billingLoading || carePlansDetailsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show error state
  if (profileError || carePlansError || appointmentsError || billingError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load data</h3>
          <p className="text-gray-500">Please try refreshing the page or contact support if the problem persists.</p>
        </div>
      </div>
    );
  }

  // Get upcoming appointments (next 30 days)
  const upcomingAppointments = appointments?.filter(apt => {
    const appointmentDate = safeParseDateString(apt.appointment_date);
    if (!appointmentDate) return false;
    const today = new Date();
    const daysDiff = differenceInDays(appointmentDate, today);
    return daysDiff >= 0 && daysDiff <= 30;
  }) || [];

  // Get active care plans - use the detailed version for the dialog
  const activeCarePlans = carePlans?.filter(plan => plan.status?.toLowerCase() === 'active') || [];
  const activeCarePlansWithDetails = carePlansWithDetails?.filter(plan => plan.status?.toLowerCase() === 'active') || [];

  // Calculate next review date
  const nextReview = activeCarePlans.find(plan => plan.review_date)?.review_date;
  const daysUntilReview = nextReview ? (() => {
    const reviewDate = safeParseDateString(nextReview);
    return reviewDate ? differenceInDays(reviewDate, new Date()) : null;
  })() : null;

  // Calculate total amount due from billing
  const totalAmountDue = billing?.reduce((sum, bill) => sum + (bill.amount || 0), 0) || 0;
  const nextDueDate = billing?.[0]?.due_date;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-xl">
        <h2 className="text-2xl font-bold">
          Welcome back, {clientProfile?.preferred_name || clientProfile?.first_name || 'Client'}
        </h2>
        <p className="mt-2 text-blue-100">
          Welcome to your personal health dashboard. Here's a summary of your care plan and upcoming appointments.
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {upcomingAppointments.length > 0 ? (() => {
                const nextDate = safeParseDateString(upcomingAppointments[0].appointment_date);
                return nextDate ? `Next: ${format(nextDate, 'MMM d')}` : 'Date pending';
              })() : 'No upcoming appointments'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Care Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{activeCarePlans.length}</div>
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {activeCarePlans.length > 0 ? (() => {
                const updatedDate = safeParseDateString(activeCarePlans[0].updated_at);
                return updatedDate ? `Updated: ${format(updatedDate, 'MMM d')}` : 'Recently updated';
              })() : 'No active care plans'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Payment Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">£{totalAmountDue.toFixed(2)}</div>
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {nextDueDate ? (() => {
                const dueDate = safeParseDateString(nextDueDate);
                return dueDate ? `Due: ${format(dueDate, 'MMM d, yyyy')}` : 'Due date pending';
              })() : totalAmountDue > 0 ? 'Payment pending' : 'No outstanding payments'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Next Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {daysUntilReview !== null ? `${daysUntilReview} Days` : 'N/A'}
              </div>
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {nextReview ? (() => {
                const reviewDate = safeParseDateString(nextReview);
                return reviewDate ? `Care Plan Review: ${format(reviewDate, 'MMM d')}` : 'Review date pending';
              })() : 'No review scheduled'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Upcoming Appointments */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold">Upcoming Appointments</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.slice(0, 3).map((appointment) => {
              const appointmentDate = safeParseDateString(appointment.appointment_date);
              return (
                <div key={appointment.id} className="p-6 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{appointment.appointment_type}</p>
                    <p className="text-sm text-gray-500">{appointment.provider_name}</p>
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>
                        {appointmentDate 
                          ? `${format(appointmentDate, 'MMM d, yyyy')} • ${appointment.appointment_time}`
                          : 'Date and time pending'
                        }
                      </span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => handleReschedule({
                      id: appointment.id,
                      type: appointment.appointment_type,
                      provider: appointment.provider_name,
                      date: appointmentDate ? format(appointmentDate, 'MMM d, yyyy') : 'Date pending',
                      time: appointment.appointment_time,
                      location: appointment.location,
                      status: appointment.status
                    })}
                  >
                    Reschedule
                  </Button>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-gray-500">
              No upcoming appointments scheduled
            </div>
          )}
        </div>
      </div>
      
      {/* Care Plan Summary */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-bold">Care Plan Summary</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCarePlanDialogOpen(true)}
            disabled={activeCarePlansWithDetails.length === 0}
          >
            View Full Plan
          </Button>
        </div>
        <div className="p-6">
          {activeCarePlans.length > 0 ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">Active Care Plan</h4>
                <p className="text-sm text-gray-600 mt-1">{activeCarePlans[0].title}</p>
                <p className="text-sm text-gray-500">Provider: {activeCarePlans[0].provider_name}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">Progress</h4>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${activeCarePlans[0].goals_progress || 0}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {activeCarePlans[0].goals_progress || 0}% complete
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">Next Steps</h4>
                <p className="mt-1 text-sm text-gray-600">
                  {nextReview ? (() => {
                    const reviewDate = safeParseDateString(nextReview);
                    return reviewDate 
                      ? `Your next care plan review is scheduled for ${format(reviewDate, 'MMM d, yyyy')}. Please complete your weekly self-assessment forms before this date.`
                      : 'Your care plan review is being scheduled. Please complete your weekly self-assessment forms.';
                  })() : 'Continue following your care plan. Contact your provider if you have any questions.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>No active care plans found.</p>
              <p className="text-sm mt-1">Contact your provider to set up a care plan.</p>
            </div>
          )}
        </div>
      </div>

      {/* Care Plan Detail Dialog */}
      {activeCarePlansWithDetails.length > 0 && (
        <ClientCarePlanDetailDialog
          open={carePlanDialogOpen}
          onOpenChange={setCarePlanDialogOpen}
          carePlan={activeCarePlansWithDetails[0]}
        />
      )}

      {/* Reschedule Appointment Dialog */}
      {selectedAppointment && (
        <RescheduleAppointmentDialog
          open={isRescheduling}
          onOpenChange={setIsRescheduling}
          appointment={selectedAppointment}
        />
      )}
    </div>
  );
};

export default ClientOverview;
