
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, FileText, CreditCard, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientCarePlanDetailDialog } from "@/components/client/ClientCarePlanDetailDialog";
import { RescheduleAppointmentDialog } from "@/components/client/RescheduleAppointmentDialog";
import { useClientProfile, useClientCarePlans, useClientAppointments } from "@/hooks/useClientData";
import { useAuth } from "@/hooks/useAuth";
import { format, parseISO, differenceInDays } from "date-fns";

const ClientOverview = () => {
  const { user } = useAuth();
  const { data: clientProfile, isLoading: profileLoading } = useClientProfile();
  const { data: carePlans, isLoading: carePlansLoading } = useClientCarePlans();
  const { data: appointments, isLoading: appointmentsLoading } = useClientAppointments();
  
  const [carePlanDialogOpen, setCarePlanDialogOpen] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  // Handle reschedule button click
  const handleReschedule = (appointment: any) => {
    setSelectedAppointment(appointment);
    setIsRescheduling(true);
  };

  if (profileLoading || carePlansLoading || appointmentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Get upcoming appointments (next 30 days)
  const upcomingAppointments = appointments?.filter(apt => {
    const appointmentDate = parseISO(apt.appointment_date);
    const today = new Date();
    const daysDiff = differenceInDays(appointmentDate, today);
    return daysDiff >= 0 && daysDiff <= 30;
  }) || [];

  // Get active care plans
  const activeCarePlans = carePlans?.filter(plan => plan.status === 'active') || [];

  // Calculate next review date
  const nextReview = activeCarePlans.find(plan => plan.review_date)?.review_date;
  const daysUntilReview = nextReview ? differenceInDays(parseISO(nextReview), new Date()) : null;

  // Mock payment data (this would come from client_billing table)
  const mockPaymentDue = 150.00;

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
              {upcomingAppointments.length > 0 
                ? `Next: ${format(parseISO(upcomingAppointments[0].appointment_date), 'MMM d')}`
                : 'No upcoming appointments'
              }
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
              {activeCarePlans.length > 0 
                ? `Updated: ${format(parseISO(activeCarePlans[0].updated_at), 'MMM d')}`
                : 'No active care plans'
              }
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Payment Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">${mockPaymentDue.toFixed(2)}</div>
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Due: May 15, 2025</p>
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
              {nextReview ? `Care Plan Review: ${format(parseISO(nextReview), 'MMM d')}` : 'No review scheduled'}
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
            upcomingAppointments.slice(0, 3).map((appointment) => (
              <div key={appointment.id} className="p-6 flex justify-between items-center">
                <div>
                  <p className="font-medium">{appointment.appointment_type}</p>
                  <p className="text-sm text-gray-500">{appointment.provider_name}</p>
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>
                      {format(parseISO(appointment.appointment_date), 'MMM d, yyyy')} • {appointment.appointment_time}
                    </span>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => handleReschedule({
                    id: appointment.id,
                    type: appointment.appointment_type,
                    provider: appointment.provider_name,
                    date: format(parseISO(appointment.appointment_date), 'MMM d, yyyy'),
                    time: appointment.appointment_time,
                    location: appointment.location,
                    status: appointment.status
                  })}
                >
                  Reschedule
                </Button>
              </div>
            ))
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
            disabled={activeCarePlans.length === 0}
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
                  {nextReview 
                    ? `Your next care plan review is scheduled for ${format(parseISO(nextReview), 'MMM d, yyyy')}. Please complete your weekly self-assessment forms before this date.`
                    : 'Continue following your care plan. Contact your provider if you have any questions.'
                  }
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
      {activeCarePlans.length > 0 && (
        <ClientCarePlanDetailDialog
          open={carePlanDialogOpen}
          onOpenChange={setCarePlanDialogOpen}
          carePlan={activeCarePlans[0]}
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
